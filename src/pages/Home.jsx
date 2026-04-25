import React from 'react';
import { useNavigate } from 'react-router-dom';

const agents = [
  {
    id: 'incident-triage',
    title: 'Intelligent Incident Triage',
    category: 'Observability',
    description: 'Any new incident/failure occurring in a repo, pipeline or cluster would be cross-referenced with previous logs of such incidents/failures. An alert, RCA and recommended solution would be provided by the agent.',
    path: '/incident-triage',
    disabled: false,
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'user-access',
    title: 'User Access Management',
    category: 'Operations',
    description: 'Human-in-the-loop solution where an access request is approved or rejected based on user profiles and what resources are requested.',
    path: '/user-access',
    disabled: false,
    imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600'
  },
  {
    id: 'bug-report',
    title: 'Bug Report/Log RCA',
    category: 'Productivity',
    description: 'Any bug reports or logs (image/text) can be inputted to generate a summary, RCA and possible solutions/impacts.',
    path: '/bug-report',
    disabled: false,
    imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=600'
  }
];

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full flex justify-center py-16 px-4 sm:px-8 bg-white">
      <div className="w-full max-w-6xl flex flex-col items-start font-sans">
        
        {/* Typo Section */}
        <div className="mb-4 w-full">
          <h2 className="text-[2.75rem] leading-tight font-serif font-bold text-[#1e293b] mb-6">
            Smart Automated Generative Engine
          </h2>
          
          <p className="text-[#475569] text-[15px] sm:text-[17px] leading-[1.8] text-justify md:text-left w-full max-w-[95%]">
            This Agentic AI Platform is a next-generation framework designed to build, deploy, and orchestrate intelligent agents that think, act, and collaborate autonomously to solve complex real-world tasks. By combining the power of large language models, specialized tools, and structured reasoning, the platform enables seamless coordination between multiple agents and systems—paving the way for fully automated workflows and intelligent decision-making at scale.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-10">
          {agents.map((agent) => (
            <div 
              key={agent.id}
              className="bg-white border border-slate-200 hover:shadow-lg transition-shadow flex flex-col cursor-pointer group rounded-none"
              onClick={() => !agent.disabled && navigate(agent.path)}
            >
              <div className="w-full h-[220px] overflow-hidden">
                <img 
                  src={agent.imageUrl} 
                  alt={agent.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
              </div>
              <div className="p-6 sm:p-8 flex flex-col flex-grow">
                <h4 className="text-[#6B46FF] text-xs font-semibold uppercase tracking-wider mb-5">
                  {agent.category}
                </h4>
                
                <div className="flex items-start mb-4">
                  <div className="w-[4px] min-h-[1.5rem] bg-[#00E5CC] mr-3 mt-1.5 flex-shrink-0"></div>
                  <h3 className="text-[22px] font-bold text-[#1e293b] leading-tight">
                    {agent.title}
                  </h3>
                </div>
                
                <p className="text-[#475569] text-[16px] leading-relaxed mb-10 flex-grow mt-2">
                  {agent.description}
                </p>
                
                <div className="mt-auto">
                  <span 
                    className={`font-semibold text-sm flex items-center transition-colors ${
                      agent.disabled 
                        ? 'text-slate-400'
                        : 'text-[#00338D] group-hover:text-[#181180]'
                    }`}
                  >
                    Read more <span className="ml-[6px] text-[16px] leading-none mb-0.5 font-bold">&rsaquo;</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Home;
