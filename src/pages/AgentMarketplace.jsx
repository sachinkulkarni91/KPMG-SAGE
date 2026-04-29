import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const stableAccuracy = (seed) => {
  let hash = 0;
  const text = String(seed || '');

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 1000;
  }

  return String(76 + (hash % 20));
};

const agentsData = [
  {
    id: 'incident-triage',
    title: 'Incident Triage Agent',
    accuracy: stableAccuracy('incident-triage'),
    status: 'Live',
    description: 'Intelligent Incident Triage Agent: An agent integrated with your incidents portal that can summarize and analyze your incidents to give AI-recommended resolution steps.',
    category: 'Support'
  },
  {
    id: 'user-access',
    title: 'User Access Agent',
    accuracy: stableAccuracy('user-access'),
    status: 'Live',
    description: 'User Access Management Agent: An agent that connects with multiple databases to check user profiles, policies, permissions and give you a summary of user access requests, related risk and recommended action while cross-referencing historical access requests.',
    category: 'Security'
  },
  {
    id: 'bug-report',
    title: 'Bug Report Agent',
    accuracy: stableAccuracy('bug-report'),
    status: 'Live',
    description: 'he Bug RCA (Root Cause Analysis) Agent is an AI-driven debugging assistant designed to drastically reduce the time engineers spend investigating software failures. By autonomously ingesting system logs, application telemetry, and recent source code changes, the agent acts as an automated Site Reliability Engineer (SRE)—triaging and diagnosing errors the moment they occur.',
    category: 'Development'
  },
  {
    id: 'time-tracking',
    title: 'Time Tracking Assistant Agent',
    accuracy: stableAccuracy('time-tracking'),
    status: 'Coming Soon',
    description: 'Helps users log time, validates entries, and flags anomalies.',
    category: 'Productivity'
  },
  {
    id: 'automated-testing',
    title: 'Automated Testing Agent',
    accuracy: stableAccuracy('automated-testing'),
    status: 'Coming Soon',
    description: 'Test case generator for scalable, smarter & automated testing.',
    category: 'QA'
  },
  {
    id: 'fetch-grc',
    title: 'Fetch and Create GRC Issue',
    accuracy: stableAccuracy('fetch-grc'),
    status: 'Coming Soon',
    description: 'Connecting security incidents to existing GRC issues or creating new ones.',
    category: 'Security'
  }
];

const AgentMarketplace = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    industry: '',
    function: '',
    personas: ''
  });

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const handleApply = () => {
    // Apply filters logic
    console.log('Applying filters:', filters);
  };

  const handleReset = () => {
    setFilters({
      industry: '',
      function: '',
      personas: ''
    });
  };

  // Read URL query params and pre-populate filters
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const industry = params.get('industry') || '';
    const func = params.get('function') || '';
    const personas = params.get('personas') ? decodeURIComponent(params.get('personas')) : '';

    // Only update filters if any query param present
    if (industry || func || personas) {
      setFilters({
        industry,
        function: func,
        personas
      });
    }
  }, [location.search]);

  const filteredAgents = agentsData.filter(agent => {
    if (filters.industry && agent.category.toLowerCase() !== filters.industry.toLowerCase()) return false;
    
    
    // As we don't have function and personas in data, just do a basic text search in description for demonstration
    if (filters.function && !agent.description.toLowerCase().includes(filters.function.toLowerCase())) return false;
    if (filters.personas && !agent.description.toLowerCase().includes(filters.personas.toLowerCase())) return false;
    
    return true;
  });

  const liveAgents = filteredAgents.filter((agent) => agent.status === 'Live');
  const comingSoonAgents = filteredAgents.filter((agent) => agent.status === 'Coming Soon');

  const handleWatchDemo = (agent) => {
    console.log('Watch demo for:', agent.title);
  };

  const handleExploreAgent = (agent) => {
    navigate(`/agent-detail/${agent.id}`);
  };

  const handleExecuteAgent = (agentId) => {
    // Navigate to specific agent page
    if (agentId === 'incident-triage') {
      window.location.href = '/incident-triage';
    } else if (agentId === 'bug-report') {
      window.location.href = '/bug-report';
    } else if (agentId === 'user-access') {
      window.location.href = '/user-access';
    }
  };

  return (
    <div className="w-full">
      {/* Filter Section with Blue Background */}
      <div className="relative w-full overflow-hidden bg-[#0A45C4]">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1440 360"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="1440" height="360" fill="#0A45C4" />
          <polygon points="0,80 520,0 920,140 420,220" fill="#0E52E6" />
          <polygon points="900,0 1440,0 1440,200 1100,260" fill="#093BB2" />
          <polygon points="0,220 380,140 720,260 300,360 0,360" fill="#0C49D3" />
          <polygon points="620,180 1440,120 1440,360 740,360" fill="#073596" />
        </svg>

        <div className="relative z-10 px-6 py-6">
          <div className="max-w-6xl mx-auto">
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="w-[160px]">
                <select
                  value={filters.industry}
                  onChange={(e) => handleFilterChange('industry', e.target.value)}
                  className="w-full h-10 px-4 rounded-lg bg-white text-[13px] text-slate-700 font-medium focus:outline-none"
                >
                  <option value="">Select Industry</option>
                  <option value="support">Support</option>
                  <option value="security">Security</option>
                  <option value="development">Development</option>
                  <option value="productivity">Productivity</option>
                  <option value="qa">QA</option>
                </select>
              </div>

              <div className="w-[160px]">
                <select
                  value={filters.function}
                  onChange={(e) => handleFilterChange('function', e.target.value)}
                  className="w-full h-10 px-4 rounded-lg bg-white text-[13px] text-slate-700 font-medium focus:outline-none"
                >
                  <option value="">Select Function</option>
                  <option value="categorize">Categorize</option>
                  <option value="manage">Manage</option>
                  <option value="track">Track</option>
                  <option value="testing">Testing</option>
                </select>
              </div>

              <div className="w-[160px]">
                <select
                  value={filters.personas}
                  onChange={(e) => handleFilterChange('personas', e.target.value)}
                  className="w-full h-10 px-4 rounded-lg bg-white text-[13px] text-slate-700 font-medium focus:outline-none"
                >
                  <option value="">Select Personas</option>
                  <option value="user">User</option>
                  <option value="tester">Tester</option>
                  <option value="developer">Developer</option>
                </select>
              </div>

              

              <button
                onClick={handleApply}
                className="h-10 min-w-[110px] px-6 bg-[#0B3FBD] text-white text-[13px] font-semibold rounded-md shadow-sm"
              >
                Apply
              </button>

              <button
                onClick={handleReset}
                className="h-10 min-w-[110px] px-6 bg-[#0B3FBD] text-white text-[13px] font-semibold rounded-md shadow-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div className="w-full flex justify-center py-10 px-6 bg-white">
        <div className="w-full max-w-6xl">
          {liveAgents.length > 0 && (
            <>
              <h2 className="text-xl font-bold text-[#0B3FBD] mb-5">Live Agents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 mb-10">
                {liveAgents.map((agent) => (
                  <div 
                    key={agent.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col"
                  >
                    {/* Header with Title and Status Badge */}
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-[15px] font-bold text-[#0B3FBD] flex-1 leading-snug">
                        {agent.title}
                      </h3>
                      {agent.status && (
                        <span className="px-4 py-1 rounded-md text-[12px] font-semibold ml-3 whitespace-nowrap bg-green-600 text-white">
                          {agent.status}
                        </span>
                      )}
                    </div>

                    {/* Accuracy */}
                    <div className="text-[13px] font-semibold text-slate-800 mb-3">
                      Accuracy: {agent.accuracy ? `${agent.accuracy}%` : '%'}
                    </div>

                    {/* Description */}
                    <p className="text-slate-600 text-[12.5px] leading-relaxed mb-6 flex-grow">
                      {agent.description}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-nowrap gap-2">
                      <button
                        onClick={() => handleWatchDemo(agent)}
                        className="px-2.5 py-1.5 border border-[#0B3FBD] text-[#0B3FBD] font-semibold rounded text-[11px] bg-white whitespace-nowrap shrink-0"
                      >
                        ▶ Watch Demo
                      </button>
                      <button
                        onClick={() => handleExploreAgent(agent)}
                        className="px-2.5 py-1.5 bg-[#0B3FBD] text-white font-semibold rounded text-[11px] whitespace-nowrap shrink-0"
                      >
                        Explore Agent
                      </button>
                      <button
                        onClick={() => handleExecuteAgent(agent.id)}
                        className="px-2.5 py-1.5 bg-[#0B3FBD] text-white font-semibold rounded text-[11px] whitespace-nowrap shrink-0"
                      >
                        Execute Agent
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {comingSoonAgents.length > 0 && (
            <>
             
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {comingSoonAgents.map((agent) => (
                  <div 
                    key={agent.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col"
                  >
                    {/* Header with Title and Status Badge */}
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-[15px] font-bold text-[#0B3FBD] flex-1 leading-snug">
                        {agent.title}
                      </h3>
                      {agent.status && (
                        <span className="px-4 py-1 rounded-md text-[12px] font-semibold ml-3 whitespace-nowrap bg-amber-500 text-white">
                          {agent.status}
                        </span>
                      )}
                    </div>

                    {/* Accuracy */}
                    <div className="text-[13px] font-semibold text-slate-800 mb-3">
                      Accuracy: {agent.accuracy ? `${agent.accuracy}%` : '%'}
                    </div>

                    {/* Description */}
                    <p className="text-slate-600 text-[12.5px] leading-relaxed mb-6 flex-grow">
                      {agent.description}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-nowrap gap-2">
                      <button
                        onClick={() => handleWatchDemo(agent)}
                        className="px-2.5 py-1.5 border border-[#0B3FBD] text-[#0B3FBD] font-semibold rounded text-[11px] bg-white whitespace-nowrap shrink-0"
                      >
                        ▶ Watch Demo
                      </button>
                      <button
                        onClick={() => handleExploreAgent(agent)}
                        className="px-2.5 py-1.5 bg-[#0B3FBD] text-white font-semibold rounded text-[11px] whitespace-nowrap shrink-0"
                      >
                        Explore Agent
                      </button>
                      <button
                        disabled
                        className="px-2.5 py-1.5 bg-slate-300 text-slate-600 font-semibold rounded text-[11px] cursor-not-allowed whitespace-nowrap shrink-0"
                      >
                        Coming Soon
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentMarketplace;
