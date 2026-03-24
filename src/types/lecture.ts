// ============================================================
// SAROTHI OVERHAUL — PART 1: TYPES & FIREBASE SCHEMA
// File: src/types/lecture.ts
// ============================================================

export type ClassLevel = 'HSC' | 'SSC';
export type Group = 'Science' | 'Commerce' | 'Arts';
export type AdmissionCategory = 'Engineering' | 'University' | 'Medical' | 'GST';
export type ClassType = 'ONESHOT' | 'PLAYLIST';
export type Platform = 'HSC' | 'Admission';

// ── Subject list (HSC/SSC) ──────────────────────────────────
export const HSC_SUBJECTS = [
  'Bangla 1st Paper', 'Bangla 2nd Paper',
  'English 1st Paper', 'English 2nd Paper',
  'Physics 1st Paper', 'Physics 2nd Paper',
  'Chemistry 1st Paper', 'Chemistry 2nd Paper',
  'Math 1st Paper', 'Math 2nd Paper',
  'Biology 1st Paper', 'Biology 2nd Paper',
  'ICT',
] as const;

export type SubjectName = typeof HSC_SUBJECTS[number];

// ── Firestore document: /lectures/{id} ──────────────────────
// Used for both HSC/SSC and Admission sections
export interface LectureEntry {
  id?: string;

  // Classification
  platform: Platform;                         // 'HSC' | 'Admission'
  classLevel?: ClassLevel;                    // HSC or SSC (only for platform='HSC')
  group?: Group;                              // Science/Commerce/Arts (platform='HSC')
  subject?: SubjectName;                      // subject name (platform='HSC')
  admissionCategory?: AdmissionCategory;      // Engineering/University/Medical/GST (platform='Admission')
  admissionSubject?: string;                  // free-text subject for admission

  // Chapter
  chapterName: string;                        // displayed bold+large

  // Class info
  classType: ClassType;                       // ONESHOT | PLAYLIST
  mentorName: string;                         // mentor / platform name (small, below chapter)
  videoLink: string;                          // YouTube URL
  pdfLink?: string;                           // optional PDF/slide URL
  videoTitle?: string;                        // class/video name (for playlist items)

  // Engagement (stored on /lectures/{id}/meta)
  likes?: number;
  views?: number;

  createdAt?: any;                            // firebase serverTimestamp
}

// ── Firestore: /lectureComments/{lectureId}/comments/{commentId} ──
export interface LectureComment {
  id?: string;
  lectureId: string;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
  text: string;
  likes: number;
  likedBy: string[];                          // array of userIds who liked
  createdAt: any;
}

// ── Firestore: /lectureLikes/{lectureId} ──
export interface LectureLike {
  likedBy: string[];                          // array of userIds
  count: number;
}

// ── Watch heatmap: /lectureWatches/{lectureId} ──
// We divide a video into 20 buckets (5% each) and count views per bucket
export interface WatchHeatmap {
  buckets: number[];  // length = 20, each value = number of watchers who reached that point
}
