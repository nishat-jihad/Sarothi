import React from 'react';
import { BookOpen, Users, Target, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-6">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter mb-4">About Sarothi</h1>
        <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
          Your academic companion — built for Bangladeshi students, by someone who cares.
        </p>
      </div>

      {/* Mission */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 mb-8 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center"><Target className="w-5 h-5 text-emerald-600" /></div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Our Mission</h2>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-lg">
          Sarothi exists to save students' time. We believe every student deserves easy access to academic resources —
          without spending hours searching different websites. Our goal is to be the one-stop platform for
          HSC & SSC question papers, admission resources, study materials, and academic updates.
        </p>
      </div>

      {/* What we offer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[
          { icon: '📘', title: 'HSC & SSC Questions', desc: 'Previous year question papers from all 9 boards — organized by year, board, and subject.' },
          { icon: '🎓', title: 'Admission Resources', desc: 'Question papers for engineering, medical, and university admission exams — all in one place.' },
          { icon: '📐', title: 'Formula Sheets', desc: 'Chapter-wise formula sheets and notes for Science subjects — HSC and Admission both.' },
          { icon: '📢', title: 'Latest Updates', desc: 'Stay informed with admission deadlines, exam schedules, and important academic news.' },
        ].map((item, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <div className="text-3xl mb-3">{item.icon}</div>
            <h3 className="font-bold text-zinc-900 dark:text-white mb-2">{item.title}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Values */}
      <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/20 p-8 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="w-6 h-6 text-emerald-600" />
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Our Values</h2>
        </div>
        <div className="space-y-3">
          {[
            '✅ Free for everyone — no hidden fees, ever.',
            '✅ Organized & easy to navigate — no more endless searching.',
            '✅ Regularly updated — fresh content added frequently.',
            '✅ Student-first — everything we build is for you.',
          ].map((v, i) => (
            <p key={i} className="text-zinc-700 dark:text-zinc-300 font-medium">{v}</p>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">Have questions or suggestions? We'd love to hear from you!</p>
        <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20">
          📞 Contact Us
        </Link>
      </div>
    </div>
  );
};
