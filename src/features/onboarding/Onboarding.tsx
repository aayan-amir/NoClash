import React, { useEffect, useState } from 'react';
import { copy } from '../../copy/en';
import type { Manifest, SemesterFile } from '../../core/types';
import { fetchManifest, fetchSemester } from '../../data/loader';
import { navigate } from '../../router';
import { usePicksStore } from '../../state/picks';
import { useUIStore } from '../../state/ui';

export const Onboarding: React.FC = () => {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [semesterData, setSemesterData] = useState<SemesterFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSemester, setLoadingSemester] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { startWithSection, clearPicks } = usePicksStore();
  const { setActiveSemesterId } = useUIStore();

  useEffect(() => {
    let mounted = true;
    fetchManifest()
      .then((res) => {
        if (mounted) {
          setManifest(res.manifest);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectSemester = async (semId: string, semFileUrl: string) => {
    setSelectedSemesterId(semId);
    setLoadingSemester(true);
    setError(null);

    try {
      const res = await fetchSemester(semId, semFileUrl);
      setSemesterData(res.semester);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingSemester(false);
    }
  };

  const handleChooseStart = (sectionId: string | 'blank') => {
    if (!selectedSemesterId || !semesterData) return;

    if (sectionId === 'blank') {
      clearPicks(selectedSemesterId);
    } else {
      startWithSection(selectedSemesterId, sectionId, semesterData);
    }

    setActiveSemesterId(selectedSemesterId);
    navigate(`/s/${selectedSemesterId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-ground text-ink">
        <div className="w-12 h-12 border-2 border-rule border-t-ink rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !manifest) {
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-ground text-ink">
      <main className="w-full max-w-xl">
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-display font-semibold tracking-tight text-ink mb-1">
            {copy.app.name}
          </h1>
          <p className="text-ink-soft text-base">{copy.app.tagline}</p>
        </header>

        {!selectedSemesterId || !semesterData ? (
          <section className="bg-ground-sunk border border-rule p-6 sm:p-8 rounded-sheet">
            <h2 className="text-xl font-semibold mb-6">
              {copy.onboarding.semesterQuestion}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {manifest.semesters.map((sem) => (
                <button
                  key={sem.id}
                  onClick={() => handleSelectSemester(sem.id, sem.file)}
                  disabled={loadingSemester}
                  className="p-5 text-left bg-ground border border-rule rounded hover:border-ink transition-colors group flex flex-col justify-between"
                >
                  <span className="text-lg font-medium text-ink group-hover:text-ink">
                    {sem.label}
                  </span>
                  <span className="text-xs text-ink-soft mt-3">Select semester</span>
                </button>
              ))}
            </div>

            {loadingSemester && (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-ink-soft">
                <span className="w-4 h-4 border-2 border-rule border-t-ink rounded-full animate-spin" />
                Loading semester options...
              </div>
            )}
          </section>
        ) : (
          <section className="bg-ground-sunk border border-rule p-6 sm:p-8 rounded-sheet">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-rule">
              <div>
                <span className="text-xs uppercase tracking-wider text-ink-soft">
                  {semesterData.department}
                </span>
                <h2 className="text-xl font-semibold text-ink">
                  {semesterData.semester.label}
                </h2>
              </div>
              <button
                onClick={() => {
                  setSelectedSemesterId(null);
                  setSemesterData(null);
                }}
                className="text-xs text-ink-soft underline hover:text-ink"
              >
                Change semester
              </button>
            </div>

            <h3 className="text-base font-medium mb-4 text-ink">
              {copy.onboarding.startQuestion}
            </h3>

            <div className="space-y-3">
              {semesterData.sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => handleChooseStart(sec.id)}
                  className="w-full p-4 bg-ground border border-rule rounded hover:border-ink transition-colors text-left group"
                >
                  <div className="font-medium text-ink group-hover:text-ink">
                    {copy.onboarding.startWithSection(sec.name)}
                  </div>
                  <div className="text-xs text-ink-soft mt-1">
                    {copy.onboarding.startWithSectionDesc}
                  </div>
                </button>
              ))}

              <button
                onClick={() => handleChooseStart('blank')}
                className="w-full p-4 bg-ground border border-rule rounded hover:border-ink transition-colors text-left group"
              >
                <div className="font-medium text-ink">
                  {copy.onboarding.startBlank}
                </div>
                <div className="text-xs text-ink-soft mt-1">
                  {copy.onboarding.startBlankDesc}
                </div>
              </button>
            </div>
          </section>
        )}

        <footer className="mt-8 text-center text-xs text-ink-soft">
          {copy.app.footerNote}
        </footer>
      </main>
    </div>
  );
};
