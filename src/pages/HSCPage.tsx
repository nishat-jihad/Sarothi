import React, { useState } from 'react';
import { HSC_SUBJECTS, ClassLevel, Group, SubjectName } from '../types/lecture';
import SubjectLectures from '../components/lecture/SubjectLectures';

const GROUPS: Group[] = ['Science', 'Commerce', 'Arts'];

const COMMERCE_SUBJECTS = ['Bangla 1st Paper', 'Bangla 2nd Paper', 'English 1st Paper', 'English 2nd Paper', 'ICT'];
const ARTS_SUBJECTS = ['Bangla 1st Paper', 'Bangla 2nd Paper', 'English 1st Paper', 'English 2nd Paper', 'ICT'];

function getSubjects(group: Group): SubjectName[] {
  if (group === 'Commerce') return COMMERCE_SUBJECTS as SubjectName[];
  if (group === 'Arts') return ARTS_SUBJECTS as SubjectName[];
  return [...HSC_SUBJECTS];
}

interface HSCPageProps {
  classLevel: ClassLevel;
}

export default function HSCPage({ classLevel }: HSCPageProps) {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectName | null>(null);

  const handleGroupSelect = (g: Group) => {
    setSelectedGroup(g);
    setSelectedSubject(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <nav className="text-sm text-gray-400 mb-6 flex gap-2">
        <span>Start</span><span>›</span>
        <span className="text-gray-600 font-medium">{classLevel}</span>
        {selectedGroup && <><span>›</span><span className="text-gray-600">{selectedGroup}</span></>}
        {selectedSubject && <><span>›</span><span className="text-gray-600">{selectedSubject}</span></>}
      </nav>

      {!selectedGroup && (
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Select your Group — {classLevel}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
            {GROUPS.map(g => (
              <button key={g} onClick={() => handleGroupSelect(g)} className="bg-white border-2 border-emerald-200 rounded-2xl py-8 px-6 text-lg font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 hover:border-emerald-400 transition-all">
                {g}
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedGroup && !selectedSubject && (
        <section>
          <button onClick={() => setSelectedGroup(null)} className="text-emerald-600 text-sm mb-4 hover:underline">← Back</button>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Subject — {selectedGroup}</h2>
          <div className="flex flex-col gap-3 max-w-xl">
            {getSubjects(selectedGroup).map(subject => (
              <button key={subject} onClick={() => setSelectedSubject(subject)} className="bg-white border border-gray-200 rounded-xl px-5 py-4 text-left font-medium hover:bg-emerald-50 hover:border-emerald-300 transition-all">
                📚 {subject}
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedGroup && selectedSubject && (
        <section>
          <button onClick={() => setSelectedSubject(null)} className="text-emerald-600 text-sm mb-4 hover:underline">← Back to Subjects</button>
          <SubjectLectures platform="HSC" classLevel={classLevel} group={selectedGroup} subject={selectedSubject} />
        </section>
      )}
    </div>
  );
}
