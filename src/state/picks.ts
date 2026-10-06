import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SemesterFile } from '../core/types';

export interface PicksState {
  // Map of semesterId -> { componentId: sectionId }
  picksBySemester: Record<string, Record<string, string>>;
  // Map of semesterId -> array of componentIds that need re-selection
  needsAttention: Record<string, string[]>;

  setPick: (semesterId: string, componentId: string, sectionId: string) => void;
  removePick: (semesterId: string, componentId: string) => void;
  setAllPicks: (semesterId: string, picks: Record<string, string>) => void;
  clearPicks: (semesterId: string) => void;
  startWithSection: (
    semesterId: string,
    sectionId: string,
    semester: SemesterFile
  ) => void;
  validatePicksAgainstSemester: (
    semesterId: string,
    semester: SemesterFile
  ) => void;
  acknowledgeAttention: (semesterId: string, componentId: string) => void;
}

export const usePicksStore = create<PicksState>()(
  persist(
    (set, get) => ({
      picksBySemester: {},
      needsAttention: {},

      setPick: (semesterId, componentId, sectionId) => {
        set((state) => {
          const semesterPicks = { ...(state.picksBySemester[semesterId] ?? {}) };
          semesterPicks[componentId] = sectionId;

          // Clear any attention flag for this component
          const currentAttention = state.needsAttention[semesterId] ?? [];
          const updatedAttention = currentAttention.filter((id) => id !== componentId);

          return {
            picksBySemester: {
              ...state.picksBySemester,
              [semesterId]: semesterPicks,
            },
            needsAttention: {
              ...state.needsAttention,
              [semesterId]: updatedAttention,
            },
          };
        });
      },

      removePick: (semesterId, componentId) => {
        set((state) => {
          const semesterPicks = { ...(state.picksBySemester[semesterId] ?? {}) };
          delete semesterPicks[componentId];
          return {
            picksBySemester: {
              ...state.picksBySemester,
              [semesterId]: semesterPicks,
            },
          };
        });
      },

      setAllPicks: (semesterId, picks) => {
        set((state) => ({
          picksBySemester: {
            ...state.picksBySemester,
            [semesterId]: { ...picks },
          },
          needsAttention: {
            ...state.needsAttention,
            [semesterId]: [],
          },
        }));
      },

      clearPicks: (semesterId) => {
        set((state) => ({
          picksBySemester: {
            ...state.picksBySemester,
            [semesterId]: {},
          },
          needsAttention: {
            ...state.needsAttention,
            [semesterId]: [],
          },
        }));
      },

      startWithSection: (semesterId, sectionId, semester) => {
        const targetSection = semester.sections.find((s) => s.id === sectionId);
        if (!targetSection) return;

        const newPicks: Record<string, string> = {};
        for (const slot of targetSection.slots) {
          newPicks[slot.componentId] = sectionId;
        }

        get().setAllPicks(semesterId, newPicks);
      },

      validatePicksAgainstSemester: (semesterId, semester) => {
        const currentPicks = get().picksBySemester[semesterId] ?? {};
        const availableSections = new Map(semester.sections.map((s) => [s.id, s]));
        const attentionIds: string[] = [];

        for (const [compId, secId] of Object.entries(currentPicks)) {
          const sec = availableSections.get(secId);
          if (!sec) {
            attentionIds.push(compId);
            continue;
          }
          const hasComponent = sec.slots.some((sl) => sl.componentId === compId);
          if (!hasComponent) {
            attentionIds.push(compId);
          }
        }

        set((state) => ({
          needsAttention: {
            ...state.needsAttention,
            [semesterId]: attentionIds,
          },
        }));
      },

      acknowledgeAttention: (semesterId, componentId) => {
        set((state) => {
          const list = (state.needsAttention[semesterId] ?? []).filter(
            (id) => id !== componentId
          );
          return {
            needsAttention: {
              ...state.needsAttention,
              [semesterId]: list,
            },
          };
        });
      },
    }),
    {
      name: 'loom:v1:picks:store',
      version: 1,
      migrate: (persistedState, _version) => {
        return persistedState as PicksState;
      },
    }
  )
);
