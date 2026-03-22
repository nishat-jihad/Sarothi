import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { SlideshowImage } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const [slides, setSlides] = useState<SlideshowImage[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [siteContent, setSiteContent] = useState<any>({});

  // Load slideshow
  useEffect(() => {
    const q = query(collection(db, 'slideshow'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, snap => {
      setSlides(snap.docs.map(d => ({ id: d.id, ...d.data() } as SlideshowImage)));
    });
    return () => unsub();
  }, []);

  // Load site content (feature images & text)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'site_content'), snap => {
      const content: any = {};
      snap.docs.forEach(d => { content[d.id] = d.data(); });
      setSiteContent(content);
    });
    return () => unsub();
  }, []);

  // Auto slide
  useEffect(() => {
    if (slides.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [slides]);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);

  // Feature content from Firebase or defaults
  const feature1 = siteContent.feature_1 || {};
  const feature2 = siteContent.feature_2 || {};

  const feature1Image = feature1.imageUrl || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80';
  const feature1Title = feature1.title || 'First feature: Download and see HSC/SSC previous year question';
  const feature1Desc = feature1.desc || 'We often get exhausted searching different websites for HSC or SSC questions, yet still fail to find them. On this website, those will be organized and presented properly. You will find this feature only on the Board Page.';

  const feature2Image = feature2.imageUrl || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80';
  const feature2Title = feature2.title || 'Second feature: Download and see Admission previous year question';
  const feature2Desc = feature2.desc || "You can't find admission questions anywhere? Stop searching—on this website you'll get all previous year questions for university, medical, and engineering. If any question is missing, please wait. This feature is available only on the Admission Page.";

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">

      {/* ── Hero Slideshow ── */}
      <section className="relative h-[60vh] md:h-[80vh] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
        <AnimatePresence mode="wait">
          {slides.length > 0 ? (
            <motion.img
              key={slides[currentSlide].id}
              src={slides[currentSlide].url}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
              alt="Slideshow"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-3">
              <div className="text-6xl">📚</div>
              <p className="font-bold text-xl">Welcome to Sarothi</p>
              <p className="text-sm">Your academic companion</p>
            </div>
          )}
        </AnimatePresence>

        {/* Dots */}
        {slides.length > 0 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, idx) => (
              <button key={idx} onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-white w-6' : 'bg-white/50 w-2'}`} />
            ))}
          </div>
        )}

        {/* Arrows */}
        {slides.length > 1 && (
          <>
            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm transition-colors">
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </section>

      {/* ── Feature Sections ── */}
      <div className="max-w-7xl mx-auto px-4 py-20 space-y-32">

        {/* Feature 1 — Text Left, Image Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-emerald-600 dark:text-emerald-400 font-bold text-lg uppercase tracking-wider">
              What can you find in our website?
            </h2>
            <h3 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white leading-snug">
              {feature1Title}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
              {feature1Desc.includes('Board Page') ? (
                <>
                  {feature1Desc.split('Board Page')[0]}
                  <Link to="/hsc-ssc" className="text-emerald-600 hover:underline">Board Page</Link>
                  {feature1Desc.split('Board Page')[1]}
                </>
              ) : feature1Desc}
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
            <img
              src={feature1Image}
              alt="HSC SSC Feature"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Feature 2 — Image Left, Text Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1 rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
            <img
              src={feature2Image}
              alt="Admission Feature"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white leading-snug">
              {feature2Title}
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
              {feature2Desc.includes('Admission Page') ? (
                <>
                  {feature2Desc.split('Admission Page')[0]}
                  <Link to="/admission" className="text-emerald-600 hover:underline">Admission Page</Link>
                  {feature2Desc.split('Admission Page')[1]}
                </>
              ) : feature2Desc}
            </p>
          </div>
        </div>

        {/* Feature 3 — Full width */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-[3rem] p-12 md:p-20 text-center space-y-8">
          <h4 className="text-2xl md:text-3xl font-medium text-zinc-900 dark:text-white max-w-4xl mx-auto leading-snug">
            Additionally, if you keep an eye on this website, you will get all important information about university,
            engineering, and medical admission exams, including admissions, deadlines, and updates.
            As a result, you won't need to browse anywhere else. This feature will be completely free,
            and it will be available only on our{' '}
            <Link to="/updates" className="text-emerald-600 hover:underline">Update Page</Link>.
          </h4>
        </div>
      </div>
    </div>
  );
};
