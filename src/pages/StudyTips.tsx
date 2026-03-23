import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { Lightbulb, MessageCircle, Loader2, X, Calendar, Plus, Trash2, Edit, Send, Reply, ThumbsUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommentSection } from '../components/CommentSection';

interface StudyTip {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  reactions?: Record<string, string[]>; // emoji -> [userIds]
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export const StudyTips: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [tips, setTips] = useState<StudyTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTip, setSelectedTip] = useState<StudyTip | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTip, setEditingTip] = useState<StudyTip | null>(null);
  const [tipTitle, setTipTitle] = useState('');
  const [tipContent, setTipContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeEmoji, setActiveEmoji] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'study_tips'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setTips(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudyTip)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const openNew = () => { setEditingTip(null); setTipTitle(''); setTipContent(''); setShowForm(true); };
  const openEdit = (tip: StudyTip) => { setEditingTip(tip); setTipTitle(tip.title); setTipContent(tip.content); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingTip(null); };

  const saveTip = async () => {
    if (!tipTitle.trim() || !tipContent.trim()) { alert('Title and content required!'); return; }
    setIsSaving(true);
    try {
      if (editingTip) {
        await updateDoc(doc(db, 'study_tips', editingTip.id), { title: tipTitle.trim(), content: tipContent.trim() });
      } else {
        await addDoc(collection(db, 'study_tips'), {
          title: tipTitle.trim(),
          content: tipContent.trim(),
          reactions: {},
          createdAt: serverTimestamp(),
        });
      }
      closeForm();
    } catch { alert('Failed to save!'); }
    setIsSaving(false);
  };

  const deleteTip = async (id: string) => {
    if (!confirm('Delete this tip?')) return;
    await deleteDoc(doc(db, 'study_tips', id));
    if (selectedTip?.id === id) setSelectedTip(null);
  };

  // ── Emoji Reaction ──
  const handleReaction = async (tipId: string, emoji: string) => {
    if (!user) return;
    const tipRef = doc(db, 'study_tips', tipId);
    const tipSnap = await getDoc(tipRef);
    if (!tipSnap.exists()) return;
    const data = tipSnap.data();
    const reactions = data.reactions || {};
    const users: string[] = reactions[emoji] || [];
    const already = users.includes(user.uid);
    const updated = already ? users.filter(u => u !== user.uid) : [...users, user.uid];
    await updateDoc(tipRef, { [`reactions.${emoji}`]: updated });
  };

  const getReactionCount = (tip: StudyTip, emoji: string) => (tip.reactions?.[emoji] || []).length;
  const hasReacted = (tip: StudyTip, emoji: string) => user ? (tip.reactions?.[emoji] || []).includes(user.uid) : false;

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-12 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl flex items-center justify-center text-yellow-600">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">Study Tips</h2>
            <p className="text-zinc-500 dark:text-zinc-400">Tips, tricks & strategies for students</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg">
            <Plus className="w-4 h-4" /> New Tip
          </button>
        )}
      </div>

      {/* Tips list */}
      <div className="space-y-6">
        {tips.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <Lightbulb className="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
            <p className="text-zinc-500">No study tips yet. Check back soon!</p>
          </div>
        ) : tips.map((tip, idx) => (
          <motion.div key={tip.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="group bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:border-emerald-500 transition-all shadow-lg">
            <div className="p-8">
              <div className="flex items-center gap-2 text-xs font-bold text-yellow-600 uppercase tracking-widest mb-4">
                <Calendar className="w-3 h-3" />
                {tip.createdAt?.seconds ? new Date(tip.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Just now'}
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 transition-colors mb-4">
                {tip.title}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 line-clamp-3 whitespace-pre-wrap">
                {tip.content}
              </p>

              {/* Emoji Reactions */}
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {EMOJIS.map(emoji => {
                  const count = getReactionCount(tip, emoji);
                  const reacted = hasReacted(tip, emoji);
                  return (
                    <button key={emoji}
                      onClick={() => user ? handleReaction(tip.id, emoji) : alert('Please sign in to react')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-all ${
                        reacted
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-emerald-400'
                      }`}>
                      <span>{emoji}</span>
                      {count > 0 && <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{count}</span>}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button onClick={() => setSelectedTip(tip)}
                  className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white hover:text-emerald-600 transition-colors">
                  Read & Discuss →
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedTip(tip)} className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-emerald-600 transition-colors">
                    <MessageCircle className="w-4 h-4" /> Comments
                  </button>
                  {isAdmin && (
                    <>
                      <button onClick={() => openEdit(tip)} className="p-1.5 text-zinc-400 hover:text-emerald-600 transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => deleteTip(tip.id)} className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedTip && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800 relative shadow-2xl">
              <button onClick={() => setSelectedTip(null)} className="absolute top-6 right-6 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-xs font-bold text-yellow-600 uppercase tracking-widest mb-4">
                <Calendar className="w-3 h-3" />
                {selectedTip.createdAt?.seconds ? new Date(selectedTip.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Just now'}
              </div>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mb-6">{selectedTip.title}</h3>
              <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap text-base mb-8">{selectedTip.content}</p>

              {/* Emoji reactions in modal */}
              <div className="flex items-center gap-2 flex-wrap pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mr-2">React:</span>
                {EMOJIS.map(emoji => {
                  const count = getReactionCount(selectedTip, emoji);
                  const reacted = hasReacted(selectedTip, emoji);
                  return (
                    <button key={emoji}
                      onClick={async () => {
                        await handleReaction(selectedTip.id, emoji);
                        // Refresh selectedTip
                        const snap = await getDoc(doc(db, 'study_tips', selectedTip.id));
                        if (snap.exists()) setSelectedTip({ id: snap.id, ...snap.data() } as StudyTip);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border-2 transition-all ${
                        reacted ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 scale-110' : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-emerald-400 hover:scale-110'
                      }`}>
                      <span className="text-base">{emoji}</span>
                      {count > 0 && <span className="text-xs font-bold">{count}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Comments */}
              <div className="pt-6">
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2 tracking-tighter">
                  <MessageCircle className="w-5 h-5 text-emerald-600" /> Discussions
                </h4>
                <CommentSection targetId={selectedTip.id} targetTitle={selectedTip.title} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-2xl font-black text-zinc-900 dark:text-white">{editingTip ? 'Edit Tip' : 'New Study Tip'}</h4>
              <button onClick={closeForm} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <input type="text" value={tipTitle} onChange={e => setTipTitle(e.target.value)} placeholder="Tip title *"
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
              <textarea value={tipContent} onChange={e => setTipContent(e.target.value)} placeholder="Write the tip content..." rows={8}
                className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              <div className="flex gap-4">
                <button onClick={closeForm} className="flex-1 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800">Cancel</button>
                <button onClick={saveTip} disabled={isSaving} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : editingTip ? '💾 Save' : '💡 Publish'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
