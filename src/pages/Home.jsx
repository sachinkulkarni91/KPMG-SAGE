import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, MessageSquare } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleActionClick = (path) => {
    if (path === 'marketplace') {
      navigate('/agent-marketplace');
    } else {
      navigate(path);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Search functionality can be implemented here
  };

  return (
    <div className="w-full relative min-h-[calc(100vh-64px)]">
       {/* Hero Section with Geometric Background */}
       <div className="absolute inset-0 overflow-hidden bg-[#0A45C4]">
         <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 720"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
         >
        <rect width="1440" height="720" fill="#0A45C4" />
        <polygon points="0,140 520,0 980,200 460,360" fill="#0E52E6" />
        <polygon points="540,0 900,0 720,200 360,200" fill="#0B3FBD" />
        <polygon points="920,0 1440,0 1440,300 1120,420" fill="#093BB2" />
        <polygon points="0,420 420,260 760,520 300,720 0,720" fill="#0C49D3" />
        <polygon points="640,360 1440,240 1440,720 720,720" fill="#073596" />
        <polygon points="320,520 860,420 1180,640 520,720" fill="#0D56EE" />
         </svg>
       </div>

      {/* Content */}
      <div className="relative z-10 w-full h-full min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-10 max-w-5xl mx-auto">
        
        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[32px] font-bold text-white mb-6 tracking-wide whitespace-nowrap drop-shadow-md flex items-center justify-center gap-3">
          Curate <span className="font-medium opacity-90">|</span> Collaborate <span className="font-medium opacity-90">|</span> Transform
        </h1>
        
        {/* Tagline */}
        <p className="text-base sm:text-[15px] text-white font-medium mb-12 drop-shadow-sm">
          Leveraging AI Agents to Enhance Your Platform Experience
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full max-w-4xl mb-10 z-10 relative">
          <div className="relative flex items-center bg-white rounded-full shadow-lg overflow-hidden h-12 sm:h-14 px-4">
            <Sparkles size={25} className="text-[#0033E6] mr-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask Now Assist for help or search"
              className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 font-medium focus:outline-none text-base sm:text-[17px] h-full"
            />
            <button
              type="submit"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center mr-1"
            >
              <Send size={20} className="text-gray-400" />
            </button>
          </div>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full max-w-3xl z-10 relative">
          <button
            type="button"
            onClick={() => handleActionClick('/incident-triage')}
            className="px-5 py-2.5 min-w-[150px] bg-white text-[#0033E6] font-semibold rounded-md hover:bg-blue-50 transition-colors shadow-md text-sm"
          >
            Start Assessment
          </button>
          <button
            type="button"
            onClick={() => handleActionClick('marketplace')}
            className="px-5 py-2.5 min-w-[150px] bg-white text-[#0033E6] font-semibold rounded-md hover:bg-blue-50 transition-colors shadow-md text-sm"
          >
            Suggest Agent
          </button>
          <button
            type="button"
            onClick={() => handleActionClick('marketplace')}
            className="px-5 py-2.5 min-w-[150px] bg-white text-[#0033E6] font-semibold rounded-md hover:bg-blue-50 transition-colors shadow-md text-sm"
          >
            View All Agents
          </button>
        </div>
      </div>

      {/* Floating Chat Icon */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-[#A5A0DC] to-[#938DCD] rounded-full shadow-2xl flex items-center justify-center border-[3px] border-white/20 hover:scale-105 transition-transform z-50">
        <MessageSquare size={26} className="text-white fill-white mt-1 mr-0.5" />
      </button>
    </div>
  );
};

export default Home;
