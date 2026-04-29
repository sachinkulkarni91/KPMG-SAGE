import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ChevronDown, User } from 'lucide-react';
import Home from './pages/Home';
import IncidentTriage from './pages/IncidentTriage';
import UserAccess from './pages/UserAccess';
import BugReport from './pages/BugReport';
import BugDetail from './pages/BugDetail';
import AgentMarketplace from './pages/AgentMarketplace';
import AgentDetail from './pages/AgentDetail';

function App() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F4F7FB] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <header className="sticky top-0 z-50 bg-[#03307f] shadow-lg">
        <div className="w-full px-4 sm:px-6 py-1 flex items-center justify-between">
          {/* Logo and Branding */}
          <Link to="/" className="flex items-center gap-0">
            <img
              src="/ChatGPT%20Image%20Apr%2028,%202026,%2001_48_50%20PM.png"
              alt="Kurate AI Logo"
              className="h-12 md:h-14 lg:h-16 object-contain"
            />
            <span className="text-white font-bold text-xl sm:text-[18px] tracking-wide">Kurate AI</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex flex-1 items-center px-6 h-full">
            <a href="#" className="text-white text-sm font-medium transition-colors py-4 px-3 hover:bg-[#022055]">Overview</a>

            <div className="ml-auto flex items-center gap-2 pr-0">
              <div className="relative group cursor-pointer h-full">
                <div className="flex items-center gap-1 text-white text-sm font-medium transition-colors py-4 px-3 group-hover:bg-[#022055]">
                  <span>Industry</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
                <div className="absolute top-full left-0 w-64 bg-[#1a2227] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2 flex flex-col">
                    {['Support', 'Security', 'Development', 'Productivity', 'QA'].map((item) => (
                      <Link
                        key={item}
                        to={`/agent-marketplace?industry=${item.toLowerCase()}`}
                        className="block px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative group cursor-pointer h-full">
                <div className="flex items-center gap-1 text-white text-sm font-medium transition-colors py-4 px-3 group-hover:bg-[#022055]">
                  <span>Function</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
                <div className="absolute top-full left-0 w-64 bg-[#1a2227] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2 flex flex-col">
                    {['Categorize', 'Manage', 'Track', 'Testing'].map((item) => (
                      <Link
                        key={item}
                        to={`/agent-marketplace?function=${item.toLowerCase()}`}
                        className="block px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative group cursor-pointer h-full">
                <div className="flex items-center gap-1 text-white text-sm font-medium transition-colors py-4 px-3 group-hover:bg-[#022055]">
                  <span>Personas</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
                <div className="absolute top-full left-0 w-64 bg-[#1a2227] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2 flex flex-col">
                    {['IT Service Desk Agent', 'ITSM Process Owner', 'Procurement Operations Analyst', 'Supplier Relationship Manager', 'S2P Workflow Designer', 'HR Case Manager', 'HR Operations Lead', 'Risk & Compliance Analyst', 'GRC Architect', 'Policy Manager', 'Security Incident Responder', 'Threat Intelligence Analyst', 'Change Manager', 'Governance Lead'].map((persona) => (
                      <Link
                        key={persona}
                        to={`/agent-marketplace?personas=${encodeURIComponent(persona)}`}
                        className="block px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                      >
                        {persona}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <a href="#" className="text-white text-sm font-medium transition-colors py-4 px-3 hover:bg-[#022055]">Powered</a>

              <div className="relative group cursor-pointer h-full">
                <div className="flex items-center gap-1 text-white text-sm font-medium transition-colors py-4 px-3 group-hover:bg-[#022055]">
                  <span>Resources</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
                <div className="absolute top-full left-0 w-64 bg-[#1a2227] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2 flex flex-col">
                    {['Documentation', 'API Reference', 'Support', 'Community'].map((item) => (
                      <a key={item} href="#" className="block px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-200 hover:text-slate-900 transition-colors">
                        {item}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="h-8 w-8 rounded-full flex items-center justify-center overflow-hidden border-2 border-blue-300 bg-slate-200">
              <User className="h-5 w-5 text-slate-500" />
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-white text-xs font-medium">Sachin</span>
            </div>
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
          <Route path="/agent-marketplace" element={<AgentMarketplace />} />
          <Route path="/agent-detail/:agentId" element={<AgentDetail />} />
        </Routes>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 text-center md:text-left">&copy; 2026 Kurate AI. All rights reserved.</p>
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
