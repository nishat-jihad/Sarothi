import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { HSCSSC } from './pages/HSCSSC';
import { Admission } from './pages/Admission';
import { Updates } from './pages/Updates';
import { Admin } from './pages/Admin';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Contact } from './pages/Contact';
import { Study } from './pages/Study';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300">
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
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/hsc-ssc" element={<HSCSSC />} />
            <Route path="/admission" element={<Admission />} />
            <Route path="/updates" element={<Updates />} />
            <Route path="/study" element={<Study />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
