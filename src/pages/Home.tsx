import React from 'react';
import HeroSection from '../components/HeroSection'; // নিশ্চিত করুন এই ফাইলটি আছে

export function Home() {
  return (
    <div className="animate-fadeIn">
      <HeroSection />
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">আমাদের সেবা সমূহ</h2>
        {/* আপনার বাকি কার্ড বা কন্টেন্ট এখানে থাকবে */}
      </section>
    </div>
  );
}
