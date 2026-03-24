// ── FILE: src/pages/AdmissionPage.tsx ────────────────────────
import React, { useState } from 'react';
import { AdmissionCategory } from '../types/lecture';
import SubjectLectures from '../components/lecture/SubjectLectures';

const CATEGORIES: AdmissionCategory[] = ['Engineering', 'University', 'Medical', 'GST'];

export default function AdmissionPage() {
  const [selectedCat, setSelectedCat] = useState<AdmissionCategory | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Breadcrumb Navigation */}
      <nav className="text-sm text-gray-400 mb-6 flex gap-2">
        <span>Start</span><span>›</span>
        <span className="text-gray-600 font-medium">Admission</span>
        {selectedCat && <><span>›</span><span className="text-gray-600">{selectedCat}</span></>}
        {selectedSubject && <><span>›</span><span className="text-gray-600">{selectedSubject}</span></>}
      </nav>

      {!selectedCat && (
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Select Admission Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className="bg-white border-2 border-emerald-200 rounded-2xl py-8 px-4 text-lg font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 hover:border-emerald-400 transition-all"
              >
                {cat}
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedCat && (
        <section>
          <button 
            onClick={() => { setSelectedCat(null); setSelectedSubject(null); }}
            className="text-emerald-600 text-sm mb-4 hover:underline"
          >
            ← Back
          </button>
          
          <SubjectLectures
            platform="Admission"
            admissionCategory={selectedCat}
            admissionSubject={selectedSubject || undefined}
          />
        </section>
      )}
    </div>
  );
}
