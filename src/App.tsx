import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';

// নতুন ইমপোর্টসমূহ (নিশ্চিত করুন এই ফাইলগুলো pages ফোল্ডারে আছে)
import HSCPage from './pages/HSCPage'; 
import AdmissionPage from './pages/AdmissionPage'; 
import { Updates } from './pages/Updates';
import { Admin } from './pages/Admin';
import AddLecture from './pages/admin/AddLecture';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Contact } from './pages/Contact';

// YouTube API হুক (আলাদা ফাইল না থাকলে এখানেই রাখা হলো)
function useYouTubeAPI() {
  useEffect(() => {
    if (document.getElementById('yt-iframe-api')) return;
    const tag = document.createElement('script');
    tag.id = 'yt-iframe-api';
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.async = true;
    document.head.appendChild(tag);
  }, []);
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen transition-colors duration-300">
    <Navbar />
    <main className="flex-grow">{children}</main>
    <Footer />
  </div>
);

export default function App() {
  useYouTubeAPI(); // Claude এর নির্দেশনা অনুযায়ী যুক্ত করা হলো

  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            
            {/* নতুন ডাইনামিক রাউটসমূহ */}
            <Route path="/hsc" element={<HSCPage classLevel="HSC" />} />
            <Route path="/ssc" element={<HSCPage classLevel="SSC" />} />
            <Route path="/admission" element={<AdmissionPage />} />
            
            <Route path="/updates" element={<Updates />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            
            {/* প্রোফাইল এবং অ্যাডমিন */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/add-lecture" element={<AddLecture />} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
