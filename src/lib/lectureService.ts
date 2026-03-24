// ============================================================
// FIREBASE HELPER FUNCTIONS
// File: src/lib/lectureService.ts
// ============================================================

import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp, increment,
  arrayUnion, arrayRemove, getDoc, setDoc, onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';   // your existing firebase init
import { 
  LectureEntry, ClassLevel, Group, AdmissionCategory, 
  LectureLike, LectureComment, WatchHeatmap 
} from '../types/lecture';

const LECTURES = 'lectures';
const COMMENTS = 'lectureComments';
const LIKES    = 'lectureLikes';
const HEATMAP  = 'lectureWatches';

// ── CRUD ────────────────────────────────────────────────────

export async function addLecture(data: Omit<LectureEntry, 'id'>) {
  return addDoc(collection(db, LECTURES), { ...data, createdAt: serverTimestamp() });
}

export async function updateLecture(id: string, data: Partial<LectureEntry>) {
  return updateDoc(doc(db, LECTURES, id), data);
}

export async function deleteLecture(id: string) {
  return deleteDoc(doc(db, LECTURES, id));
}

/** Fetch all chapters for a given HSC/SSC subject */
export async function getLecturesBySubject(
  classLevel: ClassLevel,
  group: Group,
  subject: string
): Promise<LectureEntry[]> {
  const q = query(
    collection(db, LECTURES),
    where('platform', '==', 'HSC'),
    where('classLevel', '==', classLevel),
    where('group', '==', group),
    where('subject', '==', subject),
    orderBy('chapterName')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as LectureEntry));
}

/** Fetch all chapters for Admission category */
export async function getLecturesByAdmission(
  category: AdmissionCategory,
  subject?: string
): Promise<LectureEntry[]> {
  let q = query(
    collection(db, LECTURES),
    where('platform', '==', 'Admission'),
    where('admissionCategory', '==', category),
    orderBy('chapterName')
  );
  if (subject) {
    q = query(q, where('admissionSubject', '==', subject));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as LectureEntry));
}

// ── LIKES ───────────────────────────────────────────────────

export async function toggleLectureLike(lectureId: string, userId: string): Promise<number> {
  const ref = doc(db, LIKES, lectureId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, { likedBy: [userId], count: 1 });
    return 1;
  }

  const data = snap.data() as LectureLike;
  const liked = data.likedBy.includes(userId);

  await updateDoc(ref, {
    likedBy: liked ? arrayRemove(userId) : arrayUnion(userId),
    count:   liked ? increment(-1)       : increment(1),
  });

  return liked ? data.count - 1 : data.count + 1;
}

export async function getLectureLikeData(lectureId: string): Promise<LectureLike> {
  const snap = await getDoc(doc(db, LIKES, lectureId));
  return snap.exists() ? (snap.data() as LectureLike) : { likedBy: [], count: 0 };
}

// ── COMMENTS ────────────────────────────────────────────────

export async function addComment(lectureId: string, data: Omit<LectureComment, 'id' | 'lectureId' | 'likes' | 'likedBy' | 'createdAt'>) {
  return addDoc(
    collection(db, COMMENTS, lectureId, 'comments'),
    { ...data, lectureId, likes: 0, likedBy: [], createdAt: serverTimestamp() }
  );
}

export function subscribeComments(lectureId: string, cb: (c: LectureComment[]) => void) {
  const q = query(
    collection(db, COMMENTS, lectureId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as LectureComment)));
  });
}

export async function toggleCommentLike(lectureId: string, commentId: string, userId: string) {
  const ref = doc(db, COMMENTS, lectureId, 'comments', commentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as LectureComment;
  const liked = data.likedBy.includes(userId);
  await updateDoc(ref, {
    likedBy: liked ? arrayRemove(userId) : arrayUnion(userId),
    likes:   liked ? increment(-1)       : increment(1),
  });
}

// ── HEATMAP ─────────────────────────────────────────────────

/** Call this every time a user watches past a new 5% mark */
export async function recordWatchProgress(lectureId: string, progressPercent: number) {
  const bucket = Math.min(Math.floor(progressPercent / 5), 19); // 0..19
  const ref = doc(db, HEATMAP, lectureId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const buckets = Array(20).fill(0);
    buckets[bucket] = 1;
    await setDoc(ref, { buckets });
  } else {
    const buckets = (snap.data() as WatchHeatmap).buckets;
    buckets[bucket] = (buckets[bucket] || 0) + 1;
    await updateDoc(ref, { buckets });
  }
}

export async function getWatchHeatmap(lectureId: string): Promise<number[]> {
  const snap = await getDoc(doc(db, HEATMAP, lectureId));
  return snap.exists() ? (snap.data() as WatchHeatmap).buckets : Array(20).fill(0);
}
