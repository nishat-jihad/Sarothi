import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    q: 'What can you find in our website?',
    a: 'Sarothi is your all-in-one academic companion. You can find HSC & SSC previous year question papers (board-wise & year-wise), admission question papers for engineering, medical and university entrance exams, chapter-wise formula sheets and study materials, study tips and strategies, and the latest admission news and updates — all completely free!'
  },
  {
    q: 'Can I get HSC content for free?',
    a: 'Yes! All HSC previous year question papers — MCQ and CQ — are 100% free. You can view and download questions from all 9 boards for any year. Just sign in to access the download feature.'
  },
  {
    q: 'Can I get SSC content for free?',
    a: 'Absolutely! SSC question papers for all subjects across all 9 boards are completely free. Browse by year, board, and group — Science, Commerce, or Arts — and download the papers you need.'
  },
  {
    q: 'Will I get updates about HSC/SSC or admission news?',
    a: 'Yes! Our Updates section is regularly updated with the latest news about HSC and SSC exam routines, result dates, admission deadlines, seat plans, and important circulars. You will also receive in-app notifications when a new update is posted.'
  },
  {
    q: 'Can I find chapter-wise formula sheets here?',
    a: 'Yes! The Study section includes chapter-wise formula sheets and notes for HSC Science and Admission Science subjects. This includes Physics, Chemistry, Higher Math, Biology, and more. Admin regularly uploads PDF and image-based formula sheets for each chapter.'
  },
  {
    q: 'Can I find study-related tips and tricks here?',
    a: 'Yes! The Study Tips section is dedicated to helping students study smarter. You will find exam strategies, time management tips, subject-specific advice, and motivation — posted regularly. You can also react with emojis and join discussions in the comments!'
  },
];

interface FAQItemProps {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

const FAQItem: React.FC<FAQItemProps> = ({ q, a, isOpen, onToggle, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900"
  >
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-6 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
    >
      <span className={`font-bold text-base pr-4 ${isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-900 dark:text-white'}`}>
        {q}
      </span>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-emerald-600 text-white rotate-180' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
        <ChevronDown className="w-4 h-4 transition-transform" />
      </div>
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="px-6 pb-6 text-zinc-600 dark:text-zinc-400 leading-relaxed text-sm border-t border-zinc-100 dark:border-zinc-800 pt-4">
            {a}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="max-w-4xl mx-auto px-4 py-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tighter mb-3">
          Frequently Asked Questions
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">Everything you need to know about Sarothi</p>
      </div>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <FAQItem
            key={i}
            index={i}
            q={faq.q}
            a={faq.a}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </div>
    </section>
  );
};
