export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Student {
  id: string;
  name: string;
  avatarSeed: string; // Used to generate procedural inline SVGs/styles for avatars
  points: number;
  streak: number;
  lastRecitationDate?: string; // YYYY-MM-DD
  attendance: AttendanceStatus;
}

export interface RecitationEvent {
  id: string;
  studentId: string;
  studentName: string;
  pointsAwarded: number;
  reason?: string;
  timestamp: string; // ISO string
}

export interface Classroom {
  id: string;
  name: string;
  subject?: string;
  students: Student[];
  history: RecitationEvent[];
}

export interface Group {
  id: string;
  name: string;
  studentIds: string[];
}
