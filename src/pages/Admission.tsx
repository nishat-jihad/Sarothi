import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { ADMISSION_CATEGORIES, DEFAULT_ENGINEERING_UNIS } from '../constants';
import { ChevronRight, School, Download, MessageCircle, Eye, Loader2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '../types';
import { CommentSection } from '../components/CommentSection';

type ViewState = 'category' | 'university' | 'year' | 'question';

export const Admission: React.FC = () => {
  const [view, setView] = useState<ViewState>('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUni, setSelectedUni] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [unis, setUnis] = useState<{ id: string, name: string, type: string }[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'universities'), (snapshot) => {
      const uniData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setUnis(uniData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (view === 'question' && selectedCategory && selectedUni && selectedYear) {
      const q = query(
        collection(db, 'questions'),
        where('type', '==', 'Admission'),
        where('category', '==', selectedCategory),
        where('university', '==', selectedUni),
        where('year', '==', selectedYear)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const qData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
        setActiveQuestion(qData[0] || null);
      });
      return () => unsubscribe();
    }
  }, [view, selectedCategory, selectedUni, selectedYear]);

  const getFilteredUnis = () => {
    if (selectedCategory === 'Engineering') {
      const dbUnis = unis.filter(u => u.type === 'Engineering').map(u => u.name);
      return Array.from(new Set([...DEFAULT_ENGINEERING_UNIS, ...dbUnis]));
    }
    if (selectedCategory === 'Medical') {
      const dbUnis = unis.filter(u => u.type === 'Medical').map(u => u.name);
      return Array.from(new Set(['Dhaka Medical College', ...dbUnis]));
    }
    return unis.filter(u => u.type === selectedCategory).map(u => u.name);
  };

  const resetTo = (v: ViewState) => {
    setView(v);
    if (v === 'category') { setSelectedCategory(null); setSelectedUni(null); setSelectedYear(null); setActiveQuestion(null); }
    if (v === 'university') { setSelectedUni(null); setSelectedYear(null); setActiveQuestion(null); }
    if (v === 'year') { setSelectedYear(null); setActiveQuestion(null); }
  };

  const Breadcrumbs = () => (
    <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 mb-8">
      <button onClick={() => resetTo('category')} className="hover:text-blue-600">Admission</button>
      {selectedCategory && <><ChevronRight className="w-3 h-3" /><button onClick={() => resetTo('university')} className="hover:text-blue-600">{selectedCategory}</button></>}
      {selectedUni && <><ChevronRight className="w-3 h-3" /><button onClick={() => resetTo('year')} className="hover:text-blue-600">{selectedUni}</button></>}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 min-h-[70vh]">
      <Breadcrumbs />

      <AnimatePresence mode="wait">
        {view === 'category' && (
          <motion.div key="category" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {ADMISSION_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setView('university'); }}
                className="p-10 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-4 hover:border-blue-500 transition-all group"
              >
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <School className="w-8 h-8" />
                </div>
                <span className="text-xl font-bold text-zinc-900 dark:text-white">{cat}</span>
              </button>
            ))}
          </motion.div>
        )}

        {view === 'university' && (
          <motion.div key="university" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 gap-4">
            {getFilteredUnis().map((uni) => (
              <button
                key={uni}
                onClick={() => { setSelectedUni(uni); setView('year'); }}
                className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-all group"
              >
                <span className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors">{uni}</span>
                <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-blue-600 transition-colors" />
              </button>
            ))}
          </motion.div>
        )}

        {view === 'year' && (
          <motion.div key="year" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 17 }, (_, i) => 2026 - i).map((year) => (
              <button
                key={year}
                onClick={() => { setSelectedYear(year.toString()); setView('question'); }}
                className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-center hover:border-blue-500 transition-all group"
              >
                <span className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 transition-colors">{year}</span>
              </button>
            ))}
          </motion.div>
        )}

        {view === 'question' && (
          <motion.div key="question" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{selectedUni} - {selectedYear}</h3>
                {activeQuestion && (
                  <button 
                    onClick={() => window.open(activeQuestion.downloadUrl, '_blank')}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="p-8 bg-zinc-50 dark:bg-zinc-950 flex justify-center min-h-[400px]">
                {activeQuestion ? (
                  <img src={activeQuestion.imageUrl} alt="Question Paper" className="max-w-full h-auto shadow-2xl rounded-lg" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-500">
                    <School className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">Question not available yet</p>
                  </div>
                )}
              </div>
            </div>
            
            {activeQuestion && (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8">
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-8 flex items-center gap-2 tracking-tighter">
                  <MessageCircle className="w-5 h-5 text-blue-600" /> Discussions
                </h4>
                <CommentSection targetId={activeQuestion.id} />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
