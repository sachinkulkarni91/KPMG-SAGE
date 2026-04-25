import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Bot, ChevronDown } from 'lucide-react';
import Home from './pages/Home';
import IncidentTriage from './pages/IncidentTriage';
import UserAccess from './pages/UserAccess';
import BugReport from './pages/BugReport';
import BugDetail from './pages/BugDetail';

function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F4F7FB] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-100">
        <div className="px-6 py-4 flex justify-between items-center w-full">
          <Link to="/" className="flex items-center group w-[20%]">
            <img
              src="/logo.svg"
              alt="KPMG Logo"
              className="h-10 object-contain rounded"
            />
          </Link>

          <nav className="flex-1 flex justify-center items-center gap-10">
            <Link to="/" className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 transition-colors">Homepage</Link>
            <a href="#" className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 transition-colors">About us</a>
            <a href="#" className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 transition-colors">Developer Console (beta)</a>
            <a href="#" className="text-[13px] font-semibold text-slate-500 hover:text-slate-900 transition-colors">Insights (beta)</a>
          </nav>

          <div className="flex justify-end items-center gap-3 w-[20%]">
            <button className="inline-flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-100">
              <Bot className="h-4 w-4" />
              AI Assistant
              <span className="text-xs">✦</span>
            </button>
            <button className="h-8 w-8 rounded-full overflow-hidden border-2 border-slate-200">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User Profile" className="h-full w-full object-cover bg-amber-100" />
            </button>
            <button className="text-slate-500 hover:text-slate-800">
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/incident-triage" element={<IncidentTriage />} />
          <Route path="/user-access" element={<UserAccess />} />
          <Route path="/bug-report" element={<BugReport />} />
          <Route path="/bug-report/:bugId" element={<BugDetail />} />
        </Routes>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">&copy; 2026 KPMG sage. All rights reserved.</p>
          <div className="flex gap-4 text-sm text-slate-500">
            <a href="#" className="hover:text-indigo-600 transition">Documentation</a>
            <a href="#" className="hover:text-indigo-600 transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWithRouter;
