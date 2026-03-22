import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { Update, SlideshowImage, Question } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Plus, Trash2, Edit, Upload, Image as ImageIcon, FileText, Loader2, Settings, Users, Bell, X } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion } from 'framer-motion';

// ── Cloudinary Config ──
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = 'sarothi_upload';

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );
  const data = await response.json();
  if (!data.secure_url) throw new Error('Cloudinary upload failed');
  return data.secure_url;
};

const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    return await uploadToCloudinary(file);
  } catch (err) {
    console.warn('Cloudinary failed, trying Firebase Storage...', err);
    const storageRef = ref(storage, `${path}/${Date.now()}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }
};

export const Admin: React.FC = () => {
  const { isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'slideshow' | 'updates' | 'questions' | 'users' | 'content'>('slideshow');
  const [slides, setSlides] = useState<SlideshowImage[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [siteContent, setSiteContent] = useState<any>({});
  const [isUploading, setIsUploading] = useState(false);

  // Question form
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    type: 'HSC',
    year: new Date().getFullYear().toString(),
    questionType: 'MCQ',
    category: 'Engineering',
    imageUrls: [],
  });
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);

  // Update form
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<Update | null>(null);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');
  const [isSavingUpdate, setIsSavingUpdate] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const qS = query(collection(db, 'slideshow'), orderBy('order', 'asc'));
    const unsubscribeS = onSnapshot(qS, (snapshot) => {
      setSlides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SlideshowImage)));
    });
    const qU = query(collection(db, 'updates'), orderBy('createdAt', 'desc'));
    const unsubscribeU = onSnapshot(qU, (snapshot) => {
      setUpdates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Update)));
    });
    const qQ = query(collection(db, 'questions'), orderBy('uploadedAt', 'desc'));
    const unsubscribeQ = onSnapshot(qQ, (snapshot) => {
      setQuestions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question)));
    });
    const unsubscribeC = onSnapshot(collection(db, 'site_content'), (snapshot) => {
      const content: any = {};
      snapshot.docs.forEach(doc => { content[doc.id] = doc.data(); });
      setSiteContent(content);
    });
    return () => { unsubscribeS(); unsubscribeU(); unsubscribeQ(); unsubscribeC(); };
  }, [isAdmin]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  if (!isAdmin) return <div className="text-center py-20 text-red-500 font-bold">Access Denied. Admin only.</div>;

  const updateSiteContent = async (id: string, data: any) => {
    try {
      await setDoc(doc(db, 'site_content', id), data);
      alert('Content updated!');
    } catch (err) { alert('Update failed'); }
  };

  // ── Slide Upload ──
  const handleSlideUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (slides.length >= 6) { alert('Maximum 6 slides allowed!'); return; }
    setIsUploading(true);
    try {
      const url = await uploadImage(file, 'slideshow');
      await addDoc(collection(db, 'slideshow'), { url, order: slides.length + 1 });
    } catch (err) { alert('Upload failed!'); }
    setIsUploading(false);
  };

  const deleteSlide = async (id: string) => {
    if (confirm('Delete this slide?')) await deleteDoc(doc(db, 'slideshow', id));
  };

  // ── Question: Add image to array ──
  const handleAddQuestionImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const currentImages = newQuestion.imageUrls || [];
    const index = currentImages.length;
    setUploadingImageIndex(index);
    try {
      const url = await uploadImage(file, 'questions');
      setNewQuestion(prev => ({
        ...prev,
        imageUrls: [...(prev.imageUrls || []), url],
        imageUrl: prev.imageUrls?.length === 0 ? url : prev.imageUrl, // backward compat
        downloadUrl: url,
      }));
    } catch (err) { alert('Image upload failed!'); }
    setUploadingImageIndex(null);
    // Reset file input
    e.target.value = '';
  };

  // ── Question: Remove image from array ──
  const removeQuestionImage = (index: number) => {
    setNewQuestion(prev => ({
      ...prev,
      imageUrls: (prev.imageUrls || []).filter((_, i) => i !== index),
    }));
  };

  const handleQuestionUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const imgs = newQuestion.imageUrls || [];
    if (imgs.length === 0) { alert('Please upload at least one image!'); return; }
    if (!newQuestion.subject) { alert('Please enter subject name!'); return; }
    setIsUploading(true);
    try {
      await addDoc(collection(db, 'questions'), {
        ...newQuestion,
        imageUrls: imgs,
        imageUrl: imgs[0], // backward compat
        uploadedAt: serverTimestamp(),
      });
      setShowQuestionForm(false);
      setNewQuestion({ type: 'HSC', year: new Date().getFullYear().toString(), questionType: 'MCQ', imageUrls: [] });
      alert('Question uploaded!');
    } catch (err) { alert('Upload failed'); }
    setIsUploading(false);
  };

  const deleteQuestion = async (id: string) => {
    if (confirm('Delete this question?')) await deleteDoc(doc(db, 'questions', id));
  };

  // ── Update CRUD ──
  const openNewUpdateForm = () => { setEditingUpdate(null); setUpdateTitle(''); setUpdateContent(''); setShowUpdateForm(true); };
  const openEditUpdateForm = (update: Update) => { setEditingUpdate(update); setUpdateTitle(update.title || ''); setUpdateContent(update.content || ''); setShowUpdateForm(true); };
  const closeUpdateForm = () => { setShowUpdateForm(false); setEditingUpdate(null); setUpdateTitle(''); setUpdateContent(''); };

  const handleSaveUpdate = async () => {
    if (!updateTitle.trim()) { alert('Title is required!'); return; }
    if (!updateContent.trim()) { alert('Content is required!'); return; }
    setIsSavingUpdate(true);
    try {
      if (editingUpdate) {
        await updateDoc(doc(db, 'updates', editingUpdate.id), { title: updateTitle.trim(), content: updateContent.trim() });
      } else {
        await addDoc(collection(db, 'updates'), { title: updateTitle.trim(), content: updateContent.trim(), createdAt: serverTimestamp() });
      }
      closeUpdateForm();
    } catch (err) { alert('Failed to save update!'); }
    setIsSavingUpdate(false);
  };

  const deleteUpdate = async (id: string) => {
    if (confirm('Delete this update?')) await deleteDoc(doc(db, 'updates', id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">

        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-6 tracking-tighter">Admin Panel</h2>
          {[
            { id: 'slideshow', name: 'Slideshow', icon: ImageIcon },
            { id: 'updates', name: 'Updates', icon: Bell },
            { id: 'questions', name: 'Questions', icon: FileText },
            { id: 'content', name: 'Site Content', icon: Settings },
            { id: 'users', name: 'Users', icon: Users },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
              <tab.icon className="w-5 h-5" />{tab.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl">

          {/* SLIDESHOW */}
          {activeTab === 'slideshow' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Manage Slideshow ({slides.length}/6)</h3>
                <label className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg cursor-pointer transition-colors ${slides.length >= 6 || isUploading ? 'bg-zinc-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isUploading ? 'Uploading...' : 'Add Slide'}
                  <input type="file" className="hidden" onChange={handleSlideUpload} accept="image/*" disabled={slides.length >= 6 || isUploading} />
                </label>
              </div>
              {slides.length === 0 && <div className="text-center py-16 text-zinc-400"><ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No slides yet.</p></div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {slides.map((slide) => (
                  <div key={slide.id} className="relative group rounded-2xl overflow-hidden aspect-video bg-zinc-100 dark:bg-zinc-800">
                    <img src={slide.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="slide" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => deleteSlide(slide.id)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UPDATES */}
          {activeTab === 'updates' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Admission Updates</h3>
                <button onClick={openNewUpdateForm} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> New Update
                </button>
              </div>
              {updates.length === 0 && <div className="text-center py-16 text-zinc-400"><Bell className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No updates yet.</p></div>}
              <div className="space-y-4">
                {updates.map((update) => (
                  <div key={update.id} className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-start">
                    <div className="flex-1 mr-4">
                      <h4 className="font-bold text-zinc-900 dark:text-white">{update.title}</h4>
                      <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{update.content}</p>
                      <p className="text-xs text-zinc-400 mt-2">{update.createdAt?.seconds ? new Date(update.createdAt.seconds * 1000).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => openEditUpdateForm(update)} className="p-2 text-zinc-400 hover:text-emerald-600"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => deleteUpdate(update.id)} className="p-2 text-zinc-400 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUESTIONS */}
          {activeTab === 'questions' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Question Papers</h3>
                <button onClick={() => setShowQuestionForm(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>

              {showQuestionForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">Upload Question</h4>
                      <button onClick={() => setShowQuestionForm(false)} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={handleQuestionUpload} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Type</label>
                          <select value={newQuestion.type} onChange={e => setNewQuestion({ ...newQuestion, type: e.target.value as any })} className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                            <option value="HSC">HSC</option><option value="SSC">SSC</option><option value="Admission">Admission</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Year</label>
                          <input type="text" value={newQuestion.year} onChange={e => setNewQuestion({ ...newQuestion, year: e.target.value })} placeholder="e.g. 2024" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                      </div>

                      {newQuestion.type === 'Admission' ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Category</label>
                            <select value={newQuestion.category} onChange={e => setNewQuestion({ ...newQuestion, category: e.target.value as any })} className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                              <option value="Engineering">Engineering</option><option value="Medical">Medical</option><option value="University">University</option><option value="GST">GST</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">University</label>
                            <input type="text" value={newQuestion.university} onChange={e => setNewQuestion({ ...newQuestion, university: e.target.value })} placeholder="e.g. BUET" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Board</label>
                            <select value={newQuestion.board} onChange={e => setNewQuestion({ ...newQuestion, board: e.target.value })} className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                              <option value="">Select Board</option>
                              {['Dhaka','Rajshahi','Mymensingh','Chittagong','Cumilla','Jashore','Barishal','Sylhet','Dinajpur'].map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Group</label>
                            <select value={newQuestion.group} onChange={e => setNewQuestion({ ...newQuestion, group: e.target.value })} className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                              <option value="">Select Group</option><option value="Science">Science</option><option value="Commerce">Commerce</option><option value="Arts">Arts</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Subject</label>
                          <input type="text" value={newQuestion.subject} onChange={e => setNewQuestion({ ...newQuestion, subject: e.target.value })} placeholder="e.g. Bangla" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">MCQ / CQ</label>
                          <select value={newQuestion.questionType} onChange={e => setNewQuestion({ ...newQuestion, questionType: e.target.value as any })} className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                            <option value="MCQ">MCQ</option><option value="CQ">CQ</option>
                          </select>
                        </div>
                      </div>

                      {/* ── Multiple Image Upload ── */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Question Images ({(newQuestion.imageUrls || []).length} uploaded)
                          </label>
                          <span className="text-xs text-zinc-400">Add as many pages as needed</span>
                        </div>

                        {/* Uploaded images preview */}
                        {(newQuestion.imageUrls || []).length > 0 && (
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            {(newQuestion.imageUrls || []).map((url, i) => (
                              <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
                                <img src={url} alt={`Page ${i + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button type="button" onClick={() => removeQuestionImage(i)} className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  Page {i + 1}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add more images button */}
                        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-emerald-500 transition-colors cursor-pointer">
                          {uploadingImageIndex !== null
                            ? <><Loader2 className="w-5 h-5 animate-spin text-emerald-600" /><span className="text-sm text-zinc-500">Uploading page {uploadingImageIndex + 1}...</span></>
                            : <><Upload className="w-5 h-5 text-zinc-400" /><span className="text-sm text-zinc-500">+ Add image/page</span></>
                          }
                          <input type="file" className="hidden" onChange={handleAddQuestionImage} accept="image/*" disabled={uploadingImageIndex !== null} />
                        </label>
                        <p className="text-xs text-zinc-400 text-center">Upload multiple images if the question paper has multiple pages</p>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowQuestionForm(false)} className="flex-1 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
                        <button type="submit" disabled={isUploading || uploadingImageIndex !== null || (newQuestion.imageUrls || []).length === 0 || !newQuestion.subject}
                          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50">
                          {isUploading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Upload Question (${(newQuestion.imageUrls || []).length} image${(newQuestion.imageUrls || []).length !== 1 ? 's' : ''})`}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {questions.length === 0 && <p className="text-center py-12 text-zinc-400">No questions uploaded yet.</p>}
              <div className="grid grid-cols-1 gap-4">
                {questions.map((q) => (
                  <div key={q.id} className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center relative">
                        <FileText className="w-6 h-6 text-emerald-600" />
                        {(q.imageUrls?.length || 0) > 1 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {q.imageUrls?.length}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-white">{q.subject} - {q.year}</h4>
                        <p className="text-xs text-zinc-500">{q.type} • {q.university || q.board} • {q.questionType} • {q.imageUrls?.length || 1} page(s)</p>
                      </div>
                    </div>
                    <button onClick={() => deleteQuestion(q.id)} className="p-2 text-zinc-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SITE CONTENT */}
          {activeTab === 'content' && (
            <div className="space-y-12">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Privacy Policy</h3>
                <textarea className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl min-h-[200px] outline-none focus:ring-2 focus:ring-emerald-500 text-sm" value={siteContent.privacy_policy?.text || ''} onChange={(e) => setSiteContent({ ...siteContent, privacy_policy: { text: e.target.value } })} placeholder="Write privacy policy here..." />
                <button onClick={() => updateSiteContent('privacy_policy', siteContent.privacy_policy)} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700">Save Privacy Policy</button>
              </div>
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email</label>
                    <input type="text" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none" value={siteContent.contact?.email || ''} onChange={(e) => setSiteContent({ ...siteContent, contact: { ...siteContent.contact, email: e.target.value } })} placeholder="contact@sarothi.com" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Phone</label>
                    <input type="text" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none" value={siteContent.contact?.phone || ''} onChange={(e) => setSiteContent({ ...siteContent, contact: { ...siteContent.contact, phone: e.target.value } })} placeholder="+880XXXXXXXXXX" />
                  </div>
                </div>
                <textarea className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl min-h-[100px] outline-none text-sm" value={siteContent.contact?.text || ''} onChange={(e) => setSiteContent({ ...siteContent, contact: { ...siteContent.contact, text: e.target.value } })} placeholder="Contact description..." />
                <button onClick={() => updateSiteContent('contact', siteContent.contact)} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700">Save Contact Info</button>
              </div>
            </div>
          )}

          {/* USERS */}
          {activeTab === 'users' && (
            <div className="text-center py-20 text-zinc-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>User management coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Update Modal */}
      {showUpdateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">{editingUpdate ? 'Edit Update' : 'New Update'}</h4>
              <button onClick={closeUpdateForm} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5 text-zinc-500" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Title *</label>
                <input type="text" value={updateTitle} onChange={e => setUpdateTitle(e.target.value)} placeholder="e.g. BUET Admission 2025 Notice" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Content *</label>
                <textarea value={updateContent} onChange={e => setUpdateContent(e.target.value)} placeholder="Write the full update details..." rows={8} className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div className="flex gap-4 pt-2">
                <button onClick={closeUpdateForm} className="flex-1 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">Cancel</button>
                <button onClick={handleSaveUpdate} disabled={isSavingUpdate} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSavingUpdate ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : editingUpdate ? '✏️ Save Changes' : '📢 Publish Update'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
