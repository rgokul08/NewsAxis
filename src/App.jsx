import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/navigation/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { ArticlePage } from './pages/ArticlePage';
import { CategoryPage } from './pages/CategoryPage';
import { CategoriesIndexPage } from './pages/CategoriesIndexPage';
import { LatestPage } from './pages/LatestPage';
import { TrendingPage } from './pages/TrendingPage';
import { BlogsPage } from './pages/BlogsPage';
import { SearchPage } from './pages/SearchPage';
import { BookmarksPage } from './pages/BookmarksPage';
import { WriteStoryPage } from './pages/WriteStoryPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { LoginPage, SignupPage } from './pages/auth/AuthPages';
import { SourcesPage, GuidelinesPage, AboutPage, ContactPage, PrivacyPage, TermsPage, NotFoundPage } from './pages/StaticPages';
import { ProfilePage } from './pages/user/ProfilePage';
import { useAuth } from './context/AuthContext';

// Protected Route for Admin CMS
function AdminRoute({ children }) {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

export function App() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header />
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/article/:slug" element={<ArticlePage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/categories" element={<CategoriesIndexPage />} />
          <Route path="/latest" element={<LatestPage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/blogs" element={<BlogsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="/write" element={<WriteStoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/community-guidelines" element={<GuidelinesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            } 
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
