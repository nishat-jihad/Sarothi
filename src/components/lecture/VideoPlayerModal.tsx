import React, { useEffect, useRef, useState } from 'react';
import { LectureEntry, LectureComment } from '../../types/lecture';
import { useAuth } from '../../contexts/AuthContext';
import { toggleLectureLike, getLectureLikeData, addComment, subscribeComments, toggleCommentLike, recordWatchProgress, getWatchHeatmap } from '../../lib/lectureService';

function extractYouTubeId(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function VideoPlayerModal({ lecture, onClose }: { lecture: LectureEntry; onClose: () => void }) {
  const { currentUser } = useAuth();
  const playerRef = useRef<any>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [comments, setComments] = useState<LectureComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [heatmap, setHeatmap] = useState<number[]>(Array(20).fill(0));
  const [speed, setSpeed] = useState(1);

  const videoId = extractYouTubeId(lecture.videoLink);

  useEffect(() => {
    if (!lecture.id) return;
    getLectureLikeData(lecture.id).then(data => {
      setLikeCount(data.count);
      if (currentUser) setUserLiked(data.likedBy.includes(currentUser.uid));
    });
    getWatchHeatmap(lecture.id).then(setHeatmap);
    return subscribeComments(lecture.id, setComments);
  }, [lecture.id, currentUser]);

  useEffect(() => {
    if (!videoId || !window.YT) return;
    playerRef.current = new window.YT.Player('yt-player', {
      videoId,
      playerVars: { rel: 0, modestbranding: 1 },
      events: { onStateChange: (e: any) => e.data === 1 && playerRef.current.setPlaybackRate(speed) }
    });
  }, [videoId]);

  const handleLike = async () => {
    if (!lecture.id) return;
    const newCount = await toggleLectureLike(lecture.id, currentUser?.uid || 'anonymous');
    setLikeCount(newCount);
    setUserLiked(!userLiked);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-4">
          <div><h2 className="text-xl font-bold">{lecture.chapterName}</h2><p className="text-sm text-gray-500">{lecture.mentorName}</p></div>
          <button onClick={onClose} className="text-2xl">✕</button>
        </div>
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
          <div id="yt-player" className="absolute inset-0 w-full h-full" />
        </div>
        {/* অন্যান্য কন্ট্রোল এবং কমেন্ট সেকশন এখানে থাকবে... */}
      </div>
    </div>
  );
}
