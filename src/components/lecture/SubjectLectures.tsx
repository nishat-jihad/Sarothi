import React, { useEffect, useState } from 'react';
import { getLecturesBySubject, getLecturesByAdmission } from '../../lib/lectureService';
import { LectureEntry, ClassLevel, Group, SubjectName, AdmissionCategory } from '../../types/lecture';
import VideoPlayerModal from './VideoPlayerModal';
import PlaylistModal from './PlaylistModal';

interface Props {
  platform: 'HSC' | 'Admission';
  classLevel?: ClassLevel;
  group?: Group;
  subject?: SubjectName;
  admissionCategory?: AdmissionCategory;
  admissionSubject?: string;
}

export default function SubjectLectures({ platform, classLevel, group, subject, admissionCategory, admissionSubject }: Props) {
  const [lectures, setLectures] = useState<LectureEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOneshot, setActiveOneshot] = useState<LectureEntry | null>(null);
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

  const chapterMap = new Map<string, LectureEntry[]>();
  for (const lec of lectures) {
    if (!chapterMap.has(lec.chapterName)) chapterMap.set(lec.chapterName, []);
    chapterMap.get(lec.chapterName)!.push(lec);
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {[...chapterMap.entries()].map(([chapter, items]) => (
          <ChapterCard key={chapter} chapterName={chapter} items={items} onOneshot={setActiveOneshot} onPlaylist={(ch, its) => setActivePlaylist({ chapter: ch, items: its })} />
        ))}
      </div>
      {activeOneshot && <VideoPlayerModal lecture={activeOneshot} onClose={() => setActiveOneshot(null)} />}
      {activePlaylist && <PlaylistModal chapterName={activePlaylist.chapter} items={activePlaylist.items} onClose={() => setActivePlaylist(null)} onSelectVideo={lec => { setActivePlaylist(null); setActiveOneshot(lec); }} />}
    </>
  );
}

// Sub-component: ChapterCard
function ChapterCard({ chapterName, items, onOneshot, onPlaylist }: any) {
  const oneshotItems = items.filter((i: any) => i.classType === 'ONESHOT');
  const playlistItems = items.filter((i: any) => i.classType === 'PLAYLIST');

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500" /> {chapterName}
      </h3>
      {oneshotItems.map((lec: any) => (
        <div key={lec.id} className="mb-3 border border-gray-100 rounded-xl p-3 bg-gray-50">
          <p className="text-sm text-gray-500 mb-2">{lec.mentorName}</p>
          <button onClick={() => onOneshot(lec)} className="w-full bg-blue-600 text-white font-semibold rounded-lg py-2 text-sm">🎬 ONESHOT</button>
        </div>
      ))}
      {playlistItems.length > 0 && (
        <div className="mb-3 border border-gray-100 rounded-xl p-3 bg-gray-50">
          <p className="text-sm text-gray-500 mb-2">{[...new Set(playlistItems.map((p:any) => p.mentorName))].join(', ')}</p>
          <button onClick={() => onPlaylist(chapterName, playlistItems)} className="w-full bg-red-600 text-white font-semibold rounded-lg py-2 text-sm">▶ PLAYLIST ({playlistItems.length} videos)</button>
        </div>
      )}
    </div>
  );
}
