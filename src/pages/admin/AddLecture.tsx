// ── FILE: src/pages/admin/AddLecture.tsx ─────────────────────
import React, { useState } from 'react';
import { addLecture } from '../../lib/lectureService';
import { ClassLevel, Group, SubjectName, AdmissionCategory, ClassType, HSC_SUBJECTS } from '../../types/lecture';

const ADMISSION_CATEGORIES: AdmissionCategory[] = ['Engineering', 'University', 'Medical', 'GST'];
const GROUPS: Group[] = ['Science', 'Commerce', 'Arts'];
const CLASS_LEVELS: ClassLevel[] = ['HSC', 'SSC'];

interface ClassEntry {
  mentorName: string;
  videoLink: string;
  pdfLink: string;
  videoTitle: string;
}

function emptyEntry(): ClassEntry {
  return { mentorName: '', videoLink: '', pdfLink: '', videoTitle: '' };
}

export default function AddLecture() {
  const [section, setSection] = useState<'HSC' | 'Admission'>('HSC');

  // HSC/SSC fields
  const [classLevel, setClassLevel] = useState<ClassLevel>('HSC');
  const [group, setGroup] = useState<Group>('Science');
  const [subject, setSubject] = useState<SubjectName>(HSC_SUBJECTS[0]);

  // Admission fields
  const [admCat, setAdmCat] = useState<AdmissionCategory>('Engineering');
  const [admSubject, setAdmSubject] = useState('');

  // Shared
  const [chapterName, setChapterName] = useState('');
  const [classType, setClassType] = useState<ClassType>('ONESHOT');
  const [entries, setEntries] = useState<ClassEntry[]>([emptyEntry()]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  function updateEntry(idx: number, field: keyof ClassEntry, value: string) {
    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  }

  function addEntry() {
    setEntries(prev => [...prev, emptyEntry()]);
  }

  function removeEntry(idx: number) {
    setEntries(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!chapterName.trim()) { alert('Chapter name is required.'); return; }

    setSaving(true);
    try {
      for (const entry of entries) {
        if (!entry.videoLink.trim()) continue;

        const base = {
          chapterName: chapterName.trim(),
          classType,
          mentorName: entry.mentorName.trim(),
          videoLink: entry.videoLink.trim(),
          pdfLink: entry.pdfLink.trim(),
          videoTitle: entry.videoTitle.trim(),
        };

        if (section === 'HSC') {
          await addLecture({ ...base, platform: 'HSC', classLevel, group, subject });
        } else {
          await addLecture({
            ...base,
            platform: 'Admission',
            admissionCategory: admCat,
            admissionSubject: admSubject.trim() || undefined,
          });
        }
      }

      setSuccess(true);
      setChapterName('');
      setEntries([emptyEntry()]);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Error saving. Check console.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Class / Lecture</h1>

      <div className="flex gap-2 mb-6">
        {(['HSC', 'Admission'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              section === s ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
        {section === 'HSC' && (
          <>
            <Row label="Level">
              <SegmentedControl options={CLASS_LEVELS} value={classLevel} onChange={v => setClassLevel(v as ClassLevel)} />
            </Row>
            <Row label="Group">
              <SegmentedControl options={GROUPS} value={group} onChange={v => setGroup(v as Group)} />
            </Row>
            <Row label="Subject">
              <select
                value={subject}
                onChange={e => setSubject(e.target.value as SubjectName)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              >
                {HSC_SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </Row>
          </>
        )}

        {section === 'Admission' && (
          <>
            <Row label="Category">
              <SegmentedControl options={ADMISSION_CATEGORIES} value={admCat} onChange={v => setAdmCat(v as AdmissionCategory)} />
            </Row>
            <Row label="Subject (optional)">
              <input
                value={admSubject}
                onChange={e => setAdmSubject(e.target.value)}
                placeholder="e.g. Physics, Math..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </Row>
          </>
        )}

        <Row label="Chapter Name *">
          <input
            value={chapterName}
            onChange={e => setChapterName(e.target.value)}
            placeholder="e.g. Newton's Laws of Motion"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 font-semibold"
          />
        </Row>

        <Row label="Class Type">
          <div className="flex gap-3">
            <button
              onClick={() => setClassType('ONESHOT')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 ${classType === 'ONESHOT' ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-500'}`}
            >
              ONESHOT
            </button>
            <button
              onClick={() => setClassType('PLAYLIST')}
              className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 ${classType === 'PLAYLIST' ? 'bg-red-600 text-white border-red-600' : 'border-gray-200 text-gray-500'}`}
            >
              PLAYLIST
            </button>
          </div>
        </Row>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-3 block">
            {classType === 'ONESHOT' ? 'Oneshot Entries' : 'Playlist Videos'}
          </label>
          <div className="flex flex-col gap-4">
            {entries.map((entry, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50 relative">
                {entries.length > 1 && (
                  <button onClick={() => removeEntry(idx)} className="absolute top-3 right-3 text-gray-300 hover:text-red-400 text-lg">✕</button>
                )}
                <p className="text-xs font-bold text-gray-400 uppercase mb-3">Entry #{idx + 1}</p>
                <input
                  value={entry.mentorName}
                  onChange={e => updateEntry(idx, 'mentorName', e.target.value)}
                  placeholder="Mentor / Platform name"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2"
                />
                <input
                  value={entry.videoLink}
                  onChange={e => updateEntry(idx, 'videoLink', e.target.value)}
                  placeholder="YouTube video link *"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2"
                />
                {classType === 'PLAYLIST' && (
                  <input
                    value={entry.videoTitle}
                    onChange={e => updateEntry(idx, 'videoTitle', e.target.value)}
                    placeholder="Video title"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2"
                  />
                )}
                <input
                  value={entry.pdfLink}
                  onChange={e => updateEntry(idx, 'pdfLink', e.target.value)}
                  placeholder="PDF link (optional)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
          <button onClick={addEntry} className="mt-3 text-emerald-600 text-sm font-semibold hover:underline">+ Add More</button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl"
        >
          {saving ? 'Saving...' : '💾 Save Lecture'}
        </button>

        {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl py-3 text-center">✅ Saved successfully!</div>}
      </div>
    </div>
  );
}

// Helpers
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function SegmentedControl({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void; }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${value === o ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
