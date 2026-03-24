import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';

// নতুন ওভারহল অনুযায়ী ইমপোর্ট
import HSCPage from './pages/HSCPage'; 
import AdmissionPage from './pages/AdmissionPage'; 
import { Updates } from './pages/Updates';
import { Admin } from './pages/Admin';
import AddLecture from './pages/admin/AddLecture';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Contact } from './pages/Contact';
import { Study } from './pages/Study';
import { StudyTips } from './pages/StudyTips';
import { About } from './pages/About';

// YouTube API লোড করার হুক
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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  return isAdmin ? <>{children}</> : <Navigate to="/" />;
};

export default function App() {
  // ভিডিও প্লেয়ারের জন্য API কল
  useYouTubeAPI();

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
            <Route path="/study" element={<Study />} />
            <Route path="/study-tips" element={<StudyTips />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/contact" element={<Contact />} />
            
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            
            {/* অ্যাডমিন রাউটসমূহ */}
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="/admin/add-lecture" element={<AdminRoute><AddLecture /></AdminRoute>} />
            
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
