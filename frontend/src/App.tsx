import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PricingPage from './pages/PricingPage';
import HistoryPage from './pages/HistoryPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import HelpPage from './pages/HelpPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import VerifyPage from './pages/VerifyPage';
import DemoPage from './components/DemoPage';

export default function App() {
  return (
    <Routes>
      {/* Pages with Header + Footer */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/demo/:demoId" element={<DemoPage />} />
      </Route>

      {/* Login page — no Header/Footer */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
