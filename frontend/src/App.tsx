import { Routes, Route, Navigate } from 'react-router-dom';
import DemoPage from './components/DemoPage';

export default function App() {
  return (
    <Routes>
      <Route path="/demo/:demoId" element={<DemoPage />} />
      <Route path="*" element={<Navigate to="/demo/loading" replace />} />
    </Routes>
  );
}
