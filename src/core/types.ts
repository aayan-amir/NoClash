export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface Period {
  id: number;
  start: string; // "08:00" (24-hour)
  end: string;   // "08:50" (24-hour)
}

export type ComponentKind = 'theory' | 'practical' | 'single';

export interface Component {
  id: string;          // "comp-net-theory"
  subjectId: string;   // "comp-net"
  subjectName: string; // "Computer Networks"
  kind: ComponentKind;
  code: string;        // "CompNet"
}

export interface Slot {
  day: Day;
  periods: number[];   // e.g. [4, 5]
  componentId: string;
  teacher: string;
  room?: string;
}

export interface Section {
  id: string;          // "A", "B", ...
  name: string;        // "Section A"
  slots: Slot[];
}

export interface SemesterInfo {
  id: string;          // "5"
  label: string;       // "5th Semester"
}

export interface SemesterFile {
  schemaVersion: 1;
  dataVersion: string;
  institution: string;
  department: string;
  semester: SemesterInfo;
  days: Day[];
  periods: Period[];
  components: Component[];
  requiredComponentIds: string[];
  sections: Section[];
}

export interface ManifestSemester {
  id: string;
  label: string;
  file: string;
}

export interface Manifest {
  schemaVersion: 1;
  dataVersion: string;
  semesters: ManifestSemester[];
}

export interface Session {
  day: Day;
  periods: number[];
  startMinutes: number;
  endMinutes: number;
  teacher: string;
  room?: string;
}

export interface Option {
  componentId: string;
  sectionId: string;
  sectionName: string;
  sessions: Session[];
  teachers: string[];
  dayMask: Record<Day, boolean>;
  earliestStart: string;
  latestEnd: string;
}

export interface Clash {
  a: Option;
  b: Option;
  day: Day;
  periodIds: number[];
  start: string;
  end: string;
}

export interface ProgressSummary {
  chosenCount: number;
  requiredTotal: number;
  isComplete: boolean;
  remainingComponents: Component[];
}
