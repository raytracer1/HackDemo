import { Routes, Route, Navigate } from 'react-router-dom';
import DemoPage from './components/DemoPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PricingPage from './pages/PricingPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/demo/:demoId" element={<DemoPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
