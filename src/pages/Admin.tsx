import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';
import { Update, SlideshowImage, Question } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Plus, Trash2, Edit, Upload, Image as ImageIcon, FileText, Loader2, Settings, Users, Bell, X, Layers } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { motion } from 'framer-motion';

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

const uploadImage = async (file: File, path: string): Promise<string> => {
  try { return await uploadToCloudinary(file); }
  catch (err) {
    const storageRef = ref(storage, `${path}/${Date.now()}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }
};

// ── Subject lists ──
const SUBJECTS: Record<string, string[]> = {
  Science: [
    'Bangla 1st Paper', 'Bangla 2nd Paper',
    'English 1st Paper', 'English 2nd Paper',
    'Physics 1st Paper', 'Physics 2nd Paper',
    'Chemistry 1st Paper', 'Chemistry 2nd Paper',
    'Biology 1st Paper', 'Biology 2nd Paper',
    'Higher Mathematics 1st Paper', 'Higher Mathematics 2nd Paper',
    'ICT',
  ],
  Commerce: [
    'Bangla 1st Paper', 'Bangla 2nd Paper',
    'English 1st Paper', 'English 2nd Paper',
    'ICT',
    'Accounting 1st Paper', 'Accounting 2nd Paper',
    'Economics 1st Paper', 'Economics 2nd Paper',
    'Business Organization & Management 1st Paper', 'Business Organization & Management 2nd Paper',
    'Finance, Banking & Insurance 1st Paper', 'Finance, Banking & Insurance 2nd Paper',
    'Production Management & Marketing 1st Paper', 'Production Management & Marketing 2nd Paper',
    'Statistics',
  ],
  Arts: [
    'Bangla 1st Paper', 'Bangla 2nd Paper',
    'English 1st Paper', 'English 2nd Paper',
    'ICT',
    'Economics 1st Paper', 'Economics 2nd Paper',
    'History 1st Paper', 'History 2nd Paper',
    'Islamic History & Culture 1st Paper', 'Islamic History & Culture 2nd Paper',
    'Civic & Good Governance 1st Paper', 'Civic & Good Governance 2nd Paper',
  ],
};

const BOARDS = ['Dhaka', 'Rajshahi', 'Mymensingh', 'Chittagong', 'Cumilla', 'Jashore', 'Barishal', 'Sylhet', 'Dinajpur'];
const YEARS = Array.from({ length: 9 }, (_, i) => String(2026 - i));

// ══════════════════════════════════════════
// USER MANAGEMENT COMPONENT
// ══════════════════════════════════════════
const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = users.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Registered Users</h3>
        <span className="text-sm font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
          {users.length} total
        </span>
      </div>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search by name or email..."
        className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
      />
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>{search ? 'No users found.' : 'No users registered yet.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(user => (
            <div key={user.id}
              className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-400 transition-all">
              <div className="flex-shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} className="w-10 h-10 rounded-full object-cover border-2 border-zinc-200 dark:border-zinc-700" referrerPolicy="no-referrer" alt={user.name} />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center font-bold text-emerald-600 text-sm">
                    {(user.name || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-900 dark:text-white text-sm truncate">{user.name || 'No name set'}</p>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 flex-wrap">
                {user.group && <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">{user.group}</span>}
                {user.hscBoard && <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">{user.hscBoard}</span>}
                {user.hscYear && <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">HSC {user.hscYear}</span>}
                {user.mobile && <span className="text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">📱 {user.mobile}</span>}
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${user.role === 'admin' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                {user.role === 'admin' ? '⚙️ Admin' : '👤 User'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════
// DYNAMIC MORE FEATURES COMPONENT
// ══════════════════════════════════════════
const FeaturesManagement: React.FC = () => {
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFeature, setEditingFeature] = useState<any | null>(null);

  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fImageUrl, setFImageUrl] = useState('');
  const [fLinkLabel, setFLinkLabel] = useState('');
  const [fLinkPath, setFLinkPath] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'features'), orderBy('createdAt', 'asc')),
      snap => {
        setFeatures(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const openNew = () => {
    setEditingFeature(null);
    setFTitle(''); setFDesc(''); setFImageUrl(''); setFLinkLabel(''); setFLinkPath('');
    setShowForm(true);
  };

  const openEdit = (f: any) => {
    setEditingFeature(f);
    setFTitle(f.title || '');
    setFDesc(f.desc || '');
    setFImageUrl(f.imageUrl || '');
    setFLinkLabel(f.linkLabel || '');
    setFLinkPath(f.linkPath || '');
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingFeature(null);
    setFTitle(''); setFDesc(''); setFImageUrl(''); setFLinkLabel(''); setFLinkPath('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file, 'features');
      setFImageUrl(url);
    } catch { alert('Image upload failed!'); }
    setIsUploading(false);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!fTitle.trim()) { alert('Title required!'); return; }
    if (!fDesc.trim()) { alert('Description required!'); return; }
    if (!fImageUrl) { alert('Please upload an image!'); return; }
    setIsSaving(true);
    try {
      const data: any = {
        title: fTitle.trim(),
        desc: fDesc.trim(),
        imageUrl: fImageUrl,
        linkLabel: fLinkLabel.trim(),
        linkPath: fLinkPath.trim(),
      };
      if (editingFeature) {
        await updateDoc(doc(db, 'features', editingFeature.id), data);
        alert('✅ Feature updated!');
      } else {
        data.createdAt = serverTimestamp();
        await addDoc(collection(db, 'features'), data);
        alert('✅ Feature added!');
      }
      closeForm();
    } catch (err) { console.error(err); alert('Save failed!'); }
    setIsSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white">MORE Features</h3>
          <p className="text-xs text-zinc-400 mt-0.5">Home page এর "MORE" section এ দেখাবে</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/20">
          <Plus className="w-4 h-4" /> Add Feature
        </button>
      </div>

      {/* Feature list */}
      {features.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <Layers className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="font-semibold text-base">কোনো feature নেই।</p>
          <p className="text-sm mt-1 opacity-70">উপরের "Add Feature" বাটনে click করো।</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {features.map((f, idx) => (
            <div key={f.id}
              className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all group">
              {/* Image preview */}
              <div className="w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-200 dark:bg-zinc-800">
                {f.imageUrl
                  ? <img src={f.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={f.title} />
                  : <div className="w-full h-full flex items-center justify-center text-zinc-400"><ImageIcon className="w-5 h-5" /></div>
                }
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">#{idx + 1}</span>
                  <h4 className="font-bold text-zinc-900 dark:text-white text-sm truncate">{f.title}</h4>
                </div>
                <p className="text-xs text-zinc-500 line-clamp-1">{f.desc}</p>
                {f.linkLabel && (
                  <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">🔗 {f.linkLabel} → {f.linkPath}</p>
                )}
              </div>
              {/* Actions */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => openEdit(f)} className="p-2 text-zinc-400 hover:text-emerald-600 transition-colors rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => { if (confirm('এই feature delete করবে?')) deleteDoc(doc(db, 'features', f.id)); }}
                  className="p-2 text-zinc-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xl font-black text-zinc-900 dark:text-white">
                {editingFeature ? '✏️ Edit Feature' : '✨ New Feature'}
              </h4>
              <button onClick={closeForm} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">Title *</label>
                <input
                  type="text"
                  value={fTitle}
                  onChange={e => setFTitle(e.target.value)}
                  placeholder="e.g. Study Materials"
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5">Description *</label>
                <textarea
                  rows={4}
                  value={fDesc}
                  onChange={e => setFDesc(e.target.value)}
                  placeholder="এই feature সম্পর্কে বিস্তারিত লেখো..."
                  className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Image *</label>
                {fImageUrl && (
                  <div className="mb-3 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 max-w-xs aspect-video">
                    <img src={fImageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="Preview" />
                  </div>
                )}
                <label className={`inline-flex items-center gap-2 px-4 py-2.5 text-white text-sm font-bold rounded-xl cursor-pointer transition-colors ${isUploading ? 'bg-zinc-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                  {isUploading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                    : <><Upload className="w-4 h-4" /> {fImageUrl ? 'Change Image' : 'Upload Image'}</>
                  }
                  <input type="file" className="hidden" accept="image/*" disabled={isUploading} onChange={handleImageUpload} />
                </label>
              </div>

              {/* Optional link */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Link (Optional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1.5">Link Label</label>
                    <input
                      type="text"
                      value={fLinkLabel}
                      onChange={e => setFLinkLabel(e.target.value)}
                      placeholder="e.g. Study Page"
                      className="w-full p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1.5">Path</label>
                    <input
                      type="text"
                      value={fLinkPath}
                      onChange={e => setFLinkPath(e.target.value)}
                      placeholder="e.g. /study"
                      className="w-full p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button onClick={closeForm}
                  className="flex-1 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={isSaving || isUploading}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  {isSaving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    : editingFeature ? '✏️ Update' : '✨ Add Feature'
                  }
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// ══════════════════════════════════════════
// MAIN ADMIN COMPONENT
// ══════════════════════════════════════════
export const Admin: React.FC = () => {
  const { isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'slideshow' | 'updates' | 'questions' | 'content' | 'features' | 'users'>('slideshow');
  const [slides, setSlides] = useState<SlideshowImage[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [siteContent, setSiteContent] = useState<any>({});
  const [isUploading, setIsUploading] = useState(false);

  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [qType, setQType] = useState<'HSC' | 'SSC' | 'Admission'>('HSC');
  const [qYear, setQYear] = useState('2026');
  const [qBoard, setQBoard] = useState('Dhaka');
  const [qGroup, setQGroup] = useState<'Science' | 'Commerce' | 'Arts'>('Science');
  const [qSubject, setQSubject] = useState('');
  const [qQuestionType, setQQuestionType] = useState<'MCQ' | 'CQ'>('MCQ');
  const [qCategory, setQCategory] = useState('Engineering');
  const [qUniversity, setQUniversity] = useState('');
  const [qImageUrls, setQImageUrls] = useState<string[]>([]);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<Update | null>(null);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');
  const [isSavingUpdate, setIsSavingUpdate] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    const unS = onSnapshot(query(collection(db, 'slideshow'), orderBy('order', 'asc')), s => setSlides(s.docs.map(d => ({ id: d.id, ...d.data() } as SlideshowImage))));
    const unU = onSnapshot(query(collection(db, 'updates'), orderBy('createdAt', 'desc')), s => setUpdates(s.docs.map(d => ({ id: d.id, ...d.data() } as Update))));
    const unQ = onSnapshot(query(collection(db, 'questions'), orderBy('uploadedAt', 'desc')), s => setQuestions(s.docs.map(d => ({ id: d.id, ...d.data() } as Question))));
    const unC = onSnapshot(collection(db, 'site_content'), s => { const c: any = {}; s.docs.forEach(d => { c[d.id] = d.data(); }); setSiteContent(c); });
    return () => { unS(); unU(); unQ(); unC(); };
  }, [isAdmin]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  if (!isAdmin) return <div className="text-center py-20 text-red-500 font-bold">Access Denied.</div>;

  const handleSlideUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (slides.length >= 6) { alert('Max 6 slides!'); return; }
    setIsUploading(true);
    try { const url = await uploadImage(file, 'slideshow'); await addDoc(collection(db, 'slideshow'), { url, order: slides.length + 1 }); }
    catch { alert('Upload failed!'); }
    setIsUploading(false);
  };

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const idx = qImageUrls.length;
    setUploadingIdx(idx);
    try {
      const url = await uploadImage(file, 'questions');
      setQImageUrls(prev => [...prev, url]);
    } catch { alert('Image upload failed!'); }
    setUploadingIdx(null);
    e.target.value = '';
  };

  const removeImage = (i: number) => setQImageUrls(prev => prev.filter((_, idx) => idx !== i));

  const resetQuestionForm = () => {
    setQType('HSC'); setQYear('2026'); setQBoard('Dhaka');
    setQGroup('Science'); setQSubject(''); setQQuestionType('MCQ');
    setQCategory('Engineering'); setQUniversity(''); setQImageUrls([]);
    setShowQuestionForm(false);
  };

  const handleQuestionUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qImageUrls.length === 0) { alert('Please upload at least one image!'); return; }
    if (!qSubject) { alert('Please select a subject!'); return; }
    setIsUploading(true);
    try {
      await addDoc(collection(db, 'questions'), {
        type: qType, year: qYear,
        board: qType !== 'Admission' ? qBoard : null,
        group: qType !== 'Admission' ? qGroup : null,
        subject: qSubject, questionType: qQuestionType,
        category: qType === 'Admission' ? qCategory : null,
        university: qType === 'Admission' ? qUniversity : null,
        imageUrls: qImageUrls, imageUrl: qImageUrls[0], downloadUrl: qImageUrls[0],
        uploadedAt: serverTimestamp(),
      });
      alert(`✅ Question uploaded! (${qImageUrls.length} image${qImageUrls.length > 1 ? 's' : ''})`);
      resetQuestionForm();
    } catch (err) { console.error(err); alert('Upload failed!'); }
    setIsUploading(false);
  };

  const openNew = () => { setEditingUpdate(null); setUpdateTitle(''); setUpdateContent(''); setShowUpdateForm(true); };
  const openEdit = (u: Update) => { setEditingUpdate(u); setUpdateTitle(u.title); setUpdateContent(u.content || ''); setShowUpdateForm(true); };
  const closeUpdate = () => { setShowUpdateForm(false); setEditingUpdate(null); };

  const saveUpdate = async () => {
    if (!updateTitle.trim()) { alert('Title required!'); return; }
    if (!updateContent.trim()) { alert('Content required!'); return; }
    setIsSavingUpdate(true);
    try {
      if (editingUpdate) await updateDoc(doc(db, 'updates', editingUpdate.id), { title: updateTitle.trim(), content: updateContent.trim() });
      else await addDoc(collection(db, 'updates'), { title: updateTitle.trim(), content: updateContent.trim(), createdAt: serverTimestamp() });
      closeUpdate();
    } catch { alert('Failed!'); }
    setIsSavingUpdate(false);
  };

  const currentSubjects = SUBJECTS[qGroup] || [];

  const TABS = [
    { id: 'slideshow', name: 'Slideshow', icon: ImageIcon },
    { id: 'updates', name: 'Updates', icon: Bell },
    { id: 'questions', name: 'Questions', icon: FileText },
    { id: 'content', name: 'Site Content', icon: Settings },
    { id: 'features', name: 'MORE Features', icon: Layers },
    { id: 'users', name: 'Users', icon: Users },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">

        {/* Sidebar */}
        <div className="w-full md:w-64 space-y-2">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-6 tracking-tighter">Admin Panel</h2>
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}>
              <tab.icon className="w-5 h-5" />
              <span className="flex-1 text-left">{tab.name}</span>
              {tab.id === 'features' && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-600'}`}>NEW</span>
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl min-h-[400px]">

          {/* ── SLIDESHOW ── */}
          {activeTab === 'slideshow' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Slideshow ({slides.length}/6)</h3>
                <label className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg cursor-pointer ${slides.length >= 6 || isUploading ? 'bg-zinc-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isUploading ? 'Uploading...' : 'Add Slide'}
                  <input type="file" className="hidden" onChange={handleSlideUpload} accept="image/*" disabled={slides.length >= 6 || isUploading} />
                </label>
              </div>
              {slides.length === 0 && <div className="text-center py-16 text-zinc-400"><ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No slides yet.</p></div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {slides.map(slide => (
                  <div key={slide.id} className="relative group rounded-2xl overflow-hidden aspect-video bg-zinc-100 dark:bg-zinc-800">
                    <img src={slide.url} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt="slide" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => { if (confirm('Delete?')) deleteDoc(doc(db, 'slideshow', slide.id)); }} className="p-2 bg-red-600 text-white rounded-lg"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── UPDATES ── */}
          {activeTab === 'updates' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Updates</h3>
                <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg"><Plus className="w-4 h-4" /> New Update</button>
              </div>
              {updates.length === 0 && <div className="text-center py-16 text-zinc-400"><Bell className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No updates yet.</p></div>}
              <div className="space-y-4">
                {updates.map(u => (
                  <div key={u.id} className="p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-start">
                    <div className="flex-1 mr-4">
                      <h4 className="font-bold text-zinc-900 dark:text-white">{u.title}</h4>
                      <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{u.content}</p>
                      <p className="text-xs text-zinc-400 mt-2">{u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="p-2 text-zinc-400 hover:text-emerald-600"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => { if (confirm('Delete?')) deleteDoc(doc(db, 'updates', u.id)); }} className="p-2 text-zinc-400 hover:text-red-600"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── QUESTIONS ── */}
          {activeTab === 'questions' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Question Papers</h3>
                <button onClick={() => setShowQuestionForm(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg"><Plus className="w-4 h-4" /> Add Question</button>
              </div>

              {showQuestionForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-2xl font-black text-zinc-900 dark:text-white">Upload Question</h4>
                      <button onClick={resetQuestionForm} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={handleQuestionUpload} className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        {(['HSC', 'SSC', 'Admission'] as const).map(t => (
                          <button type="button" key={t} onClick={() => { setQType(t); setQSubject(''); }}
                            className={`py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${qType === t ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-emerald-400'}`}>{t}</button>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Year</label>
                        <select value={qYear} onChange={e => setQYear(e.target.value)} className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      {qType !== 'Admission' ? (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Board</label>
                            <select value={qBoard} onChange={e => setQBoard(e.target.value)} className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                              {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Group</label>
                            <div className="grid grid-cols-3 gap-3">
                              {(['Science', 'Commerce', 'Arts'] as const).map(g => (
                                <button type="button" key={g} onClick={() => { setQGroup(g); setQSubject(''); }}
                                  className={`py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${qGroup === g ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-emerald-400'}`}>{g}</button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Subject ({currentSubjects.length})</label>
                            <select value={qSubject} onChange={e => setQSubject(e.target.value)} className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                              <option value="">-- Select Subject --</option>
                              {currentSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Category</label>
                              <select value={qCategory} onChange={e => setQCategory(e.target.value)} className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500">
                                <option>Engineering</option><option>Medical</option><option>University</option><option>GST</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Institution</label>
                              <input type="text" value={qUniversity} onChange={e => setQUniversity(e.target.value)} placeholder="e.g. BUET" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Subject Name</label>
                            <input type="text" value={qSubject} onChange={e => setQSubject(e.target.value)} placeholder="e.g. Admission Test" className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                          </div>
                        </>
                      )}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Question Type</label>
                        <div className="grid grid-cols-2 gap-3">
                          {(['MCQ', 'CQ'] as const).map(t => (
                            <button type="button" key={t} onClick={() => setQQuestionType(t)}
                              className={`py-2.5 rounded-xl font-bold text-sm border-2 transition-all ${qQuestionType === t ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-emerald-400'}`}>{t}</button>
                          ))}
                        </div>
                      </div>
                      {qSubject && (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/20 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                          📋 {qType} {qYear} • {qType !== 'Admission' ? `${qBoard} Board • ${qGroup} • ` : `${qCategory} • `}{qSubject} • {qQuestionType}
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Images ({qImageUrls.length})</label>
                          <span className="text-xs text-zinc-400">Upload all pages</span>
                        </div>
                        {qImageUrls.length > 0 && (
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            {qImageUrls.map((url, i) => (
                              <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800">
                                <img src={url} className="w-full h-full object-cover" referrerPolicy="no-referrer" alt={`Page ${i + 1}`} />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button type="button" onClick={() => removeImage(i)} className="p-1.5 bg-red-600 text-white rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                                <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Page {i + 1}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-emerald-500 transition-colors cursor-pointer">
                          {uploadingIdx !== null
                            ? <><Loader2 className="w-5 h-5 animate-spin text-emerald-600" /><span className="text-sm text-zinc-500">Uploading...</span></>
                            : <><Upload className="w-5 h-5 text-zinc-400" /><span className="text-sm text-zinc-500">+ Add image / page</span></>}
                          <input type="file" className="hidden" onChange={handleAddImage} accept="image/*" disabled={uploadingIdx !== null} />
                        </label>
                      </div>
                      <div className="flex gap-4 pt-2">
                        <button type="button" onClick={resetQuestionForm} className="flex-1 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">Cancel</button>
                        <button type="submit" disabled={isUploading || uploadingIdx !== null || qImageUrls.length === 0 || !qSubject}
                          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50">
                          {isUploading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `✅ Upload (${qImageUrls.length})`}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}

              {questions.length === 0 && <p className="text-center py-12 text-zinc-400">No questions uploaded yet.</p>}
              <div className="grid grid-cols-1 gap-3">
                {questions.map(q => (
                  <div key={q.id} className="p-5 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex justify-between items-center group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center relative">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        {(q.imageUrls?.length || 0) > 1 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{q.imageUrls?.length}</span>}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-white text-sm">{q.subject} — {q.year}</h4>
                        <p className="text-xs text-zinc-500">{q.type} • {q.board || q.university} • {q.group} • {q.questionType} • {q.imageUrls?.length || 1} page(s)</p>
                      </div>
                    </div>
                    <button onClick={() => { if (confirm('Delete?')) deleteDoc(doc(db, 'questions', q.id)); }} className="p-2 text-zinc-300 hover:text-red-600 opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SITE CONTENT ── */}
          {activeTab === 'content' && (
            <div className="space-y-10">
              {/* Feature 1 */}
              <div className="space-y-4 p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">📘 Feature 1 — HSC/SSC Section</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Title</label>
                    <input type="text" className="w-full p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      value={siteContent.feature_1?.title || ''} onChange={e => setSiteContent({ ...siteContent, feature_1: { ...siteContent.feature_1, title: e.target.value } })}
                      placeholder="First feature: Download and see HSC/SSC previous year question" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Description</label>
                    <textarea rows={4} className="w-full p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      value={siteContent.feature_1?.desc || ''} onChange={e => setSiteContent({ ...siteContent, feature_1: { ...siteContent.feature_1, desc: e.target.value } })}
                      placeholder="Description... (include 'Board Page' text for auto-link)" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Image</label>
                    <div className="flex items-center gap-4">
                      {siteContent.feature_1?.imageUrl && <img src={siteContent.feature_1.imageUrl} className="w-24 h-16 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700" referrerPolicy="no-referrer" alt="Feature 1" />}
                      <label className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg cursor-pointer transition-colors ${isUploading ? 'bg-zinc-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                        {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload Image</>}
                        <input type="file" className="hidden" accept="image/*" disabled={isUploading} onChange={async e => {
                          const file = e.target.files?.[0]; if (!file) return; setIsUploading(true);
                          try { const url = await uploadImage(file, 'feature_images'); setSiteContent((prev: any) => ({ ...prev, feature_1: { ...prev.feature_1, imageUrl: url } })); } catch { alert('Upload failed!'); }
                          setIsUploading(false); e.target.value = '';
                        }} />
                      </label>
                    </div>
                  </div>
                </div>
                <button onClick={() => setDoc(doc(db, 'site_content', 'feature_1'), siteContent.feature_1 || {}).then(() => alert('✅ Feature 1 saved!'))}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700">💾 Save Feature 1</button>
              </div>

              {/* Feature 2 */}
              <div className="space-y-4 p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">🎓 Feature 2 — Admission Section</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Title</label>
                    <input type="text" className="w-full p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      value={siteContent.feature_2?.title || ''} onChange={e => setSiteContent({ ...siteContent, feature_2: { ...siteContent.feature_2, title: e.target.value } })}
                      placeholder="Second feature: Download and see Admission previous year question" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Description</label>
                    <textarea rows={4} className="w-full p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      value={siteContent.feature_2?.desc || ''} onChange={e => setSiteContent({ ...siteContent, feature_2: { ...siteContent.feature_2, desc: e.target.value } })}
                      placeholder="Description... (include 'Admission Page' text for auto-link)" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Image</label>
                    <div className="flex items-center gap-4">
                      {siteContent.feature_2?.imageUrl && <img src={siteContent.feature_2.imageUrl} className="w-24 h-16 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700" referrerPolicy="no-referrer" alt="Feature 2" />}
                      <label className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-lg cursor-pointer transition-colors ${isUploading ? 'bg-zinc-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                        {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4" /> Upload Image</>}
                        <input type="file" className="hidden" accept="image/*" disabled={isUploading} onChange={async e => {
                          const file = e.target.files?.[0]; if (!file) return; setIsUploading(true);
                          try { const url = await uploadImage(file, 'feature_images'); setSiteContent((prev: any) => ({ ...prev, feature_2: { ...prev.feature_2, imageUrl: url } })); } catch { alert('Upload failed!'); }
                          setIsUploading(false); e.target.value = '';
                        }} />
                      </label>
                    </div>
                  </div>
                </div>
                <button onClick={() => setDoc(doc(db, 'site_content', 'feature_2'), siteContent.feature_2 || {}).then(() => alert('✅ Feature 2 saved!'))}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700">💾 Save Feature 2</button>
              </div>

              {/* Privacy Policy */}
              <div className="space-y-4 p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">📋 Privacy Policy</h3>
                <textarea className="w-full p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl min-h-[160px] outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  value={siteContent.privacy_policy?.text || ''} onChange={e => setSiteContent({ ...siteContent, privacy_policy: { text: e.target.value } })} placeholder="Write privacy policy here..." />
                <button onClick={() => setDoc(doc(db, 'site_content', 'privacy_policy'), siteContent.privacy_policy || {}).then(() => alert('✅ Saved!'))}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700">💾 Save</button>
              </div>

              {/* Contact */}
              <div className="space-y-4 p-6 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">📞 Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Email</label>
                    <input type="text" className="w-full p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      value={siteContent.contact?.email || ''} onChange={e => setSiteContent({ ...siteContent, contact: { ...siteContent.contact, email: e.target.value } })} placeholder="contact@sarothi.com" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Phone</label>
                    <input type="text" className="w-full p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      value={siteContent.contact?.phone || ''} onChange={e => setSiteContent({ ...siteContent, contact: { ...siteContent.contact, phone: e.target.value } })} placeholder="+880XXXXXXXXXX" />
                  </div>
                </div>
                <textarea className="w-full p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl min-h-[80px] outline-none text-sm"
                  value={siteContent.contact?.text || ''} onChange={e => setSiteContent({ ...siteContent, contact: { ...siteContent.contact, text: e.target.value } })} placeholder="Contact description..." />
                <button onClick={() => setDoc(doc(db, 'site_content', 'contact'), siteContent.contact || {}).then(() => alert('✅ Saved!'))}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700">💾 Save Contact</button>
              </div>
            </div>
          )}

          {/* ── MORE FEATURES TAB ── */}
          {activeTab === 'features' && <FeaturesManagement />}

          {/* ── USERS TAB ── */}
          {activeTab === 'users' && <UserManagement />}

        </div>
      </div>

      {/* Update Modal */}
      {showUpdateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-2xl font-black text-zinc-900 dark:text-white">{editingUpdate ? 'Edit Update' : 'New Update'}</h4>
              <button onClick={closeUpdate} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" value={updateTitle} onChange={e => setUpdateTitle(e.target.value)} placeholder="Title *"
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
              <textarea value={updateContent} onChange={e => setUpdateContent(e.target.value)} placeholder="Content *" rows={8}
                className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              <div className="flex gap-4">
                <button onClick={closeUpdate} className="flex-1 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">Cancel</button>
                <button onClick={saveUpdate} disabled={isSavingUpdate}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSavingUpdate ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : editingUpdate ? '✏️ Save' : '📢 Publish'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
