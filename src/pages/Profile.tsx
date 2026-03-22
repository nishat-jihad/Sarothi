import React, { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth, storage } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { BOARDS, GROUPS } from '../constants';
import { UserProfile } from '../types';
import { Camera, Save, Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const Profile: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  if (!user) return <div className="text-center py-20">Please sign in to view profile.</div>;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...formData,
        uid: user.uid,
        email: user.email,
        role: profile?.role || 'user',
        displayName: formData.displayName || user.displayName || 'User',
        photoURL: formData.photoURL || user.photoURL || '',
      }, { merge: true });
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving profile');
    }
    setIsSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, photoURL: url }));
    } catch (err) {
      console.error(err);
      alert('Error uploading image');
    }
    setUploading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
        <div className="h-32 bg-emerald-600"></div>
        <div className="px-8 pb-8">
          <div className="relative -mt-16 mb-8 flex flex-col items-center">
            <div className="relative group">
              <img
                src={formData.photoURL || 'https://picsum.photos/seed/user/200/200'}
                alt="Profile"
                className="w-32 h-32 rounded-full border-4 border-white dark:border-zinc-900 object-cover shadow-lg"
                referrerPolicy="no-referrer"
              />
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera className="w-8 h-8 text-white" />
                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
              </label>
              {uploading && <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>}
            </div>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mt-4">{formData.displayName || 'Your Name'}</h3>
            <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold rounded-full uppercase tracking-widest mt-1">
              {profile?.role || 'User'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-2">Personal Information</h4>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.displayName || ''}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Mobile (+880)</label>
                <input
                  type="tel"
                  placeholder="+8801XXXXXXXXX"
                  value={formData.mobile || ''}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Gender</label>
                <select
                  value={formData.gender || 'None'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="None">None</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-emerald-600 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-2">Academic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">HSC Board</label>
                  <select
                    value={formData.hscBoard || ''}
                    onChange={(e) => setFormData({ ...formData, hscBoard: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Board</option>
                    {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">HSC Year</label>
                  <select
                    value={formData.hscYear || ''}
                    onChange={(e) => setFormData({ ...formData, hscYear: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: 21 }, (_, i) => 2024 + i).map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">SSC Board</label>
                  <select
                    value={formData.sscBoard || ''}
                    onChange={(e) => setFormData({ ...formData, sscBoard: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Board</option>
                    {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">SSC Year</label>
                  <select
                    value={formData.sscYear || ''}
                    onChange={(e) => setFormData({ ...formData, sscYear: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: 21 }, (_, i) => 2024 + i).map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-1">Group</label>
                <select
                  value={formData.group || ''}
                  onChange={(e) => setFormData({ ...formData, group: e.target.value as any })}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Group</option>
                  {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-12 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
