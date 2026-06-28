import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PricingPage from './pages/PricingPage';
import HistoryPage from './pages/HistoryPage';
import DemoPage from './components/DemoPage';

export default function App() {
  return (
    <Routes>
      {/* Pages with Header + Footer */}
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/demo/:demoId" element={<DemoPage />} />
      </Route>

      {/* Login page — no Header/Footer */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
