import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export const Contact: React.FC = () => {
  const [content, setContent] = useState<{ email: string; phone: string; address: string; text: string }>({
    email: 'contact@sarothi.edu',
    phone: '+880 1234 567890',
    address: 'Dhaka, Bangladesh',
    text: 'We are here to help you with your academic journey.'
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'site_content', 'contact'), (docSnap) => {
      if (docSnap.exists()) {
        setContent(docSnap.data() as any);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <h1 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter">Get in Touch</h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md">
            {content.text}
          </p>

          <div className="space-y-6 pt-8">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Email</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{content.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Phone</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{content.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Address</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-white">{content.address}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-10 border border-zinc-200 dark:border-zinc-800 shadow-xl">
          <form className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Name</label>
              <input type="text" className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="Your Name" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Email</label>
              <input type="email" className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="Your Email" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Message</label>
              <textarea rows={4} className="w-full p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none" placeholder="How can we help?"></textarea>
            </div>
            <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
              <Send className="w-5 h-5" /> Send Message
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
