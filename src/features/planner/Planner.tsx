import React, { useEffect, useMemo, useState } from 'react';
import { copy } from '../../copy/en';
import { conflictsWith, findClashes, formatClashMessage } from '../../core/clash';
import { toPlainText } from '../../core/export';
import { buildOptions, findOption, getOptionsForComponent } from '../../core/options';
import { getProgressSummary } from '../../core/progress';
import { decodeSchedule, encodeSchedule } from '../../core/sharing';
import type { Option, SemesterFile } from '../../core/types';
import { fetchSemester } from '../../data/loader';
import { getThreadColor } from '../../design/tokens';
import { navigate } from '../../router';
import { usePicksStore } from '../../state/picks';
import { useUIStore } from '../../state/ui';
import { BottomSheet, type SnapPoint } from '../../ui/BottomSheet';
import {
  CheckIcon,
  CloseIcon,
  KnotIcon,
  ListIcon,
  RefreshIcon,
  RotateDeviceIcon,
  ShareIcon,
  WeaveGridIcon,
} from '../../ui/icons';
import { OptionCard } from '../../ui/OptionCard';
import { Spool } from '../../ui/Spool';
import { WeekListView } from '../week/WeekListView';
import { Weave } from './Weave';

interface PlannerProps {
  semesterId: string;
  shareHash?: string;
}

export const Planner: React.FC<PlannerProps> = ({ semesterId, shareHash }) => {
  const [semester, setSemester] = useState<SemesterFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingSavedData, setUsingSavedData] = useState(false);
  const [sheetSnap, setSheetSnap] = useState<SnapPoint>('peek');
  const [dismissRotateTip, setDismissRotateTip] = useState(false);

  // Stores
  const {
    picksBySemester,
    needsAttention,
    setPick,
    removePick,
    setAllPicks,
    clearPicks,
    validatePicksAgainstSemester,
  } = usePicksStore();

  const {
    viewMode,
    setViewMode,
    selectedComponentId,
    setSelectedComponentId,
    previewCandidate,
    setPreviewCandidate,
    showToast,
    sharedSchedule,
    setSharedSchedule,
    isSectionChangeModalOpen,
    setSectionChangeModalOpen,
  } = useUIStore();

  const userPicks = useMemo(
    () => picksBySemester[semesterId] ?? {},
    [picksBySemester, semesterId]
  );

  // Fetch timetable data
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchSemester(semesterId, `/data/semester-${semesterId}.json`)
      .then((res) => {
        if (!mounted) return;
        setSemester(res.semester);
        setUsingSavedData(res.usingSavedData);
        setLoading(false);
        validatePicksAgainstSemester(semesterId, res.semester);

        if (shareHash) {
          try {
            const decoded = decodeSchedule(shareHash, res.semester);
            setSharedSchedule(decoded);
          } catch (_err) {
            showToast(copy.errors.invalidShare);
          }
        }
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [semesterId, shareHash, validatePicksAgainstSemester, setSharedSchedule, showToast]);

  // Options from semester
  const allOptions = useMemo(() => {
    if (!semester) return [];
    return buildOptions(semester);
  }, [semester]);

  // Component metadata maps
  const componentMap = useMemo(() => {
    if (!semester) return new Map();
    return new Map(semester.components.map((c) => [c.id, c]));
  }, [semester]);

  const componentColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (semester) {
      semester.components.forEach((c, idx) => {
        map[c.id] = getThreadColor(idx).hex;
      });
    }
    return map;
  }, [semester]);

  const componentNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (semester) {
      for (const c of semester.components) {
        map[c.id] = c.subjectName;
      }
    }
    return map;
  }, [semester]);

  // Effective picks
  const effectivePicks = useMemo(() => {
    if (sharedSchedule) {
      return sharedSchedule.picks;
    }
    return userPicks;
  }, [sharedSchedule, userPicks]);

  // Picked options
  const pickedOptions = useMemo(() => {
    const list: Option[] = [];
    for (const [compId, secId] of Object.entries(effectivePicks)) {
      const opt = findOption(allOptions, compId, secId);
      if (opt) list.push(opt);
    }
    return list;
  }, [allOptions, effectivePicks]);

  // Detected clashes
  const clashes = useMemo(() => {
    return findClashes(pickedOptions);
  }, [pickedOptions]);

  // Progress summary
  const progress = useMemo(() => {
    if (!semester) return { chosenCount: 0, requiredTotal: 0, isComplete: false, remainingComponents: [] };
    return getProgressSummary(semester, effectivePicks);
  }, [semester, effectivePicks]);

  // Default selected component
  useEffect(() => {
    if (semester && !selectedComponentId && semester.requiredComponentIds.length > 0) {
      setSelectedComponentId(semester.requiredComponentIds[0]);
    }
  }, [semester, selectedComponentId, setSelectedComponentId]);

  const handleShareLink = () => {
    if (!semester) return;
    const hash = encodeSchedule(semesterId, semester.dataVersion, userPicks);
    const shareUrl = `${window.location.origin}/#/s/${semesterId}/share/${hash}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast(copy.sharing.linkCopied);
      });
    } else {
      showToast(shareUrl);
    }
  };

  const handleCopyText = () => {
    if (!semester) return;
    const text = toPlainText(semester, userPicks);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(copy.sharing.textCopied);
      });
    }
  };

  const handleExportImage = async () => {
    if (!semester) return;
    try {
      showToast('Preparing timetable image...');
      const { exportTimetableToPng } = await import('../sharing/canvasExport');
      const pngBlob = await exportTimetableToPng({
        semester,
        pickedOptions,
        clashes,
        componentColorMap,
        componentMap,
        isDark: document.documentElement.dataset.theme === 'dark',
      });

      const file = new File([pngBlob], `noclash-${semester.semester.id}.png`, {
        type: 'image/png',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `NoClash — ${semester.semester.label}`,
        });
      } else {
        const url = URL.createObjectURL(pngBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `noclash-${semester.semester.id}.png`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Timetable image saved.');
      }
    } catch (err) {
      try {
        const { buildStandaloneSvgString } = await import('../../core/canvasSvg');
        const svgString = buildStandaloneSvgString({
          semester,
          pickedOptions,
          clashes,
          componentColorMap,
          componentMap,
          isDark: document.documentElement.dataset.theme === 'dark',
        });
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `noclash-${semester.semester.id}.svg`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Saved timetable as vector SVG.');
      } catch {
        showToast('Could not save image: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
  };

  const handleApplyShared = () => {
    if (!sharedSchedule) return;
    setAllPicks(semesterId, sharedSchedule.picks);
    setSharedSchedule(null);
    navigate(`/s/${semesterId}`);
    showToast('Applied shared schedule.');
  };

  const handleDismissShared = () => {
    setSharedSchedule(null);
    navigate(`/s/${semesterId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-ground text-ink">
        <div className="w-10 h-10 border-2 border-rule border-t-ink rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !semester) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-ground text-ink">
        <div className="max-w-md w-full bg-ground-sunk p-6 rounded-sheet border border-rule text-center">
          <h2 className="text-xl font-bold mb-2">{copy.errors.genericTitle}</h2>
          <p className="text-ink-soft mb-6">{error ?? copy.errors.loadFailed}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-ink text-ground rounded font-medium hover:opacity-90"
          >
            {copy.errors.retry}
          </button>
        </div>
      </div>
    );
  }

  const currentComponent = selectedComponentId ? componentMap.get(selectedComponentId) : null;
  const currentOptions = selectedComponentId ? getOptionsForComponent(allOptions, selectedComponentId) : [];
  const activeColor = selectedComponentId ? componentColorMap[selectedComponentId] : 'var(--ink)';

  // Calculate conflict notice for each option of the active component
  const optionConflictReasons = currentOptions.map((opt) => {
    const optionClashes = conflictsWith(opt, pickedOptions);
    if (optionClashes.length === 0) return undefined;
    return formatClashMessage(optionClashes[0], componentNameMap);
  });

  // Checklist content (reused in desktop sidebar and mobile bottom sheet)
  const renderChecklist = () => (
    <div className="space-y-1.5">
      {semester.requiredComponentIds.map((id) => {
        const comp = componentMap.get(id);
        if (!comp) return null;
        const chosenSectionId = effectivePicks[id];
        const isAttention = (needsAttention[semesterId] ?? []).includes(id);
        const opt = chosenSectionId ? findOption(allOptions, id, chosenSectionId) : undefined;

        return (
          <Spool
            key={id}
            name={comp.subjectName}
            code={comp.code}
            kind={comp.kind}
            threadColor={componentColorMap[id]}
            chosenSectionId={chosenSectionId}
            teacher={opt?.teachers[0]}
            isSelected={selectedComponentId === id}
            needsAttention={isAttention}
            onClick={() => {
              setSelectedComponentId(id);
              setSheetSnap('full');
            }}
            onClear={() => {
              removePick(semesterId, id);
              setPreviewCandidate(null);
            }}
          />
        );
      })}
    </div>
  );

  // Options cards content (reused in desktop sidebar and mobile bottom sheet)
  const renderOptions = () => {
    if (!currentComponent) return null;
    const isPicked = Boolean(effectivePicks[currentComponent.id]);

    return (
      <div className="mt-4 pt-4 border-t border-rule">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs uppercase font-bold tracking-wider text-ink-soft">
              {copy.options.title(currentComponent.subjectName)}
            </h3>
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: activeColor }}
            />
          </div>
          {isPicked && (
            <button
              onClick={() => {
                removePick(semesterId, currentComponent.id);
                setPreviewCandidate(null);
              }}
              className="text-[11px] text-clash hover:underline font-semibold cursor-pointer"
            >
              Remove from timetable
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {currentOptions.map((opt, idx) => (
            <OptionCard
              key={opt.sectionId}
              option={opt}
              isSelected={effectivePicks[currentComponent.id] === opt.sectionId}
              clashReason={optionConflictReasons[idx]}
              threadColor={activeColor}
              onSelect={() => {
                setPick(semesterId, currentComponent.id, opt.sectionId);
                setPreviewCandidate(null);
                setSheetSnap('half');
              }}
              onRemove={() => {
                removePick(semesterId, currentComponent.id);
                setPreviewCandidate(null);
              }}
              onMouseEnter={() => setPreviewCandidate(opt)}
              onMouseLeave={() => setPreviewCandidate(null)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-ground text-ink flex flex-col h-screen overflow-hidden">
      {/* Shared Preview Banner */}
      {sharedSchedule && (
        <div className="bg-ink text-ground px-4 py-2.5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-20">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-thread-turmeric animate-pulse" />
            {copy.sharing.sharedBannerTitle(semester.semester.label)}
            {!sharedSchedule.isVersionMatch && (
              <span className="text-xs text-thread-turmeric hidden md:inline ml-2">
                ({copy.sharing.olderDataNotice})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyShared}
              className="px-3 py-1 bg-ground text-ink text-xs font-semibold rounded hover:opacity-90"
            >
              {copy.sharing.useThisSchedule}
            </button>
            <button
              onClick={handleDismissShared}
              className="px-3 py-1 bg-transparent border border-rule text-ground text-xs font-medium rounded hover:bg-white/10"
            >
              {copy.sharing.keepMySchedule}
            </button>
          </div>
        </div>
      )}

      {/* Persistent Top Navigation Bar */}
      <header className="border-b border-rule bg-ground px-3 sm:px-4 py-1 sm:py-2.5 landscape:py-1 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-1.5 sm:gap-3">
          <h1 className="text-base sm:text-xl font-display font-bold tracking-tight">{copy.app.name}</h1>
          <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-ground-sunk border border-rule text-ink-soft">
            {semester.semester.label}
          </span>
          {usingSavedData && (
            <span className="text-xs text-ink-soft hidden sm:inline">
              {copy.planner.usingSavedData}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded border border-rule p-0.5 bg-ground-sunk">
            <button
              onClick={() => setViewMode('weave')}
              className={`p-1 sm:p-1.5 rounded text-xs font-medium flex items-center gap-1 ${
                viewMode === 'weave' ? 'bg-ground shadow-sm text-ink' : 'text-ink-soft hover:text-ink'
              }`}
              title="Weave View"
            >
              <WeaveGridIcon size={14} className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">{copy.planner.viewWeave}</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 sm:p-1.5 rounded text-xs font-medium flex items-center gap-1 ${
                viewMode === 'list' ? 'bg-ground shadow-sm text-ink' : 'text-ink-soft hover:text-ink'
              }`}
              title="List View"
            >
              <ListIcon size={14} className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">{copy.planner.viewList}</span>
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={() => {
              setLoading(true);
              fetchSemester(semesterId, `/data/semester-${semesterId}.json`, true)
                .then((res) => {
                  setSemester(res.semester);
                  setUsingSavedData(false);
                  setLoading(false);
                  showToast('Timetables refreshed.');
                })
                .catch((err) => {
                  setError(err instanceof Error ? err.message : String(err));
                  setLoading(false);
                });
            }}
            className="p-1 sm:p-2 border border-rule rounded hover:border-ink transition-colors text-ink"
            title={copy.planner.refreshTimetables}
          >
            <RefreshIcon size={14} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Share */}
          <button
            onClick={handleShareLink}
            className="p-1 sm:p-2 border border-rule rounded hover:border-ink transition-colors text-ink"
            title={copy.planner.shareWeek}
          >
            <ShareIcon size={14} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Copy Plain Text */}
          <button
            onClick={handleCopyText}
            className="px-2 sm:px-2.5 py-1 sm:py-1.5 border border-rule rounded text-xs font-medium hover:border-ink transition-colors hidden sm:inline-block"
          >
            {copy.sharing.copyText}
          </button>

          {/* Save Image */}
          <button
            onClick={handleExportImage}
            className="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-ink text-ground rounded text-xs font-medium hover:opacity-90 transition-opacity hidden sm:inline-block landscape:inline-block"
          >
            {copy.sharing.saveImage}
          </button>
        </div>
      </header>

      {/* Mobile Portrait Orientation Guidance Banner */}
      {!dismissRotateTip && (
        <aside
          aria-label="Screen orientation tip"
          className="bg-ground-sunk border-b border-rule px-3 sm:px-4 py-1 sm:py-1.5 flex items-center justify-between text-[11px] sm:text-xs text-ink-soft portrait:flex landscape:hidden lg:hidden shrink-0"
        >
          <div className="flex items-center gap-1.5">
            <RotateDeviceIcon size={14} className="text-thread-turmeric animate-pulse shrink-0" />
            <span>
              Tip: <strong>Rotate phone horizontally</strong> for the full timetable view
            </span>
          </div>
          <button
            onClick={() => setDismissRotateTip(true)}
            className="p-0.5 text-ink-soft hover:text-ink rounded text-xs ml-2 shrink-0"
            title="Dismiss tip"
            aria-label="Dismiss orientation tip"
          >
            <CloseIcon size={12} />
          </button>
        </aside>
      )}

      {/* Persistent Clash Summary Notification */}
      {clashes.length > 0 && (
        <section
          role="region"
          aria-label="Detected clashes"
          className="bg-clash/10 border-b border-clash/30 px-3 sm:px-6 py-1 sm:py-2 shrink-0"
        >
          <div className="flex items-start gap-2">
            <KnotIcon className="text-clash shrink-0 mt-0.5" size={14} />
            <div className="flex-1">
              <span className="text-[11px] sm:text-xs font-bold text-clash uppercase tracking-wider">
                {copy.planner.clashCount(clashes.length)} detected:
              </span>
              <span className="text-[11px] sm:text-xs text-ink ml-2">
                {clashes.map((c) => formatClashMessage(c, componentNameMap)).join(' • ')}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Main Split Layout Workspace */}
      <div className="flex-1 flex flex-col landscape:flex-row lg:flex-row overflow-hidden relative">
        {/* Left / Top Viewport (The Weave Grid or List View) */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-ground">
          {/* Header Bar above Weave */}
          <div className="px-3 sm:px-4 py-1 sm:py-2 border-b border-rule flex items-center justify-between shrink-0 text-[11px] sm:text-xs bg-ground">
            <div className="font-medium">
              {progress.isComplete && clashes.length === 0 ? (
                <span className="text-ink flex items-center gap-1 font-bold">
                  <CheckIcon className="text-thread-tea" size={14} />
                  {copy.planner.allChosenNoClashes(progress.requiredTotal)}
                </span>
              ) : (
                <span>{copy.planner.chosenCount(progress.chosenCount, progress.requiredTotal)}</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSectionChangeModalOpen(true)}
                className="text-ink-soft hover:text-ink underline"
              >
                {copy.planner.changeSection}
              </button>
              <button
                onClick={() => clearPicks(semesterId)}
                className="text-ink-soft hover:text-clash underline"
              >
                {copy.planner.clearAll}
              </button>
            </div>
          </div>

          {/* Grid / List Content */}
          <div className={`flex-1 ${viewMode === 'weave' ? 'overflow-hidden' : 'overflow-auto'}`}>
            {viewMode === 'weave' ? (
              <div className="w-full h-full pb-14 landscape:pb-0 lg:pb-0">
                <Weave
                  semester={semester}
                  pickedOptions={pickedOptions}
                  clashes={clashes}
                  previewCandidate={previewCandidate}
                  componentColorMap={componentColorMap}
                  componentMap={componentMap}
                />
              </div>
            ) : (
              <WeekListView
                semester={semester}
                picks={effectivePicks}
                componentColorMap={componentColorMap}
              />
            )}
          </div>
        </div>

        {/* Desktop & Landscape Sidebar (Right side: Course Spools) */}
        <aside
          className="hidden landscape:flex lg:flex w-72 sm:w-80 lg:w-96 flex-col bg-ground-sunk border-l border-rule overflow-y-auto p-3.5 lg:p-4 shrink-0 transition-all z-10"
        >
          <div className="flex items-center justify-between mb-2.5 lg:mb-3">
            <h2 className="text-xs uppercase font-bold tracking-wider text-ink-soft">
              Course Spools
            </h2>
          </div>
          {renderChecklist()}
          {renderOptions()}
        </aside>

        {/* Mobile Draggable Bottom Sheet (Visible on portrait screens < lg) */}
        <BottomSheet
          snap={sheetSnap}
          onSnapChange={setSheetSnap}
          headerContent={
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink">
                {copy.planner.chosenCount(progress.chosenCount, progress.requiredTotal)}
              </span>
              <div className="flex items-center gap-2">
                {clashes.length > 0 && (
                  <span className="text-clash font-semibold flex items-center gap-1">
                    <KnotIcon size={12} />
                    {copy.planner.clashCount(clashes.length)}
                  </span>
                )}
                <span className="text-[11px] text-ink-soft">
                  {sheetSnap === 'peek' ? 'Tap to browse spools' : ''}
                </span>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <h2 className="text-xs uppercase font-bold tracking-wider text-ink-soft mb-2.5">
                Course Spools
              </h2>
              {renderChecklist()}
            </div>
            {renderOptions()}
          </div>
        </BottomSheet>
      </div>

      {/* Change Section Modal */}
      {isSectionChangeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-ground border border-rule p-6 rounded-sheet max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold mb-2">{copy.confirm.changeSectionTitle}</h3>
            <p className="text-xs text-ink-soft mb-5">{copy.confirm.changeSectionMessage}</p>

            <div className="space-y-2 mb-6">
              {semester.sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => {
                    usePicksStore.getState().startWithSection(semesterId, sec.id, semester);
                    setSectionChangeModalOpen(false);
                    showToast(`Swapped to ${sec.name}.`);
                  }}
                  className="w-full p-3 bg-ground-sunk border border-rule rounded hover:border-ink text-left text-xs font-semibold"
                >
                  {sec.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSectionChangeModalOpen(false)}
              className="w-full py-2.5 border border-rule rounded text-xs font-semibold text-ink hover:border-ink"
            >
              {copy.confirm.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
