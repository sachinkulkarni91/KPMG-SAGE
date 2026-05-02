import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Zap, Users, BarChart3, ExternalLink, Package, Grid3x3, Cloud, Lock, BarChart2, AlertCircle, Clock } from 'lucide-react';
import {
  FaJira,
  FaMicrosoft,
  FaSlack,
  FaAws,
  FaPython,
  FaGoogle,
  FaGithub,
  FaGitlab,
  FaSalesforce,
  FaDocker,
  FaNode
} from 'react-icons/fa';

// Platform branding with official colors and logos
const platformBranding = {
  'ServiceNow': { 
    color: '#18A957', 
    logo: 'servicenow',
    description: 'IT Service Management',
    gradient: 'from-green-50 to-green-100'
  },
  'Jira': { 
    color: '#0052CC', 
    logo: 'jira',
    description: 'Issue Tracking',
    gradient: 'from-blue-50 to-blue-100'
  },
  'Azure DevOps': { 
    color: '#0078D4', 
    logo: 'microsoft',
    description: 'DevOps Platform',
    gradient: 'from-sky-50 to-sky-100'
  },
  'Slack': { 
    color: '#E01E5A', 
    logo: 'slack',
    description: 'Team Communication',
    gradient: 'from-pink-50 to-pink-100'
  },
  'Microsoft Teams': { 
    color: '#6264A7', 
    logo: 'microsoft',
    description: 'Team Collaboration',
    gradient: 'from-purple-50 to-purple-100'
  },
  'PagerDuty': { 
    color: '#064620', 
    logo: 'alert',
    description: 'Incident Response',
    gradient: 'from-emerald-50 to-emerald-100'
  },
  'Splunk': { 
    color: '#000000', 
    logo: 'chart',
    description: 'Data Analytics',
    gradient: 'from-gray-50 to-gray-100'
  },
  'Datadog': { 
    color: '#632CA6', 
    logo: 'chart2',
    description: 'Monitoring',
    gradient: 'from-violet-50 to-violet-100'
  },
  'Active Directory': { 
    color: '#0078D4', 
    logo: 'lock',
    description: 'Identity Management',
    gradient: 'from-sky-50 to-sky-100'
  },
  'Okta': { 
    color: '#007DC1', 
    logo: 'lock',
    description: 'Identity Platform',
    gradient: 'from-sky-50 to-sky-100'
  },
  'Azure AD': { 
    color: '#0078D4', 
    logo: 'microsoft',
    description: 'Cloud Identity',
    gradient: 'from-sky-50 to-sky-100'
  },
  'Salesforce': { 
    color: '#00A1E0', 
    logo: 'salesforce',
    description: 'CRM',
    gradient: 'from-cyan-50 to-cyan-100'
  },
  'SAP': { 
    color: '#009999', 
    logo: 'package',
    description: 'Enterprise Software',
    gradient: 'from-teal-50 to-teal-100'
  },
  'Workday': { 
    color: '#0071C5', 
    logo: 'aws',
    description: 'HR Management',
    gradient: 'from-blue-50 to-blue-100'
  },
  'GitHub': { 
    color: '#24292e', 
    logo: 'github',
    description: 'Code Repository',
    gradient: 'from-gray-50 to-gray-100'
  },
  'GitLab': { 
    color: '#FC6D26', 
    logo: 'gitlab',
    description: 'DevOps Platform',
    gradient: 'from-orange-50 to-orange-100'
  },
  'Sentry': { 
    color: '#362D59', 
    logo: 'alert',
    description: 'Error Tracking',
    gradient: 'from-slate-50 to-slate-100'
  },
  'Azure Repos': { 
    color: '#0078D4', 
    logo: 'microsoft',
    description: 'Code Repository',
    gradient: 'from-sky-50 to-sky-100'
  },
  'New Relic': { 
    color: '#005571', 
    logo: 'chart2',
    description: 'Application Monitoring',
    gradient: 'from-teal-50 to-teal-100'
  },
  'ELK Stack': { 
    color: '#005571', 
    logo: 'docker',
    description: 'Log Management',
    gradient: 'from-blue-50 to-blue-100'
  },
  'Monday.com': { 
    color: '#5B5BFF', 
    logo: 'grid',
    description: 'Work OS',
    gradient: 'from-indigo-50 to-indigo-100'
  },
  'Asana': { 
    color: '#635DFF', 
    logo: 'grid',
    description: 'Project Management',
    gradient: 'from-indigo-50 to-indigo-100'
  },
  'Harvest': { 
    color: '#DC5034', 
    logo: 'clock',
    description: 'Time Tracking',
    gradient: 'from-red-50 to-red-100'
  },
  'Toggl': { 
    color: '#D83C0B', 
    logo: 'clock',
    description: 'Time Tracking',
    gradient: 'from-orange-50 to-orange-100'
  },
  'Clockify': { 
    color: '#003DA5', 
    logo: 'clock',
    description: 'Time Tracking',
    gradient: 'from-blue-50 to-blue-100'
  },
  'Google Workspace': { 
    color: '#4285F4', 
    logo: 'google',
    description: 'Productivity Suite',
    gradient: 'from-blue-50 to-blue-100'
  },
  'Selenium': { 
    color: '#00B139', 
    logo: 'node',
    description: 'Test Automation',
    gradient: 'from-green-50 to-green-100'
  },
  'Cypress': { 
    color: '#17202C', 
    logo: 'node',
    description: 'E2E Testing',
    gradient: 'from-gray-50 to-gray-100'
  },
  'Playwright': { 
    color: '#2EAD33', 
    logo: 'node',
    description: 'Browser Automation',
    gradient: 'from-green-50 to-green-100'
  },
  'Jest': { 
    color: '#C21325', 
    logo: 'node',
    description: 'Unit Testing',
    gradient: 'from-red-50 to-red-100'
  },
  'TestNG': { 
    color: '#E74C3C', 
    logo: 'node',
    description: 'Testing Framework',
    gradient: 'from-red-50 to-red-100'
  },
  'Pytest': { 
    color: '#0A9FDD', 
    logo: 'python',
    description: 'Python Testing',
    gradient: 'from-blue-50 to-blue-100'
  },
  'CI/CD Tools': { 
    color: '#FF6B35', 
    logo: 'docker',
    description: 'Continuous Integration',
    gradient: 'from-orange-50 to-orange-100'
  },
  'Archer': { 
    color: '#1C3F72', 
    logo: 'aws',
    description: 'GRC Platform',
    gradient: 'from-blue-50 to-blue-100'
  },
  'Workiva': { 
    color: '#003768', 
    logo: 'chart',
    description: 'Reporting Platform',
    gradient: 'from-blue-50 to-blue-100'
  },
  'AuditBoard': { 
    color: '#0066CC', 
    logo: 'check',
    description: 'Audit Management',
    gradient: 'from-blue-50 to-blue-100'
  },
  'RSA Archer': { 
    color: '#1C3F72', 
    logo: 'lock',
    description: 'GRC Platform',
    gradient: 'from-blue-50 to-blue-100'
  },
  'Tableau': { 
    color: '#E97627', 
    logo: 'chart',
    description: 'Data Visualization',
    gradient: 'from-orange-50 to-orange-100'
  }
};

// Function to render the appropriate logo
const renderLogo = (logoType) => {
  const iconProps = { size: 40 };
  
  switch(logoType) {
    case 'servicenow':
      return <Package {...iconProps} />;
    case 'jira':
      return <FaJira {...iconProps} />;
    case 'microsoft':
      return <FaMicrosoft {...iconProps} />;
    case 'slack':
      return <FaSlack {...iconProps} />;
    case 'salesforce':
      return <FaSalesforce {...iconProps} />;
    case 'aws':
      return <FaAws {...iconProps} />;
    case 'google':
      return <FaGoogle {...iconProps} />;
    case 'github':
      return <FaGithub {...iconProps} />;
    case 'gitlab':
      return <FaGitlab {...iconProps} />;
    case 'python':
      return <FaPython {...iconProps} />;
    case 'docker':
      return <FaDocker {...iconProps} />;
    case 'node':
      return <FaNode {...iconProps} />;
    case 'alert':
      return <AlertCircle {...iconProps} />;
    case 'chart':
      return <BarChart2 {...iconProps} />;
    case 'chart2':
      return <BarChart3 {...iconProps} />;
    case 'lock':
      return <Lock {...iconProps} />;
    case 'package':
      return <Package {...iconProps} />;
    case 'grid':
      return <Grid3x3 {...iconProps} />;
    case 'clock':
      return <Clock {...iconProps} />;
    case 'check':
      return <Zap {...iconProps} />;
    default:
      return <Cloud {...iconProps} />;
  }
};

const agentDetails = {
  'incident-triage': {
    title: 'Incident Triage Agent',
    subtitle: 'Intelligent Incident Prioritization & Analysis',
    description: 'Automatically categorizes and prioritizes incoming support incidents based on historical data and patterns.',
    integrations: ['ServiceNow', 'Jira', 'Azure DevOps', 'Slack', 'Microsoft Teams', 'PagerDuty', 'Splunk', 'Datadog'],
    testimonials: [
      {
        name: 'Sarah Johnson',
        role: 'Operations Manager',
        company: 'TechCorp Inc.',
        text: 'The Incident Triage Agent has reduced our incident response time by 40%. Highly recommended!',
        rating: 5
      },
      {
        name: 'Michael Chen',
        role: 'Support Director',
        company: 'CloudFirst Ltd.',
        text: 'Excellent accuracy in categorizing incidents. Our team productivity has improved significantly.',
        rating: 5
      },
      {
        name: 'Elena Rodriguez',
        role: 'IT Manager',
        company: 'Digital Solutions',
        text: 'Easy to integrate and provides actionable insights. Great value for money.',
        rating: 4
      }
    ],
    features: [
      'Real-time incident categorization',
      'Severity level assessment',
      'Historical pattern matching',
      'Auto-escalation capabilities',
      'Custom threshold configuration',
      'Multi-source incident ingestion'
    ]
  },
  'user-access': {
    title: 'User Access Agent',
    subtitle: 'Access Management & Compliance',
    description: 'Manages user access requests, approvals, and permissions seamlessly and securely.',
    integrations: ['Active Directory', 'Okta', 'Azure AD', 'Salesforce', 'SAP', 'Workday', 'Slack', 'ServiceNow'],
    testimonials: [
      {
        name: 'David Park',
        role: 'Security Officer',
        company: 'FinanceSecure Ltd.',
        text: 'Outstanding compliance tracking and audit capabilities. A must-have for regulated industries.',
        rating: 5
      },
      {
        name: 'Lisa Thompson',
        role: 'HR Manager',
        company: 'People First Corp.',
        text: 'Streamlined our access request process dramatically. Employee satisfaction is up.',
        rating: 5
      },
      {
        name: 'James Wilson',
        role: 'IT Director',
        company: 'Enterprise Systems',
        text: 'Excellent security posture and flexibility. Highly configurable for our needs.',
        rating: 5
      }
    ],
    features: [
      'Role-based access control',
      'Approval workflows',
      'Compliance reporting',
      'Multi-factor authentication integration',
      'Access lifecycle management',
      'Audit trail tracking'
    ]
  },
  'bug-report': {
    title: 'Bug Report Agent',
    subtitle: 'Root Cause Analysis & Debugging',
    description: 'AI-driven debugging assistant that reduces investigation time and automates error diagnostics.',
    integrations: ['GitHub', 'GitLab', 'Jira', 'Azure Repos', 'Sentry', 'Datadog', 'New Relic', 'ELK Stack'],
    testimonials: [
      {
        name: 'Alex Kumar',
        role: 'Engineering Lead',
        company: 'DevOps Masters',
        text: 'Saves hours on debugging each week. The RCA insights are incredibly accurate.',
        rating: 5
      },
      {
        name: 'Rebecca Stone',
        role: 'QA Manager',
        company: 'Quality Assurance Plus',
        text: 'Automatically identifies root causes. Our SREs love it.',
        rating: 4
      },
      {
        name: 'Marcus Lee',
        role: 'CTO',
        company: 'Tech Innovations',
        text: 'Best investment in our debugging workflow. Highly recommend to any dev team.',
        rating: 5
      }
    ],
    features: [
      'Automated error analysis',
      'Stack trace correlation',
      'Root cause identification',
      'Log aggregation',
      'Performance metrics',
      'Historical bug pattern matching'
    ]
  },
  'time-tracking': {
    title: 'Time Tracking Assistant Agent',
    subtitle: 'Time & Resource Management',
    description: 'Helps users log time, validates entries, and flags anomalies for better resource planning.',
    integrations: ['Jira', 'Monday.com', 'Asana', 'Harvest', 'Toggl', 'Clockify', 'Slack', 'Google Workspace'],
    testimonials: [
      {
        name: 'Patricia Martinez',
        role: 'Project Manager',
        company: 'Project Pro',
        text: 'Dramatically reduced time entry errors. Invaluable for billing accuracy.',
        rating: 5
      },
      {
        name: 'George Taylor',
        role: 'Finance Director',
        company: 'FinTech Solutions',
        text: 'Excellent anomaly detection. Helps catch billing issues early.',
        rating: 4
      }
    ],
    features: [
      'Automated time validation',
      'Anomaly detection',
      'Project allocation',
      'Billing integration',
      'Team insights',
      'Historical comparison'
    ]
  },
  'automated-testing': {
    title: 'Automated Testing Agent',
    subtitle: 'Smart Test Generation & Execution',
    description: 'Generates and executes test cases for scalable, smarter & automated testing.',
    integrations: ['Selenium', 'Cypress', 'Playwright', 'Jest', 'TestNG', 'Pytest', 'CI/CD Tools', 'Azure DevOps'],
    testimonials: [
      {
        name: 'Nina Patel',
        role: 'Test Automation Lead',
        company: 'QA Experts Inc.',
        text: 'Reduces test creation time by 60%. Quality significantly improved.',
        rating: 5
      },
      {
        name: 'Robert Chang',
        role: 'SDET',
        company: 'Innovation Labs',
        text: 'Intelligent test case generation. A game-changer for our team.',
        rating: 5
      }
    ],
    features: [
      'AI-powered test generation',
      'Coverage analysis',
      'Test optimization',
      'Flaky test detection',
      'Multi-platform support',
      'Regression test management'
    ]
  },
  'fetch-grc': {
    title: 'Fetch and Create GRC Issue',
    subtitle: 'Governance, Risk & Compliance',
    description: 'Connects security incidents to existing GRC issues or creates new ones automatically.',
    integrations: ['ServiceNow', 'Archer', 'Workiva', 'AuditBoard', 'RSA Archer', 'Tableau', 'Slack', 'Microsoft Teams'],
    testimonials: [
      {
        name: 'Victoria Chen',
        role: 'Compliance Officer',
        company: 'RegTech Corp.',
        text: 'Streamlined our GRC workflow. Compliance documentation is now effortless.',
        rating: 5
      },
      {
        name: 'Samuel Jackson',
        role: 'Risk Manager',
        company: 'Enterprise Risk Solutions',
        text: 'Excellent integration with our existing tools. Highly efficient.',
        rating: 5
      }
    ],
    features: [
      'Automated issue tracking',
      'Compliance correlation',
      'Risk scoring',
      'Audit trail generation',
      'Multi-source integration',
      'Real-time synchronization'
    ]
  }
};

const AgentDetail = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const agent = agentDetails[agentId] || agentDetails['incident-triage'];

  return (
    <div className="w-full bg-[#F4F7FB] min-h-screen">
      {/* Header */}
      <div className="bg-[#03307f] text-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => navigate('/agent-marketplace')}
            className="flex items-center gap-2 mb-6 text-blue-200 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Marketplace
          </button>
          <h1 className="text-4xl font-bold mb-2">{agent.title}</h1>
          <p className="text-blue-100 text-lg">{agent.subtitle}</p>
          <p className="text-blue-100 mt-4 max-w-3xl">{agent.description}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Features Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-[#1e293b] mb-8 flex items-center gap-2">
            <Zap className="h-8 w-8 text-[#0B3FBD]" />
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agent.features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="text-[#0B3FBD] font-semibold">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-[#1e293b] mb-8 flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-[#0B3FBD]" />
            Integrations
          </h2>
          <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {agent.integrations.map((platform, idx) => {
                const branding = platformBranding[platform];
                
                return (
                  <div
                    key={idx}
                    className={`group relative flex flex-col items-center justify-center p-6 bg-gradient-to-br ${branding?.gradient || 'from-slate-50 to-slate-100'} border border-slate-200 rounded-xl hover:border-[#0B3FBD] hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden`}
                  >
                    {/* Background gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center gap-3">
                      {/* Logo */}
                      <div
                        className="transition-all duration-300 group-hover:scale-110 flex items-center justify-center"
                        style={{
                          color: branding?.color || '#0B3FBD',
                        }}
                      >
                        {renderLogo(branding?.logo)}
                      </div>
                      
                      {/* Platform Name */}
                      <span className="text-slate-900 font-semibold text-center text-sm leading-tight">
                        {platform}
                      </span>
                      
                      {/* Description */}
                      <span className="text-slate-500 text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {branding?.description}
                      </span>
                      
                      {/* Color accent bar */}
                      <div
                        className="h-1 w-0 group-hover:w-8 transition-all duration-300 rounded-full"
                        style={{ backgroundColor: branding?.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div>
          <h2 className="text-3xl font-bold text-[#1e293b] mb-8 flex items-center gap-2">
            <Users className="h-8 w-8 text-[#0B3FBD]" />
            Customer Testimonials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agent.testimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  {[...Array(5 - testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-slate-300" />
                  ))}
                </div>
                <p className="text-slate-600 mb-4 text-sm leading-relaxed">"{testimonial.text}"</p>
                <div className="border-t border-slate-200 pt-4">
                  <p className="font-semibold text-slate-900">{testimonial.name}</p>
                  <p className="text-xs text-slate-500">{testimonial.role}</p>
                  <p className="text-xs text-slate-400">{testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-[#0B3FBD] to-[#0A45C4] rounded-lg p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="mb-6 text-blue-100">Explore this agent in the marketplace or execute it now.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate(`/watch-demo/${agentId}`)}
              className="inline-block px-8 py-3 bg-white text-[#0B3FBD] font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Watch Demo
            </button>
            <button
              onClick={() => navigate('/agent-marketplace')}
              className="inline-block px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-[#03307f] transition-colors"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDetail;
