import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, PlayCircle, Download, User } from 'lucide-react';

const demoData = {
  'incident-triage': {
    title: 'Intelligent Incident Triage',
    oneLiner: 'Leverage real-time incident analysis to bridge the gap between detection and resolution with AI-driven recommendations.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    badge: 'SLM',
    confidence: 93,
    features: [
      'Direct Portal Integration: Seamlessly connects with your existing incident management systems for real-time monitoring.',
      'Contextual Analysis: Automatically summarizes complex incident logs to identify core issues instantly.',
      'AI-Recommended Resolution: Provides data-backed steps for remediation based on historical patterns and system state.',
      'Triage Prioritization: Dynamically ranks incidents by severity and business impact to optimize team focus.'
    ],
    testimonial: {
      text: "The Intelligent Incident Triage Agent has eliminated the 'analysis paralysis' our team used to face during major outages. We no longer spend the first thirty minutes just trying to understand what went wrong—the AI tells us immediately and gives us a roadmap to fix it.",
      author: "Director of Service Delivery",
      company: "Leading IT Services Company",
      rating: 5
    }
  },
  'user-access': {
    title: 'Identity & Access Intelligence',
    oneLiner: 'Automate complex access request reviews by cross-referencing multi-database permissions and historical risk profiles.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    badge: 'LLM',
    confidence: 96,
    features: [
      'Multi-Database Synthesis: Aggregates user profiles, local policies, and global permissions into a single view.',
      'Risk-Based Auditing: Flags high-risk requests by comparing them against historical access patterns and security basicals.',
      'Automated Policy Cross-Referencing: Validates requests against corporate compliance standards in milliseconds.',
      'Actionable Summaries: Delivers a clear "Approve/Deny" recommendation with a summarized justification for auditors.'
    ],
    testimonial: {
      text: "Managing thousands of access requests across various cloud and on-prem databases was a massive security bottleneck. This agent has transformed our UAM process, providing a level of risk oversight that was simply impossible to achieve manually.",
      author: "CISO",
      company: "Leading Indian Bank",
      rating: 5
    }
  },
  'bug-rca': {
    title: 'Automated Bug RCA & Diagnostics',
    oneLiner: 'Reduce Mean Time to Repair (MTTR) with an AI-driven SRE that diagnoses software failures the moment they occur.',
    videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    badge: 'SLM',
    confidence: 91,
    features: [
      'Autonomous Log Ingestion: Continuously monitors system logs and application telemetry for anomaly detection.',
      'Code-Level Correlation: Traces errors back to recent source code changes and commits to pinpoint the "why."',
      'Automated SRE Workflows: Triages and diagnoses errors without human intervention, acting as a first-line responder.',
      'Telemetry-Driven Insights: Provides high-fidelity reports on failure modes to prevent recurring technical debt.'
    ],
    testimonial: {
      text: "This agent is like having a Senior SRE working 24/7. It connects the dots between a spike in latency and a specific code deployment within seconds, saving our engineering team hours of manual log-diving every single week.",
      author: "Head of Engineering",
      company: "Leading E-commerce Company",
      rating: 5
    }
  }
};

const WatchDemo = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const data = demoData[agentId] || demoData['incident-triage'];

  return (
    <div className="w-full bg-[#F4F7FB] min-h-screen pb-16">
      {/* Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <button
          onClick={() => navigate('/agent-marketplace')}
          className="flex items-center gap-2 mb-6 text-slate-500 hover:text-[#03307f] transition-colors font-medium text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (Main Content) */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold text-[#1e293b]">{data.title}</h1>
            <p className="text-slate-600 mt-3 text-lg leading-relaxed">
              {data.oneLiner}
            </p>
            
            <div className="mt-4">
              <span className="bg-[#2EAD33] text-white px-4 py-1.5 rounded text-xs font-bold tracking-wide uppercase shadow-sm">
                {data.badge}
              </span>
            </div>

            {/* Video Player */}
            <div className="w-full aspect-video bg-black rounded-xl mt-8 overflow-hidden shadow-lg border border-slate-200">
              <video 
                src={data.videoUrl} 
                className="w-full h-full object-contain bg-black" 
                controls 
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Feature Breakdown */}
            <div className="mt-10">
              <h3 className="text-xl font-bold text-[#1e293b] mb-4">Feature Breakdown</h3>
              <ul className="list-disc pl-5 space-y-3 text-slate-600 text-sm">
                {data.features.map((feature, idx) => {
                  const [boldPart, restPart] = feature.split(': ');
                  return (
                    <li key={idx} className="pl-1">
                      {restPart ? (
                        <>
                          <strong className="text-slate-800">{boldPart}:</strong> {restPart}
                        </>
                      ) : (
                        feature
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="lg:col-span-1 space-y-6 mt-2 lg:mt-0 pt-[4.5rem]">
            
            {/* Confidence Meter Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Confidence Meter</h3>
              <p className="text-xs text-slate-500 mb-3">Accuracy: {data.confidence}%</p>
              
              <div className="w-full bg-slate-200 rounded-full h-2.5 mb-6">
                <div 
                  className="bg-[#2EAD33] h-2.5 rounded-full" 
                  style={{ width: `${data.confidence}%` }}
                ></div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 bg-[#03307f] hover:bg-[#022055] text-white py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-sm">
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>

            {/* Testimonial Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#1e293b] mb-4">Client Testimonial</h3>
              
              <div className="flex items-center gap-1 mb-4">
                {[...Array(data.testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              <p className="text-slate-600 text-sm italic mb-6 leading-relaxed">
                "{data.testimonial.text}"
              </p>
              
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center border border-slate-300">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{data.testimonial.author}</p>
                  <p className="text-xs text-slate-500">{data.testimonial.company}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchDemo;
