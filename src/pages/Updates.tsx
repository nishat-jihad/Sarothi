import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Update } from '../types';
import { Bell, ChevronRight, Calendar, MessageCircle, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CommentSection } from '../components/CommentSection';

export const Updates: React.FC = () => {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState<Update | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'updates'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUpdates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Update)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">Latest Updates</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Admission deadlines, schedules, and requirements</p>
        </div>
      </div>

      <div className="space-y-6">
        {updates.length > 0 ? updates.map((update, idx) => (
          <motion.div
            key={update.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:border-emerald-500 transition-all shadow-lg hover:shadow-emerald-600/5"
          >
            <div className="p-8">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">
                <Calendar className="w-3 h-3" />
                {update.createdAt?.seconds ? new Date(update.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Just now'}
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 transition-colors mb-4">{update.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6 line-clamp-3 whitespace-pre-wrap">{update.content}</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <button 
                  onClick={() => setSelectedUpdate(update)}
                  className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-white hover:text-emerald-600 transition-colors"
                >
                  Read Full Update <ChevronRight className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-4 text-zinc-400">
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <MessageCircle className="w-4 h-4" /> Discussions
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-500">No updates posted yet.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedUpdate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800 relative"
            >
              <button 
                onClick={() => setSelectedUpdate(null)}
                className="absolute top-6 right-6 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">
                <Calendar className="w-3 h-3" />
                {selectedUpdate.createdAt?.seconds ? new Date(selectedUpdate.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Just now'}
              </div>
              <h3 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter mb-6">{selectedUpdate.title}</h3>
              
              <div className="prose dark:prose-invert max-w-none mb-12">
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{selectedUpdate.content}</p>
              </div>

              <div className="pt-12 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-8 flex items-center gap-2 tracking-tighter">
                  <MessageCircle className="w-5 h-5 text-emerald-600" /> Discussions
                </h4>
                <CommentSection targetId={selectedUpdate.id} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
