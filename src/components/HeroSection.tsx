import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
// নিশ্চিত করুন এই পাথটি আপনার firebase.ts ফাইলের সাথে মিলছে
import { db } from '../firebase'; 
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// টাইপ এখানেই ডিফাইন করে দেওয়া হলো যাতে 'missing types' এরর না আসে
interface SlideshowImage {
  id: string;
  url: string;
  order: number;
}

const HeroSection: React.FC = () => {
  const [slides, setSlides] = useState<SlideshowImage[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // collection name 'slideshow' কি ঠিক আছে? ডাটাবেসে চেক করুন
    const q = query(collection(db, 'slideshow'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const slideData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as SlideshowImage));
      setSlides(slideData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (slides.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [slides.length]); // dependency updated

  const nextSlide = () => {
    if (slides.length > 0) setCurrentSlide((prev) => (prev + 1) % slides.length);
  };
  
  const prevSlide = () => {
    if (slides.length > 0) setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative h-[60vh] md:h-[80vh] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
      <AnimatePresence mode="wait">
        {slides.length > 0 && slides[currentSlide] ? (
          <motion.img
            key={slides[currentSlide].id}
            src={slides[currentSlide].url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-400 bg-zinc-800">
            লোড হচ্ছে... অথবা কোনো ছবি পাওয়া যায়নি।
          </div>
        )}
      </AnimatePresence>

      {/* Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-6' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}

      {/* Controls */}
      {slides.length > 1 && (
        <>
          <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm z-20 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-sm z-20 transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
    </section>
  );
};

export default HeroSection;
