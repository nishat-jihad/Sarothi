import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';

export const PrivacyPolicy: React.FC = () => {
  const [content, setContent] = useState<string>('Loading privacy policy...');

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'site_content', 'privacy_policy'), (docSnap) => {
      if (docSnap.exists()) {
        setContent(docSnap.data().text);
      } else {
        setContent('Privacy policy content not yet available.');
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-12 border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-white mb-8 tracking-tighter">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      </motion.div>
    </div>
  );
};
