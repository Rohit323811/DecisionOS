import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DecisionProvider } from './contexts/DecisionContext';
import { ToastProvider } from './components/ui/Toast';
import { Landing } from './pages/Landing';
import { DecisionInput } from './pages/DecisionInput';
import { Analysis } from './pages/Analysis';
import { DecisionModel } from './pages/DecisionModel';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <DecisionProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/new" element={<DecisionInput />} />
            <Route path="/analyzing" element={<Analysis />} />
            <Route path="/model" element={<DecisionModel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DecisionProvider>
      </ToastProvider>
    </BrowserRouter>);

}