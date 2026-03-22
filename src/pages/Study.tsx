import React, { useState, useEffect } from 'react';
import {
  collection, onSnapshot, query, where, orderBy,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../hooks/useAuth';
import {
  ChevronRight, ChevronLeft, BookOpen, FileText,
  Plus, Edit, Trash2, Upload, Download, X,
  Loader2, ZoomIn, ChevronDown, BookMarked
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Cloudinary ──
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = 'sarothi_upload';

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
  const data = await res.json();
  if (!data.secure_url) throw new Error('Cloudinary upload failed');
  return data.secure_url;
};

const uploadFileSmart = async (file: File, path: string): Promise<string> => {
  // For PDFs use Firebase Storage (Cloudinary free plan doesn't support PDFs well)
  if (file.type === 'application/pdf') {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }
  try { return await uploadToCloudinary(file); }
  catch {
    const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }
};

// ── Constants ──
const HSC_SCIENCE_SUBJECTS = [
  { id: 'bangla1', name: 'Bangla 1st Paper', icon: '📖' },
  { id: 'bangla2', name: 'Bangla 2nd Paper', icon: '📖' },
  { id: 'english1', name: 'English 1st Paper', icon: '🔤' },
  { id: 'english2', name: 'English 2nd Paper', icon: '🔤' },
  { id: 'physics1', name: 'Physics 1st Paper', icon: '⚡' },
  { id: 'physics2', name: 'Physics 2nd Paper', icon: '⚡' },
  { id: 'chemistry1', name: 'Chemistry 1st Paper', icon: '🧪' },
  { id: 'chemistry2', name: 'Chemistry 2nd Paper', icon: '🧪' },
  { id: 'biology1', name: 'Biology 1st Paper', icon: '🧬' },
  { id: 'biology2', name: 'Biology 2nd Paper', icon: '🧬' },
  { id: 'math1', name: 'Higher Math 1st Paper', icon: '📐' },
  { id: 'math2', name: 'Higher Math 2nd Paper', icon: '📐' },
  { id: 'ict', name: 'ICT', icon: '💻' },
];

const ADMISSION_SUBJECTS = [
  { id: 'adm_physics1', name: 'Physics 1st Paper', icon: '⚡' },
  { id: 'adm_physics2', name: 'Physics 2nd Paper', icon: '⚡' },
  { id: 'adm_chemistry1', name: 'Chemistry 1st Paper', icon: '🧪' },
  { id: 'adm_chemistry2', name: 'Chemistry 2nd Paper', icon: '🧪' },
  { id: 'adm_math1', name: 'Higher Math 1st Paper', icon: '📐' },
  { id: 'adm_math2', name: 'Higher Math 2nd Paper', icon: '📐' },
  { id: 'adm_biology1', name: 'Biology 1st Paper', icon: '🧬' },
  { id: 'adm_biology2', name: 'Biology 2nd Paper', icon: '🧬' },
];

type StudySection = 'hsc' | 'admission';
type ViewState = 'sections' | 'subjects' | 'chapters' | 'viewer';

interface Chapter {
  id: string;
  subjectId: string;
  section: string;
  name: string;
  order: number;
  createdAt: any;
}

interface StudyFile {
  id: string;
  chapterId: string;
  name: string;
  url: string;
  type: 'image' | 'pdf';
  order: number;
  uploadedAt: any;
}

export const Study: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [view, setView] = useState<ViewState>('sections');
  const [section, setSection] = useState<StudySection | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [files, setFiles] = useState<StudyFile[]>([]);

  // Admin states
  const [showChapterForm, setShowChapterForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chapterName, setChapterName] = useState('');
  const [isSavingChapter, setIsSavingChapter] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Viewer state
  const [viewerFiles, setViewerFiles] = useState<StudyFile[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Load chapters when subject selected
  useEffect(() => {
    if (!selectedSubject || !section) return;
    const q = query(
      collection(db, 'study_chapters'),
      where('subjectId', '==', selectedSubject.id),
      where('section', '==', section),
      orderBy('order', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setChapters(snap.docs.map(d => ({ id: d.id, ...d.data() } as Chapter)));
    });
    return () => unsub();
  }, [selectedSubject, section]);

  // Load files when chapter selected
  useEffect(() => {
    if (!selectedChapter) return;
    const q = query(
      collection(db, 'study_files'),
      where('chapterId', '==', selectedChapter.id),
      orderBy('order', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudyFile)));
    });
    return () => unsub();
  }, [selectedChapter]);

  // ── Save chapter ──
  const saveChapter = async () => {
    if (!chapterName.trim() || !selectedSubject || !section) return;
    setIsSavingChapter(true);
    try {
      if (editingChapter) {
        await updateDoc(doc(db, 'study_chapters', editingChapter.id), { name: chapterName.trim() });
      } else {
        await addDoc(collection(db, 'study_chapters'), {
          subjectId: selectedSubject.id,
          section,
          name: chapterName.trim(),
          order: chapters.length + 1,
          createdAt: serverTimestamp(),
        });
      }
      setChapterName('');
      setEditingChapter(null);
      setShowChapterForm(false);
    } catch { alert('Failed to save chapter!'); }
    setIsSavingChapter(false);
  };

  const deleteChapter = async (id: string) => {
    if (!confirm('Delete this chapter and all its files?')) return;
    await deleteDoc(doc(db, 'study_chapters', id));
  };

  // ── Upload file to chapter ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedChapter) return;
    setIsUploadingFile(true);
    try {
      const fileType = file.type === 'application/pdf' ? 'pdf' : 'image';
      const url = await uploadFileSmart(file, `study/${selectedChapter.id}`);
      await addDoc(collection(db, 'study_files'), {
        chapterId: selectedChapter.id,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
        type: fileType,
        order: files.length + 1,
        uploadedAt: serverTimestamp(),
      });
    } catch { alert('Upload failed!'); }
    setIsUploadingFile(false);
    e.target.value = '';
  };

  const deleteFile = async (id: string) => {
    if (!confirm('Delete this file?')) return;
    await deleteDoc(doc(db, 'study_files', id));
  };

  // ── Open viewer ──
  const openViewer = (fileList: StudyFile[], startIndex: number) => {
    setViewerFiles(fileList);
    setViewerIndex(startIndex);
    setPdfUrl(fileList[startIndex]?.type === 'pdf' ? fileList[startIndex].url : null);
    setView('viewer');
  };

  const navigateViewer = (dir: 'prev' | 'next') => {
    const newIdx = dir === 'prev' ? viewerIndex - 1 : viewerIndex + 1;
    if (newIdx < 0 || newIdx >= viewerFiles.length) return;
    setViewerIndex(newIdx);
    setPdfUrl(viewerFiles[newIdx]?.type === 'pdf' ? viewerFiles[newIdx].url : null);
  };

  const currentSubjects = section === 'hsc' ? HSC_SCIENCE_SUBJECTS : ADMISSION_SUBJECTS;

  // ── Breadcrumb ──
  const Breadcrumb = () => (
    <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 mb-8">
      <button onClick={() => { setView('sections'); setSection(null); setSelectedSubject(null); setSelectedChapter(null); }} className="hover:text-emerald-600">Study</button>
      {section && <><ChevronRight className="w-3 h-3" /><button onClick={() => { setView('subjects'); setSelectedSubject(null); setSelectedChapter(null); }} className="hover:text-emerald-600">{section === 'hsc' ? 'HSC Science' : 'Admission Science'}</button></>}
      {selectedSubject && <><ChevronRight className="w-3 h-3" /><button onClick={() => { setView('chapters'); setSelectedChapter(null); }} className="hover:text-emerald-600">{selectedSubject.name}</button></>}
      {selectedChapter && <><ChevronRight className="w-3 h-3" /><span className="text-zinc-900 dark:text-white">{selectedChapter.name}</span></>}
    </div>
  );

  // ════════════════════════════════════════
  // VIEWER (Full page)
  // ════════════════════════════════════════
  if (view === 'viewer') {
    const current = viewerFiles[viewerIndex];
    return (
      <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col">
        {/* Viewer header */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('chapters')} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-white font-bold text-sm">{current?.name}</p>
              <p className="text-zinc-400 text-xs">{selectedChapter?.name} • {selectedSubject?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Page counter */}
            <span className="text-zinc-400 text-xs font-bold">
              {viewerIndex + 1} / {viewerFiles.length}
            </span>
            {/* Download */}
            <a href={current?.url} download target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg">
              <Download className="w-4 h-4" /> Download
            </a>
            <button onClick={() => setView('chapters')} className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer body */}
        <div className="flex-1 overflow-auto flex items-start justify-center bg-zinc-950 p-4">
          {current?.type === 'pdf' ? (
            <iframe
              src={`${current.url}#toolbar=1&navpanes=1`}
              className="w-full max-w-4xl h-full min-h-[80vh] rounded-lg border border-zinc-800"
              title={current.name}
            />
          ) : (
            <img
              src={current?.url}
              alt={current?.name}
              className="max-w-4xl w-full h-auto rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        {/* Navigation arrows */}
        {viewerFiles.length > 1 && (
          <div className="flex items-center justify-center gap-4 py-4 bg-zinc-900 border-t border-zinc-800">
            <button onClick={() => navigateViewer('prev')} disabled={viewerIndex === 0}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-lg disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {/* Thumbnail dots */}
            <div className="flex gap-1.5">
              {viewerFiles.map((_, i) => (
                <button key={i} onClick={() => { setViewerIndex(i); setPdfUrl(viewerFiles[i]?.type === 'pdf' ? viewerFiles[i].url : null); }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${i === viewerIndex ? 'bg-emerald-500 scale-125' : 'bg-zinc-600 hover:bg-zinc-400'}`} />
              ))}
            </div>

            <button onClick={() => navigateViewer('next')} disabled={viewerIndex === viewerFiles.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold rounded-lg disabled:opacity-30">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════
  // MAIN CONTENT
  // ════════════════════════════════════════
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 min-h-[70vh]">
      <Breadcrumb />

      <AnimatePresence mode="wait">

        {/* ── SECTION SELECTION ── */}
        {view === 'sections' && (
          <motion.div key="sections" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="mb-8">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">Study Materials</h1>
              <p className="text-zinc-500 mt-1">Formula sheets, notes & resources</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* HSC Science */}
              <button onClick={() => { setSection('hsc'); setView('subjects'); }}
                className="group relative h-64 bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl hover:border-emerald-500">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center text-4xl">📘</div>
                  <div className="text-center">
                    <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter block">HSC Science</span>
                    <span className="text-sm text-zinc-500 mt-1">13 subjects • Formula sheets</span>
                  </div>
                </div>
              </button>
              {/* Admission Science */}
              <button onClick={() => { setSection('admission'); setView('subjects'); }}
                className="group relative h-64 bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl hover:border-blue-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center text-4xl">🎓</div>
                  <div className="text-center">
                    <span className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter block">Admission Science</span>
                    <span className="text-sm text-zinc-500 mt-1">8 subjects • Formula sheets</span>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {/* ── SUBJECT LIST ── */}
        {view === 'subjects' && (
          <motion.div key="subjects" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter mb-6">
              {section === 'hsc' ? '📘 HSC Science' : '🎓 Admission Science'}
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {currentSubjects.map(subject => (
                <button key={subject.id}
                  onClick={() => { setSelectedSubject(subject); setView('chapters'); }}
                  className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-2xl group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20 transition-colors">
                      {subject.icon}
                    </div>
                    <span className="text-base font-bold text-zinc-900 dark:text-white">{subject.name}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-emerald-600 transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── CHAPTER LIST ── */}
        {view === 'chapters' && selectedSubject && (
          <motion.div key="chapters" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">
                  {selectedSubject.icon} {selectedSubject.name}
                </h2>
                <p className="text-zinc-500 text-sm mt-1">{chapters.length} chapter{chapters.length !== 1 ? 's' : ''}</p>
              </div>
              {isAdmin && (
                <button onClick={() => { setEditingChapter(null); setChapterName(''); setShowChapterForm(true); }}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg">
                  <Plus className="w-4 h-4" /> Add Chapter
                </button>
              )}
            </div>

            {chapters.length === 0 ? (
              <div className="text-center py-20 text-zinc-400">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-bold">No chapters yet</p>
                {isAdmin && <p className="text-sm mt-1">Click "Add Chapter" to get started</p>}
              </div>
            ) : (
              <div className="space-y-3">
                {chapters.map((chapter, idx) => (
                  <div key={chapter.id}
                    className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 transition-all group cursor-pointer"
                    onClick={() => { setSelectedChapter(chapter); }}>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-600 font-black text-sm">
                        {idx + 1}
                      </div>
                      <span className="font-bold text-zinc-900 dark:text-white">{chapter.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <>
                          <button onClick={e => { e.stopPropagation(); setEditingChapter(chapter); setChapterName(chapter.name); setShowChapterForm(true); }}
                            className="p-2 text-zinc-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); deleteChapter(chapter.id); }}
                            className="p-2 text-zinc-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-emerald-600 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── FILES IN CHAPTER ── */}
        {view === 'chapters' && selectedChapter && (
          <motion.div key="files" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedChapter(null)} className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">{selectedChapter.name}</h2>
                  <p className="text-zinc-500 text-sm">{files.length} file{files.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              {isAdmin && (
                <label className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg cursor-pointer transition-colors ${isUploadingFile ? 'bg-zinc-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                  {isUploadingFile ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload File</>}
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" disabled={isUploadingFile} />
                </label>
              )}
            </div>

            {files.length === 0 ? (
              <div className="text-center py-20 text-zinc-400">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-bold">No files uploaded yet</p>
                {isAdmin && <p className="text-sm mt-1">Upload PDF or images for this chapter</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {files.map((file, idx) => (
                  <div key={file.id}
                    className="group relative bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:border-emerald-500 transition-all shadow-md hover:shadow-emerald-600/10 cursor-pointer"
                    onClick={() => openViewer(files, idx)}>
                    {/* Preview */}
                    <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                      {file.type === 'image' ? (
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-400">
                          <FileText className="w-10 h-10 text-red-500" />
                          <span className="text-xs font-bold text-red-500 uppercase">PDF</span>
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{file.name}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${file.type === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                          {file.type}
                        </span>
                        <div className="flex gap-1">
                          <button onClick={e => { e.stopPropagation(); openViewer(files, idx); }}
                            className="p-1.5 text-zinc-400 hover:text-emerald-600 transition-colors" title="View">
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          <a href={file.url} download target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="p-1.5 text-zinc-400 hover:text-blue-600 transition-colors" title="Download">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                          {isAdmin && (
                            <button onClick={e => { e.stopPropagation(); deleteFile(file.id); }}
                              className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 dark:group-hover:bg-white/5 transition-colors pointer-events-none rounded-2xl" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Chapter Form Modal ── */}
      {showChapterForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-8 w-full max-w-md border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-black text-zinc-900 dark:text-white">
                {editingChapter ? '✏️ Edit Chapter' : '➕ Add Chapter'}
              </h4>
              <button onClick={() => setShowChapterForm(false)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">Chapter Name *</label>
                <input
                  type="text"
                  value={chapterName}
                  onChange={e => setChapterName(e.target.value)}
                  placeholder="e.g. Chapter 1 – Electrostatics"
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  onKeyDown={e => e.key === 'Enter' && saveChapter()}
                  autoFocus
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowChapterForm(false)} className="flex-1 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">
                  Cancel
                </button>
                <button onClick={saveChapter} disabled={isSavingChapter || !chapterName.trim()}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSavingChapter ? <Loader2 className="w-4 h-4 animate-spin" /> : editingChapter ? '💾 Save' : '✅ Add'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
