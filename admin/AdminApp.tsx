import React, { useEffect, useState } from 'react';
import { SemesterFileSchema } from '../src/core/schema';
import type { Day, SemesterFile, Slot } from '../src/core/types';

export const AdminApp: React.FC = () => {
  const [manifest, setManifest] = useState<{ semesters: Array<{ id: string; label: string; file: string }> } | null>(null);
  const [semester, setSemester] = useState<SemesterFile | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('5');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('A');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // New slot form state
  const [newDay, setNewDay] = useState<Day>('Mon');
  const [newPeriods, setNewPeriods] = useState<string>('1');
  const [newComponentId, setNewComponentId] = useState<string>('');
  const [newTeacher, setNewTeacher] = useState<string>('');
  const [newRoom, setNewRoom] = useState<string>('');

  const loadData = async (semId: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      // 1. Fetch manifest
      const manRes = await fetch('/data/manifest.json');
      if (!manRes.ok) throw new Error(`Failed to load manifest.json (HTTP ${manRes.status})`);
      const manData = await manRes.json();
      setManifest(manData);

      // 2. Fetch target semester
      const semFile = manData.semesters?.find((s: { id: string }) => s.id === semId)?.file ?? `/data/semester-${semId}.json`;
      const semRes = await fetch(semFile);
      if (!semRes.ok) throw new Error(`Failed to load ${semFile} (HTTP ${semRes.status})`);
      const semData: SemesterFile = await semRes.json();

      setSemester(semData);
      setSelectedSemesterId(semId);
      if (semData.components.length > 0) {
        setNewComponentId(semData.components[0].id);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedSemesterId);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
          <div className="text-slate-600 font-medium text-sm">Loading timetable data...</div>
        </div>
      </div>
    );
  }

  if (errorMessage || !semester) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
        <div className="max-w-md w-full bg-white p-6 rounded-lg border border-slate-200 text-center shadow-sm">
          <div className="text-rose-600 font-bold text-lg mb-2">Error Loading Data</div>
          <p className="text-slate-600 text-xs font-mono mb-6 break-all">
            {errorMessage ?? 'Timetable file could not be loaded.'}
          </p>
          <button
            onClick={() => loadData(selectedSemesterId)}
            className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // Live Zod Validation
  const validationResult = SemesterFileSchema.safeParse(semester);

  const activeSection = semester.sections.find((s) => s.id === selectedSectionId) ?? semester.sections[0];

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComponentId || !newTeacher.trim()) return;

    const periods = newPeriods
      .split(/[,-]/)
      .map((p) => parseInt(p.trim(), 10))
      .filter((p) => !isNaN(p));

    if (periods.length === 0) return;

    const newSlot: Slot = {
      day: newDay,
      periods,
      componentId: newComponentId,
      teacher: newTeacher.trim(),
      room: newRoom.trim() || undefined,
    };

    const updatedSections = semester.sections.map((sec) => {
      if (sec.id === activeSection.id) {
        return {
          ...sec,
          slots: [...sec.slots, newSlot],
        };
      }
      return sec;
    });

    setSemester({
      ...semester,
      sections: updatedSections,
    });

    setNewTeacher('');
    setNewRoom('');
    setStatusMessage('Added slot. Remember to Save Changes to disk.');
  };

  const handleDeleteSlot = (indexToDelete: number) => {
    const updatedSections = semester.sections.map((sec) => {
      if (sec.id === activeSection.id) {
        return {
          ...sec,
          slots: sec.slots.filter((_, idx) => idx !== indexToDelete),
        };
      }
      return sec;
    });

    setSemester({
      ...semester,
      sections: updatedSections,
    });
    setStatusMessage('Deleted slot.');
  };

  const handleSaveToDisk = async () => {
    if (!validationResult.success) {
      alert('Cannot save: Timetable has schema errors. Please resolve them first.');
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    // Bump dataVersion
    const dateStr = new Date().toISOString().split('T')[0];
    const updatedSemester: SemesterFile = {
      ...semester,
      dataVersion: `${dateStr}.${Date.now().toString().slice(-4)}`,
    };

    try {
      const res = await fetch('/api/save-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSemester),
      });
      const data = await res.json();
      if (data.success) {
        setSemester(updatedSemester);
        setStatusMessage(`✅ Saved to disk! dataVersion bumped to ${updatedSemester.dataVersion}`);
      } else {
        setStatusMessage(`❌ Save failed: ${data.message}`);
      }
    } catch (err) {
      setStatusMessage(`❌ Save request error: ${String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Bar */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight">NoClash Data Studio</span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-mono font-medium border border-emerald-500/30">
            Local Authoring • Offline
          </span>
          {manifest && manifest.semesters.length > 0 && (
            <select
              value={selectedSemesterId}
              onChange={(e) => loadData(e.target.value)}
              className="bg-slate-800 text-white text-xs px-2.5 py-1 rounded border border-slate-700 font-medium"
            >
              {manifest.semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveToDisk}
            disabled={isSaving || !validationResult.success}
            className={`px-4 py-2 rounded text-xs font-bold transition-all shadow-sm ${
              validationResult.success
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Writing to Disk...' : 'Save Changes to Disk'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
        {/* Status notification */}
        {statusMessage && (
          <div className="p-3.5 bg-slate-900 text-white rounded text-xs font-mono flex items-center justify-between shadow-sm">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
              ✕
            </button>
          </div>
        )}

        {/* Validation Banner */}
        <section
          className={`p-4 rounded-lg border text-xs font-mono transition-colors ${
            validationResult.success
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between font-bold text-sm">
            <span>{validationResult.success ? '✅ Zod Validation: Passed' : '❌ Zod Validation: Failed'}</span>
            <span className="text-xs font-normal">dataVersion: {semester.dataVersion}</span>
          </div>

          {!validationResult.success && (
            <ul className="mt-2 space-y-1 text-rose-800">
              {validationResult.error.issues.map((iss, idx) => (
                <li key={idx}>
                  • [{iss.path.join('.')}] {iss.message}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Section Management Tabs */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">{semester.semester.label}</h2>
              <p className="text-xs text-slate-500">
                {semester.department} • {semester.institution}
              </p>
            </div>

            {/* Section tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200">
              {semester.sections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                    activeSection.id === sec.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sec.name}
                </button>
              ))}
            </div>
          </div>

          {/* Section Slots Table */}
          <div>
            <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3">
              Slots in {activeSection.name} ({activeSection.slots.length} sessions)
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Day</th>
                    <th className="py-2.5 px-3">Periods</th>
                    <th className="py-2.5 px-3">Component</th>
                    <th className="py-2.5 px-3">Teacher</th>
                    <th className="py-2.5 px-3">Room</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {activeSection.slots.map((slot, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-semibold">{slot.day}</td>
                      <td className="py-2.5 px-3">{slot.periods.join(', ')}</td>
                      <td className="py-2.5 px-3 text-slate-800 font-medium font-sans">
                        {semester.components.find((c) => c.id === slot.componentId)?.subjectName ??
                          slot.componentId}
                      </td>
                      <td className="py-2.5 px-3 font-sans">{slot.teacher}</td>
                      <td className="py-2.5 px-3 text-slate-500 font-sans">{slot.room ?? '—'}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteSlot(idx)}
                          className="text-rose-600 hover:text-rose-800 font-sans font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Slot Form */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Add New Slot to {activeSection.name}
            </h4>

            <form onSubmit={handleAddSlot} className="grid grid-cols-1 sm:grid-cols-6 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Day</label>
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value as Day)}
                  className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                >
                  {semester.days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Periods (e.g. 4,5)
                </label>
                <input
                  type="text"
                  value={newPeriods}
                  onChange={(e) => setNewPeriods(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                  placeholder="e.g. 4, 5"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Component</label>
                <select
                  value={newComponentId}
                  onChange={(e) => setNewComponentId(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                >
                  {semester.components.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.subjectName} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Teacher</label>
                <input
                  type="text"
                  value={newTeacher}
                  onChange={(e) => setNewTeacher(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                  placeholder="Instructor name"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Room (opt)</label>
                <input
                  type="text"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-slate-300 bg-white"
                  placeholder="e.g. Lab 2"
                />
              </div>

              <div className="sm:col-span-6 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800"
                >
                  Add Slot
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Contract Warning Card */}
        <aside className="p-4 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
          <span className="font-bold">⚠️ Data Authoring Contract:</span> Component IDs (e.g.{' '}
          <code className="font-mono font-semibold">comp-net-theory</code>) must remain permanent.
          Modifying an existing ID breaks student bookmarks and shared schedule links.
        </aside>
      </main>
    </div>
  );
};
