export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Student {
  id: string;
  name: string;
  avatarSeed: string; // Used to generate procedural inline SVGs/styles for avatars
  points: number;
  streak: number;
  lastRecitationDate?: string; // YYYY-MM-DD
  attendance: AttendanceStatus;
  archived?: boolean;
}

export interface RecitationEvent {
  id: string;
  studentId: string;
  studentName: string;
  pointsAwarded: number;
  reason?: string;
  timestamp: string; // ISO string
}

export interface ClassSession {
  id: string;
  className: string;
  subject?: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  duration: string; // e.g. "12:34"
  eventsCount: number;
  pointsAwarded: number;
  studentsCount: number;
  lateCount?: number;
  absentCount?: number;
  excusedCount?: number;
  totalPresentCount?: number;
  uniqueParticipantsCount?: number;
  engagementRate?: number;
  positiveEventsCount?: number;
  negativeEventsCount?: number;
  spinWheelWinnersCount?: number;
  groupGradingsCount?: number;
  mvpName: string;
  mvpAvatarSeed: string;
  mvpPointsGained: number;
  events?: RecitationEvent[];
}

export interface Classroom {
  id: string;
  name: string;
  subject?: string;
  students: Student[];
  history: RecitationEvent[];
  sessionActive?: boolean;
  sessionStartTime?: string | null;
  sessionElapsedTime?: string;
  updatedAt?: string;
  sessionHistory?: ClassSession[];
}

export interface Group {
  id: string;
  name: string;
  studentIds: string[];
}

