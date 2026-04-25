import React, { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  ChevronRight,
  Home,
  LifeBuoy,
  Settings,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const menuItems = [
  { label: 'Home', icon: Home, active: false, path: '/' },
  { label: 'Intelligent Incident Triage', icon: Sparkles, active: true, path: '/incident-triage' },
  { label: 'User Access Management', icon: UserRound, active: false, path: '/user-access' },
  { label: 'Bug Logs Summary & RCA', icon: AlertTriangle, active: false, path: '/bug-report' },
  { label: 'Settings', icon: Settings, active: false, path: null },
];

const tabs = ['AI RCA', 'Evidence', 'Recommendations', 'Timeline', 'Similar Incidents', 'Activity'];

const IncidentTriage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('AI RCA');

  return (
    <div className="w-full bg-[#f5f7fb] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1450px] gap-5 lg:grid-cols-[256px_minmax(0,1fr)]">
        <aside className="border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="space-y-1 px-4 pb-4 pt-3">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => item.path && navigate(item.path)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-[15px] transition ${
                    item.active
                      ? 'border-indigo-100 bg-[#eef2ff] font-medium text-[#3b4fd1] shadow-sm'
                      : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center ${item.active ? 'text-[#5b4cf2]' : 'text-slate-500'}`}>
                    <Icon className="h-[17px] w-[17px]" />
                  </span>
                  <span className="leading-[1.35]">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-200 px-4 pb-4 pt-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Support</p>
            <div className="space-y-3">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border border-indigo-100 bg-[#eef2ff] px-3 py-3 text-left text-sm font-semibold text-[#3b4fd1] shadow-sm"
              >
                <span className="flex h-5 w-5 items-center justify-center text-[#5b4cf2]">
                  <Bot className="h-4 w-4" />
                </span>
                <span>Assist AI</span>
                <span className="ml-auto rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-[#7281e6]">beta</span>
              </button>

              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-3 text-left text-sm text-slate-600 transition hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800"
              >
                <span className="flex h-5 w-5 items-center justify-center text-slate-500">
                  <LifeBuoy className="h-4 w-4" />
                </span>
                <span>Help & Support</span>
              </button>
            </div>
          </div>
        </aside>

        <section className="min-w-0 border border-slate-200 bg-white px-4 pb-6 pt-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:px-5">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-6 sm:py-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6d38f5] text-white shadow-[0_8px_20px_rgba(109,56,245,0.2)]">
                <Bot className="h-6 w-6" />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="flex items-center gap-2 text-[23px] font-semibold leading-tight text-slate-900 sm:text-[27px]">
                  <span>AI Analysis Complete</span>
                  <span className="text-[18px] text-slate-900">✦</span>
                </h2>
                <p className="mt-1 text-[14px] leading-6 text-slate-600 sm:text-[15px]">
                  Our AI engine analyzed 12,842 log lines, 8 related services and 23 similar incidents to generate this report.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[15px] font-semibold text-slate-900">AI Confidence Score</p>

              <div className="mt-2 flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-3">
                <div className="flex items-end gap-3">
                  <span className="text-[38px] font-semibold leading-none tracking-tight text-slate-900">92%</span>
                  <span className="mb-2 hidden h-2 w-2 rounded-full bg-[#7c3aed] xl:block" />
                </div>

                <div className="flex-1">
                  <div className="h-3 rounded-full bg-slate-100">
                    <div className="h-full w-[92%] rounded-full bg-[#7c3aed]" />
                  </div>
                </div>

                <span className="inline-flex w-fit rounded-full bg-emerald-100 px-3 py-1.5 text-[13px] font-semibold text-emerald-700">
                  High Confidence
                </span>
              </div>

              <div className="mt-6 flex h-[86px] items-start">
                <div className="flex h-[74px] w-[74px] items-center justify-center rounded-full border-[3px] border-slate-200 text-slate-700">
                  <Bot className="h-9 w-9" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-6 border-b border-slate-200 px-1 pb-2 text-[15px] font-medium text-slate-500">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 pb-1 transition ${
                  activeTab === tab ? 'text-slate-700' : 'hover:text-slate-800'
                }`}
              >
                {tab === 'AI RCA' ? <Sparkles className="h-3.5 w-3.5" /> : null}
                <span>{tab}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-6 sm:py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-[24px] font-semibold leading-tight text-slate-900 sm:text-[26px]">Probable Root Cause</h3>

              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">AI Generated</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-[13px] font-semibold text-emerald-700">
                  92% Confidence
                </span>
              </div>
            </div>

            <h4 className="mt-3 text-[27px] font-semibold leading-tight text-slate-900 sm:text-[31px]">
              Redis server memory exhaustion (98% utilization)
            </h4>

            <p className="mt-3 max-w-[860px] text-[16px] leading-7 text-slate-600 sm:text-[17px]">
              Redis connection is intermittently dropping causing cache misses and application errors. This is affecting the production
              environment with multiple users reporting issues.
            </p>

          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-slate-500">Evidence</p>
                <p className="mt-1 text-[15px] text-slate-600">Log excerpts, service signals and correlated alerts continue below the fold.</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default IncidentTriage;
