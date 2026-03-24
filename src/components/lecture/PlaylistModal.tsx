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
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{chapterName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">✕</button>
        </div>
        <div className="flex flex-col divide-y divide-gray-100">
          {items.map((lec, idx) => (
            <button key={lec.id} onClick={() => onSelectVideo(lec)} className="flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors">
              <span className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-sm">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{lec.videoTitle || lec.chapterName}</p>
                <p className="text-xs text-gray-400">{lec.mentorName}</p>
              </div>
              <span className="text-gray-300">▶</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
