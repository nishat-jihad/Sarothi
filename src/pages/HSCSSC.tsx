import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { BOARDS, HSC_SUBJECTS, SSC_SUBJECTS, GROUPS } from '../constants';
import { ChevronRight, FileText, Download, MessageCircle, Eye, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '../types';
import { CommentSection } from '../components/CommentSection';

type ViewState = 'type' | 'year' | 'board' | 'group' | 'subject' | 'question';

export const HSCSSC: React.FC = () => {
  const location = useLocation();
  const [view, setView] = useState<ViewState>('type');
  const [selectedType, setSelectedType] = useState<'HSC' | 'SSC' | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type');
    if (type === 'HSC' || type === 'SSC') {
      setSelectedType(type as any);
      setView('year');
    }
  }, [location]);

  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<'Science' | 'Commerce' | 'Arts' | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedQuestionType, setSelectedQuestionType] = useState<'MCQ' | 'CQ' | null>(null);
  const [years, setYears] = useState<string[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'hsc_ssc_years'), (snapshot) => {
      const yearData = snapshot.docs.map(doc => doc.data().year).sort((a, b) => b.localeCompare(a));
      setYears(yearData.length > 0 ? yearData : ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018']);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (view === 'question' && selectedType && selectedYear && selectedBoard && selectedSubject && selectedQuestionType) {
      const q = query(
        collection(db, 'questions'),
        where('type', '==', selectedType),
        where('year', '==', selectedYear),
        where('board', '==', selectedBoard),
        where('subject', '==', selectedSubject),
        where('questionType', '==', selectedQuestionType)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const qData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
        setActiveQuestion(qData[0] || null);
      });
      return () => unsubscribe();
    }
  }, [view, selectedType, selectedYear, selectedBoard, selectedSubject, selectedQuestionType]);

  const resetTo = (v: ViewState) => {
    setView(v);
    if (v === 'type') { setSelectedType(null); setSelectedYear(null); setSelectedBoard(null); setSelectedGroup(null); setSelectedSubject(null); setSelectedQuestionType(null); setActiveQuestion(null); }
    if (v === 'year') { setSelectedYear(null); setSelectedBoard(null); setSelectedGroup(null); setSelectedSubject(null); setSelectedQuestionType(null); setActiveQuestion(null); }
    if (v === 'board') { setSelectedBoard(null); setSelectedGroup(null); setSelectedSubject(null); setSelectedQuestionType(null); setActiveQuestion(null); }
    if (v === 'group') { setSelectedGroup(null); setSelectedSubject(null); setSelectedQuestionType(null); setActiveQuestion(null); }
    if (v === 'subject') { setSelectedSubject(null); setSelectedQuestionType(null); setActiveQuestion(null); }
    if (v === 'question') { setActiveQuestion(null); }
  };

  const Breadcrumbs = () => (
    <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 mb-8">
      <button onClick={() => resetTo('type')} className="hover:text-emerald-600">Start</button>
      {selectedType && <><ChevronRight className="w-3 h-3" /><button onClick={() => resetTo('year')} className="hover:text-emerald-600">{selectedType}</button></>}
      {selectedYear && <><ChevronRight className="w-3 h-3" /><button onClick={() => resetTo('board')} className="hover:text-emerald-600">{selectedYear}</button></>}
      {selectedBoard && <><ChevronRight className="w-3 h-3" /><button onClick={() => resetTo('group')} className="hover:text-emerald-600">{selectedBoard}</button></>}
      {selectedGroup && <><ChevronRight className="w-3 h-3" /><button onClick={() => resetTo('subject')} className="hover:text-emerald-600">{selectedGroup}</button></>}
      {selectedSubject && <><ChevronRight className="w-3 h-3" /><button onClick={() => resetTo('question')} className="hover:text-emerald-600">{selectedSubject}</button></>}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 min-h-[70vh]">
      <Breadcrumbs />

      <AnimatePresence mode="wait">
        {view === 'type' && (
          <motion.div key="type" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {['HSC', 'SSC'].map((type) => (
              <button
                key={type}
                onClick={() => { setSelectedType(type as any); setView('year'); }}
                className="group relative h-64 bg-white dark:bg-zinc-900 rounded-[2rem] shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative h-full flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center">
                    <FileText className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{type}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {view === 'year' && (
          <motion.div key="year" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 gap-4">
            {years.map((year) => (
              <button
                key={year}
                onClick={() => { setSelectedYear(year); setView('board'); }}
                className="flex items-center justify-between p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-sm font-bold text-zinc-600 dark:text-zinc-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    {year.slice(-2)}
                  </div>
                  <span className="text-lg font-bold text-zinc-900 dark:text-white">{selectedType} {year}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-emerald-600 transition-colors" />
              </button>
            ))}
          </motion.div>
        )}

        {view === 'board' && (
          <motion.div key="board" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {BOARDS.map((board) => (
              <button
                key={board}
                onClick={() => { setSelectedBoard(board); setView('group'); }}
                className="p-6 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-left hover:border-emerald-500 transition-all group"
              >
                <span className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 transition-colors">{board}</span>
              </button>
            ))}
          </motion.div>
        )}

        {view === 'group' && (
          <motion.div key="group" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GROUPS.map((group) => (
              <button
                key={group}
                onClick={() => { setSelectedGroup(group as any); setView('subject'); }}
                className="p-10 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-4 hover:border-emerald-500 transition-all group"
              >
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <FileText className="w-8 h-8" />
                </div>
                <span className="text-xl font-bold text-zinc-900 dark:text-white">{group}</span>
              </button>
            ))}
          </motion.div>
        )}

        {view === 'subject' && selectedGroup && (
          <motion.div key="subject" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
            {(selectedType === 'HSC' ? HSC_SUBJECTS : SSC_SUBJECTS)[selectedGroup].map((subject) => (
              <div key={subject} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  {subject}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={() => { setSelectedSubject(subject); setSelectedQuestionType('MCQ'); setView('question'); }}
                    className="flex items-center justify-center gap-2 py-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 transition-all font-bold text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    <FileText className="w-4 h-4" /> MCQ
                  </button>
                  <button 
                    onClick={() => { setSelectedSubject(subject); setSelectedQuestionType('CQ'); setView('question'); }}
                    className="flex items-center justify-center gap-2 py-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 transition-all font-bold text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    <FileText className="w-4 h-4" /> CQ
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {view === 'question' && (
          <motion.div key="question" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{selectedSubject}</h3>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">
                    {selectedType} {selectedYear} • {selectedBoard} • {selectedQuestionType}
                  </p>
                </div>
                {activeQuestion && (
                  <button 
                    onClick={() => window.open(activeQuestion.downloadUrl, '_blank')}
                    className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
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
                    <FileText className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">Question not available yet</p>
                  </div>
                )}
              </div>
            </div>

            {activeQuestion && (
              <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8">
                <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-8 flex items-center gap-2 tracking-tighter">
                  <MessageCircle className="w-5 h-5 text-emerald-600" /> Discussions
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
