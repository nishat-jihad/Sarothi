import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { Update, SlideshowImage, Question } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Plus, Trash2, Edit, Upload, Image as ImageIcon, FileText, Loader2, Settings, Users, Bell } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';

export const Admin: React.FC = () => {
  const { isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'slideshow' | 'updates' | 'questions' | 'users' | 'content'>('slideshow');
  const [slides, setSlides] = useState<SlideshowImage[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [siteContent, setSiteContent] = useState<any>({});
  const [isUploading, setIsUploading] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    type: 'HSC',
    year: new Date().getFullYear().toString(),
    questionType: 'MCQ',
    category: 'Engineering'
  });

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
      alert('Content updated');
    } catch (err) {
      console.error(err);
      alert('Update failed');
    }
  };

  const handleQuestionUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.imageUrl || !newQuestion.subject) return;
    setIsUploading(true);
    try {
      await addDoc(collection(db, 'questions'), {
        ...newQuestion,
        uploadedAt: serverTimestamp(),
      });
      setShowQuestionForm(false);
      setNewQuestion({ type: 'HSC', year: new Date().getFullYear().toString(), questionType: 'MCQ' });
    } catch (err) { console.error(err); alert('Upload failed'); }
    setIsUploading(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `questions/${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setNewQuestion(prev => ({ ...prev, imageUrl: url, downloadUrl: url }));
    } catch (err) { console.error(err); alert('File upload failed'); }
    setIsUploading(false);
  };

  const deleteQuestion = async (id: string) => {
    if (confirm('Delete this question?')) await deleteDoc(doc(db, 'questions', id));
  };

  const handleSlideUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `slideshow/${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, 'slideshow'), { url, order: slides.length + 1 });
    } catch (err) { console.error(err); alert('Upload failed'); }
    setIsUploading(false);
  };

  const deleteSlide = async (id: string) => {
    if (confirm('Delete this slide?')) await deleteDoc(doc(db, 'slideshow', id));
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
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl">
          {activeTab === 'slideshow' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Manage Slideshow (Max 6)</h3>
                <label className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg cursor-pointer transition-colors">
                  <Plus className="w-4 h-4" /> Add Slide
                  <input type="file" className="hidden" onChange={handleSlideUpload} accept="image/*" disabled={slides.length >= 6 || isUploading} />
                </label>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {slides.map((slide) => (
                  <div key={slide.id} className="relative group rounded-2xl overflow-hidden aspect-video bg-zinc-100 dark:bg-zinc-800">
                    <img src={slide.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <button onClick={() => deleteSlide(slide.id)} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'updates' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Admission Updates</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors">
                  <Plus className="w-4 h-4" /> New Update
                </button>
              </div>
              <div className="space-y-4">
                {updates.map((update) => (
                  <div key={update.id} className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white">{update.title}</h4>
                      <p className="text-xs text-zinc-500 mt-1">{new Date(update.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-zinc-400 hover:text-emerald-600 transition-colors"><Edit className="w-5 h-5" /></button>
                      <button className="p-2 text-zinc-400 hover:text-red-600 transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Question Papers</h3>
                <button 
                  onClick={() => setShowQuestionForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>

              {showQuestionForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800">
                    <h4 className="text-2xl font-black text-zinc-900 dark:text-white mb-6 tracking-tighter">Upload Question</h4>
                    <form onSubmit={handleQuestionUpload} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Type</label>
                          <select 
                            value={newQuestion.type} 
                            onChange={e => setNewQuestion({...newQuestion, type: e.target.value as any})}
                            className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="HSC">HSC</option>
                            <option value="SSC">SSC</option>
                            <option value="Admission">Admission</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Year</label>
                          <input 
                            type="text" 
                            value={newQuestion.year}
                            onChange={e => setNewQuestion({...newQuestion, year: e.target.value})}
                            placeholder="e.g. 2024"
                            className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {newQuestion.type === 'Admission' ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Category</label>
                            <select 
                              value={newQuestion.category} 
                              onChange={e => setNewQuestion({...newQuestion, category: e.target.value as any})}
                              className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="Engineering">Engineering</option>
                              <option value="Medical">Medical</option>
                              <option value="University">University</option>
                              <option value="GST">GST</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">University</label>
                            <input 
                              type="text" 
                              value={newQuestion.university}
                              onChange={e => setNewQuestion({...newQuestion, university: e.target.value})}
                              placeholder="e.g. BUET"
                              className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Board</label>
                            <input 
                              type="text" 
                              value={newQuestion.board}
                              onChange={e => setNewQuestion({...newQuestion, board: e.target.value})}
                              placeholder="e.g. Dhaka"
                              className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Group</label>
                            <select 
                              value={newQuestion.group} 
                              onChange={e => setNewQuestion({...newQuestion, group: e.target.value})}
                              className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">Select Group</option>
                              <option value="Science">Science</option>
                              <option value="Commerce">Commerce</option>
                              <option value="Arts">Arts</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Subject</label>
                          <input 
                            type="text" 
                            value={newQuestion.subject}
                            onChange={e => setNewQuestion({...newQuestion, subject: e.target.value})}
                            placeholder="e.g. Physics"
                            className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Paper/Type</label>
                          <select 
                            value={newQuestion.questionType} 
                            onChange={e => setNewQuestion({...newQuestion, questionType: e.target.value as any})}
                            className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="MCQ">MCQ</option>
                            <option value="CQ">CQ</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Question Image</label>
                        <div className="flex items-center gap-4">
                          <label className="flex-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-emerald-500 transition-colors cursor-pointer">
                            <Upload className="w-5 h-5 text-zinc-400" />
                            <span className="text-sm text-zinc-500">{newQuestion.imageUrl ? 'Image Selected' : 'Choose File'}</span>
                            <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*" />
                          </label>
                          {newQuestion.imageUrl && (
                            <img src={newQuestion.imageUrl} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button 
                          type="button" 
                          onClick={() => setShowQuestionForm(false)}
                          className="flex-1 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={isUploading || !newQuestion.imageUrl || !newQuestion.subject}
                          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          {isUploading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Upload Question'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {questions.map((q) => (
                  <div key={q.id} className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-white">{q.subject} - {q.year}</h4>
                        <p className="text-xs text-zinc-500">{q.type} • {q.university || q.board} • {q.questionType}</p>
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
          {activeTab === 'content' && (
            <div className="space-y-12">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Privacy Policy</h3>
                <textarea 
                  className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl min-h-[200px] outline-none focus:ring-2 focus:ring-emerald-500"
                  value={siteContent.privacy_policy?.text || ''}
                  onChange={(e) => setSiteContent({ ...siteContent, privacy_policy: { text: e.target.value } })}
                />
                <button 
                  onClick={() => updateSiteContent('privacy_policy', siteContent.privacy_policy)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
                >
                  Save Privacy Policy
                </button>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Email</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                      value={siteContent.contact?.email || ''}
                      onChange={(e) => setSiteContent({ ...siteContent, contact: { ...siteContent.contact, email: e.target.value } })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Phone</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                      value={siteContent.contact?.phone || ''}
                      onChange={(e) => setSiteContent({ ...siteContent, contact: { ...siteContent.contact, phone: e.target.value } })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Address</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm"
                    value={siteContent.contact?.address || ''}
                    onChange={(e) => setSiteContent({ ...siteContent, contact: { ...siteContent.contact, address: e.target.value } })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Contact Text</label>
                  <textarea 
                    className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl min-h-[100px] outline-none focus:ring-2 focus:ring-emerald-500"
                    value={siteContent.contact?.text || ''}
                    onChange={(e) => setSiteContent({ ...siteContent, contact: { ...siteContent.contact, text: e.target.value } })}
                  />
                </div>
                <button 
                  onClick={() => updateSiteContent('contact', siteContent.contact)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
                >
                  Save Contact Info
                </button>
              </div>
            </div>
          )}
          {activeTab === 'users' && <div className="text-center py-20 text-zinc-500">User management coming soon...</div>}
        </div>
      </div>
    </div>
  );
};
