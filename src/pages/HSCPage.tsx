// ============================================================
// SAROTHI OVERHAUL — PART 2: HSC/SSC LECTURE BROWSING UI
// ============================================================

// ── FILE: src/pages/HSCPage.tsx ──────────────────────────────
// Replace your existing HSC question-paper page entirely.

import React, { useState } from 'react';
import { HSC_SUBJECTS, ClassLevel, Group, SubjectName } from '../types/lecture';
import SubjectLectures from '../components/lecture/SubjectLectures';

const GROUPS: Group[] = ['Science', 'Commerce', 'Arts'];

// Commerce & Arts have fewer subjects — filter as needed
const COMMERCE_SUBJECTS = [
  'Bangla 1st Paper', 'Bangla 2nd Paper',
  'English 1st Paper', 'English 2nd Paper',
  'ICT',
];
const ARTS_SUBJECTS = [
  'Bangla 1st Paper', 'Bangla 2nd Paper',
  'English 1st Paper', 'English 2nd Paper',
  'ICT',
];

function getSubjects(group: Group): SubjectName[] {
  if (group === 'Commerce') return COMMERCE_SUBJECTS as SubjectName[];
  if (group === 'Arts')     return ARTS_SUBJECTS as SubjectName[];
  return [...HSC_SUBJECTS];
}

interface HSCPageProps {
  classLevel: ClassLevel; // 'HSC' | 'SSC' — pass from router
}

export default function HSCPage({ classLevel }: HSCPageProps) {
  const [selectedGroup,   setSelectedGroup]   = useState<Group | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectName | null>(null);

  // Reset downstream when group changes
  const handleGroupSelect = (g: Group) => {
    setSelectedGroup(g);
    setSelectedSubject(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6 flex gap-2">
        <span>Start</span><span>›</span>
        <span className="text-gray-600 font-medium">{classLevel}</span>
        {selectedGroup   && <><span>›</span><span className="text-gray-600">{selectedGroup}</span></>}
        {selectedSubject && <><span>›</span><span className="text-gray-600">{selectedSubject}</span></>}
      </nav>

      {/* Step 1 – Group selection */}
      {!selectedGroup && (
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Select your Group — {classLevel}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
            {GROUPS.map(g => (
              <button
                key={g}
                onClick={() => handleGroupSelect(g)}
                className="
                  bg-white border-2 border-emerald-200 rounded-2xl py-8 px-6
                  text-lg font-semibold text-emerald-700 shadow-sm
                  hover:bg-emerald-50 hover:border-emerald-400 hover:shadow-md
                  transition-all duration-200
                "
              >
                {g}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 2 – Subject list */}
      {selectedGroup && !selectedSubject && (
        <section>
          <button
            onClick={() => setSelectedGroup(null)}
            className="text-emerald-600 text-sm mb-4 hover:underline flex items-center gap-1"
          >
            ← Back
          </button>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Select Subject — {selectedGroup}
          </h2>
          <div className="flex flex-col gap-3 max-w-xl">
            {getSubjects(selectedGroup).map(subject => (
              <button
                key={subject}
                onClick={() => setSelectedSubject(subject)}
                className="
                  bg-white border border-gray-200 rounded-xl px-5 py-4 text-left
                  text-gray-800 font-medium shadow-sm
                  hover:bg-emerald-50 hover:border-emerald-300 hover:shadow
                  transition-all duration-150
                "
              >
                📚 {subject}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 3 – Chapter & Lecture list */}
      {selectedGroup && selectedSubject && (
        <section>
          <button
            onClick={() => setSelectedSubject(null)}
            className="text-emerald-600 text-sm mb-4 hover:underline flex items-center gap-1"
          >
            ← Back to Subjects
          </button>
          <SubjectLectures
            platform="HSC"
            classLevel={classLevel}
            group={selectedGroup}
            subject={selectedSubject}
          />
        </section>
      )}
    </div>
  );
}


// ── FILE: src/components/lecture/SubjectLectures.tsx ─────────
// Shows chapters → playlist/oneshot entries for a given subject.

import React, { useEffect, useState } from 'react';
import { getLecturesBySubject, getLecturesByAdmission } from '../../lib/lectureService';
import { LectureEntry, ClassLevel, Group, SubjectName, AdmissionCategory } from '../../types/lecture';
import VideoPlayerModal from './VideoPlayerModal';
import PlaylistModal from './PlaylistModal';

interface Props {
  platform: 'HSC' | 'Admission';
  // HSC props
  classLevel?: ClassLevel;
  group?: Group;
  subject?: SubjectName;
  // Admission props
  admissionCategory?: AdmissionCategory;
  admissionSubject?: string;
}

export default function SubjectLectures({ platform, classLevel, group, subject, admissionCategory, admissionSubject }: Props) {
  const [lectures, setLectures] = useState<LectureEntry[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Video player state
  const [activeOneshot,  setActiveOneshot]  = useState<LectureEntry | null>(null);
  const [activePlaylist, setActivePlaylist] = useState<{ chapter: string; items: LectureEntry[] } | null>(null);

  useEffect(() => {
    setLoading(true);
    const fetch = platform === 'HSC'
      ? getLecturesBySubject(classLevel!, group!, subject!)
      : getLecturesByAdmission(admissionCategory!, admissionSubject);

    fetch.then(data => {
      setLectures(data);
      setLoading(false);
    });
  }, [platform, classLevel, group, subject, admissionCategory, admissionSubject]);

  if (loading) return <div className="py-12 text-center text-gray-400">Loading chapters...</div>;

  // Group by chapterName
  const chapterMap = new Map<string, LectureEntry[]>();
  for (const lec of lectures) {
    if (!chapterMap.has(lec.chapterName)) chapterMap.set(lec.chapterName, []);
    chapterMap.get(lec.chapterName)!.push(lec);
  }

  if (chapterMap.size === 0) {
    return (
      <div className="py-12 text-center text-gray-400">
        No lectures added yet for this subject.
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {[...chapterMap.entries()].map(([chapter, items]) => (
          <ChapterCard
            key={chapter}
            chapterName={chapter}
            items={items}
            onOneshot={setActiveOneshot}
            onPlaylist={(ch, its) => setActivePlaylist({ chapter: ch, items: its })}
          />
        ))}
      </div>

      {/* Oneshot modal */}
      {activeOneshot && (
        <VideoPlayerModal
          lecture={activeOneshot}
          onClose={() => setActiveOneshot(null)}
        />
      )}

      {/* Playlist modal */}
      {activePlaylist && (
        <PlaylistModal
          chapterName={activePlaylist.chapter}
          items={activePlaylist.items}
          onClose={() => setActivePlaylist(null)}
          onSelectVideo={lec => { setActivePlaylist(null); setActiveOneshot(lec); }}
        />
      )}
    </>
  );
}

// ── ChapterCard ──────────────────────────────────────────────

interface ChapterCardProps {
  chapterName: string;
  items: LectureEntry[];
  onOneshot: (lec: LectureEntry) => void;
  onPlaylist: (chapter: string, items: LectureEntry[]) => void;
}

function ChapterCard({ chapterName, items, onOneshot, onPlaylist }: ChapterCardProps) {
  const oneshotItems  = items.filter(i => i.classType === 'ONESHOT');
  const playlistItems = items.filter(i => i.classType === 'PLAYLIST');

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      {/* Chapter heading */}
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
        {chapterName}
      </h3>

      {/* Oneshot entries */}
      {oneshotItems.map(lec => (
        <div key={lec.id} className="mb-3 border border-gray-100 rounded-xl p-3 bg-gray-50">
          <p className="text-sm text-gray-500 mb-2">{lec.mentorName}</p>
          <div className="flex gap-3">
            <button
              onClick={() => onOneshot(lec)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
            >
              🎬 ONESHOT
            </button>
          </div>
        </div>
      ))}

      {/* Playlist entries */}
      {playlistItems.length > 0 && (
        <div className="mb-3 border border-gray-100 rounded-xl p-3 bg-gray-50">
          <p className="text-sm text-gray-500 mb-2">
            {[...new Set(playlistItems.map(p => p.mentorName))].join(', ')}
          </p>
          <button
            onClick={() => onPlaylist(chapterName, playlistItems)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg py-2 text-sm transition-colors"
          >
            ▶ PLAYLIST ({playlistItems.length} videos)
          </button>
        </div>
      )}
    </div>
  );
}


// ── FILE: src/components/lecture/VideoPlayerModal.tsx ────────

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LectureEntry } from '../../types/lecture';
import { useAuth } from '../../contexts/AuthContext'; // your existing auth context
import { toggleLectureLike, getLectureLikeData, addComment, subscribeComments, toggleCommentLike, recordWatchProgress, getWatchHeatmap } from '../../lib/lectureService';
import { LectureComment } from '../../types/lecture';

// Extract YouTube video ID from a URL
function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

interface Props {
  lecture: LectureEntry;
  onClose: () => void;
}

export default function VideoPlayerModal({ lecture, onClose }: Props) {
  const { currentUser } = useAuth();
  const playerRef = useRef<any>(null);

  const [likeCount,   setLikeCount]   = useState(0);
  const [userLiked,   setUserLiked]   = useState(false);
  const [comments,    setComments]    = useState<LectureComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [heatmap,     setHeatmap]     = useState<number[]>(Array(20).fill(0));
  const [speed,       setSpeed]       = useState(1);

  const videoId = extractYouTubeId(lecture.videoLink);

  // Load initial data
  useEffect(() => {
    if (!lecture.id) return;

    getLectureLikeData(lecture.id).then(data => {
      setLikeCount(data.count);
      if (currentUser) setUserLiked(data.likedBy.includes(currentUser.uid));
    });

    getWatchHeatmap(lecture.id).then(setHeatmap);

    const unsub = subscribeComments(lecture.id, setComments);
    return unsub;
  }, [lecture.id, currentUser]);

  // YouTube IFrame API integration
  useEffect(() => {
    if (!videoId || !window.YT) return;

    playerRef.current = new window.YT.Player('yt-player', {
      videoId,
      playerVars: { rel: 0, modestbranding: 1 },
      events: {
        onStateChange: handleStateChange,
      },
    });
  }, [videoId]);

  // Track watch progress every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!playerRef.current || !lecture.id) return;
      const duration = playerRef.current.getDuration?.();
      const current  = playerRef.current.getCurrentTime?.();
      if (duration && current) {
        const pct = (current / duration) * 100;
        recordWatchProgress(lecture.id, pct);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [lecture.id]);

  // Apply playback speed
  useEffect(() => {
    playerRef.current?.setPlaybackRate?.(speed);
  }, [speed]);

  function handleStateChange(event: any) {
    // YT.PlayerState.PLAYING = 1
    if (event.data === 1) {
      playerRef.current?.setPlaybackRate?.(speed);
    }
  }

  // Like handler
  async function handleLike() {
    if (!lecture.id) return;
    const uid = currentUser?.uid ?? 'anonymous';
    const newCount = await toggleLectureLike(lecture.id, uid);
    setLikeCount(newCount);
    setUserLiked(v => !v);
  }

  // Comment submit
  async function handleCommentSubmit() {
    if (!currentUser || !commentText.trim() || !lecture.id) return;
    await addComment(lecture.id, {
      userId:          currentUser.uid,
      userDisplayName: currentUser.displayName || 'User',
      userPhotoURL:    currentUser.photoURL || '',
      text:            commentText.trim(),
    });
    setCommentText('');
  }

  // Download handler (signed-in only)
  function handleDownload(quality: '360' | '480' | '720') {
    if (!currentUser) { alert('Please sign in to download.'); return; }
    // Uses a third-party download service as a proxy; replace with your own endpoint if needed
    const url = `https://www.yt-download.org/api/button/mp4/${videoId}?quality=${quality}`;
    window.open(url, '_blank');
  }

  // Max heatmap value for normalizing bar heights
  const maxHeat = Math.max(...heatmap, 1);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{lecture.chapterName}</h2>
            <p className="text-sm text-gray-500">{lecture.mentorName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">✕</button>
        </div>

        {/* YouTube player */}
        <div className="px-6">
          {videoId ? (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <div id="yt-player" className="absolute inset-0 w-full h-full rounded-xl overflow-hidden" />
            </div>
          ) : (
            <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center text-gray-400">
              Invalid YouTube link
            </div>
          )}
        </div>

        {/* Controls row */}
        <div className="px-6 mt-3 flex flex-wrap items-center gap-3">
          {/* Speed control */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
            <span className="text-xs text-gray-500 font-medium">Speed:</span>
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`text-xs px-2 py-0.5 rounded font-medium transition-colors ${
                  speed === s ? 'bg-emerald-500 text-white' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Picture-in-Picture */}
          <button
            onClick={() => {
              const iframe = document.querySelector('#yt-player iframe') as HTMLElement;
              if (iframe && 'requestPictureInPicture' in iframe) (iframe as any).requestPictureInPicture();
            }}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg"
          >
            ⧉ Picture-in-Picture
          </button>

          {/* Like button */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              userLiked ? 'bg-red-50 border-red-300 text-red-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {userLiked ? '❤️' : '🤍'} {likeCount >= 1000 ? `${(likeCount / 1000).toFixed(1)}K` : likeCount}
          </button>
        </div>

        {/* Watch Heatmap */}
        <div className="px-6 mt-4">
          <p className="text-xs text-gray-400 mb-1">Most-watched moments</p>
          <div className="flex gap-0.5 h-8 items-end">
            {heatmap.map((val, i) => (
              <div
                key={i}
                title={`${i * 5}–${(i + 1) * 5}%`}
                style={{ height: `${Math.max(8, (val / maxHeat) * 100)}%` }}
                className={`flex-1 rounded-t transition-all ${
                  val / maxHeat > 0.7 ? 'bg-red-400' :
                  val / maxHeat > 0.4 ? 'bg-yellow-400' : 'bg-emerald-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Download buttons */}
        <div className="px-6 mt-4 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-600">⬇ Download Class:</span>
          {(['360', '480', '720'] as const).map(q => (
            <button
              key={q}
              onClick={() => handleDownload(q)}
              className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold text-sm px-4 py-1.5 rounded-lg transition-colors"
            >
              {q}p
            </button>
          ))}
          {!currentUser && <span className="text-xs text-gray-400">(Sign in to download)</span>}
        </div>

        {/* PDF button */}
        {lecture.pdfLink && (
          <div className="px-6 mt-3">
            <a
              href={lecture.pdfLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
            >
              📄 View Lecture PDF
            </a>
          </div>
        )}

        {/* Comments */}
        <div className="px-6 mt-6 pb-6">
          <h3 className="text-base font-bold text-gray-800 mb-4">Comments</h3>

          {/* Add comment (signed-in users only) */}
          {currentUser ? (
            <div className="flex gap-3 mb-5">
              <img
                src={currentUser.photoURL || '/default-avatar.png'}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1"
                alt="avatar"
              />
              <div className="flex-1 flex gap-2">
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCommentSubmit()}
                  placeholder="Write a comment..."
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                />
                <button
                  onClick={handleCommentSubmit}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  Post
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mb-4">Sign in to leave a comment.</p>
          )}

          {/* Comment list */}
          <div className="flex flex-col gap-4">
            {comments.map(c => (
              <CommentItem
                key={c.id}
                comment={c}
                lectureId={lecture.id!}
                currentUserId={currentUser?.uid}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CommentItem ──────────────────────────────────────────────

interface CommentItemProps {
  comment: LectureComment;
  lectureId: string;
  currentUserId?: string;
}

function CommentItem({ comment, lectureId, currentUserId }: CommentItemProps) {
  const liked = currentUserId ? comment.likedBy.includes(currentUserId) : false;

  return (
    <div className="flex gap-3">
      <img
        src={comment.userPhotoURL || '/default-avatar.png'}
        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        alt="avatar"
      />
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-800">{comment.userDisplayName}</p>
        <p className="text-sm text-gray-700 mt-0.5">{comment.text}</p>
        <button
          onClick={() => currentUserId && toggleCommentLike(lectureId, comment.id!, currentUserId)}
          className={`mt-1 flex items-center gap-1 text-xs transition-colors ${
            liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
          }`}
        >
          {liked ? '❤️' : '🤍'}
          <span>{comment.likes > 0 ? comment.likes : ''}</span>
        </button>
      </div>
    </div>
  );
}


// ── FILE: src/components/lecture/PlaylistModal.tsx ───────────

import React from 'react';
import { LectureEntry } from '../../types/lecture';

interface Props {
  chapterName: string;
  items: LectureEntry[];
  onClose: () => void;
  onSelectVideo: (lec: LectureEntry) => void;
}

export default function PlaylistModal({ chapterName, items, onClose, onSelectVideo }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{chapterName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">✕</button>
        </div>

        <div className="flex flex-col divide-y divide-gray-100">
          {items.map((lec, idx) => (
            <button
              key={lec.id}
              onClick={() => onSelectVideo(lec)}
              className="flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{lec.videoTitle || lec.chapterName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{lec.mentorName}</p>
              </div>
              <span className="text-gray-300 text-lg">▶</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
