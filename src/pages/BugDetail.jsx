import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bot,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileText,
  Home,
  LifeBuoy,
  Loader2,
  MessageSquare,
  RefreshCw,
  Send,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';

const BUG_RCA_API_BASE =
  (import.meta.env?.VITE_BUG_RCA_API_URL || 'https://appmanager-dev.up.railway.app').replace(/\/$/, '');

/* ─── Helpers shared with BugReport ─── */
const firstValue = (...values) =>
  values.find((v) => v !== undefined && v !== null && v !== '');

const deriveSeverity = (message) => {
  const text = String(message || '').toLowerCase();
  if (/deadlock|out of memory|fatal|database.*down|connection.*lost/.test(text)) return 'Critical';
  if (/timeout|unavailable|exception|cache/.test(text)) return 'High';
  if (/validation|not found|expired|rate limit/.test(text)) return 'Medium';
  return 'Low';
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
};

const extractLogsArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.value)) return payload.value;
  if (Array.isArray(payload?.logs)) return payload.logs;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const menuItems = [
  { label: 'Home', icon: Home, path: '/', active: false },
  { label: 'Intelligent Incident Triage', icon: Sparkles, path: '/incident-triage', active: false },
  { label: 'User Access Management', icon: UserRound, path: '/user-access', active: false },
  { label: 'Bug Logs Summary & RCA', icon: AlertTriangle, path: '/bug-report', active: true },
  { label: 'Settings', icon: Settings, path: null, active: false },
];

const severityTone = (value) => {
  const key = String(value || '').toLowerCase();
  if (key.includes('critical')) return 'bg-rose-100 text-rose-700 border-rose-200';
  if (key.includes('high')) return 'bg-rose-100 text-rose-600 border-rose-200';
  if (key.includes('medium')) return 'bg-amber-100 text-amber-600 border-amber-200';
  return 'bg-emerald-100 text-emerald-600 border-emerald-200';
};

/* ─── Tiny sparkline SVGs used in Evidence cards ─── */
const SparklineDown = () => (
  <svg width="48" height="28" viewBox="0 0 48 28" fill="none" className="ml-auto">
    <polyline points="2,8 10,4 18,12 26,6 34,18 42,14 46,22" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="46" cy="22" r="2.5" fill="#7c3aed" />
  </svg>
);
const SparklineBars = () => (
  <svg width="48" height="28" viewBox="0 0 48 28" fill="none" className="ml-auto">
    {[4, 12, 8, 20, 14, 24, 18, 26].map((h, i) => (
      <rect key={i} x={2 + i * 5.5} y={28 - h} width="4" rx="1" height={h} fill={i === 7 ? '#e11d48' : '#fda4af'} />
    ))}
  </svg>
);
const SparklineWave = () => (
  <svg width="48" height="28" viewBox="0 0 48 28" fill="none" className="ml-auto">
    <polyline points="2,22 8,18 14,20 20,10 26,14 32,6 38,10 44,4 46,8" stroke="#0d9488" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="46" cy="8" r="2.5" fill="#0d9488" />
  </svg>
);

export default function BugDetail() {
  const { bugId } = useParams();
  const navigate = useNavigate();

  /* ─── Core state ─── */
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [copying, setCopying] = useState(false);
  const [activeTab, setActiveTab] = useState('rca');
  const [errorMsg, setErrorMsg] = useState('');

  /* ─── Data from backend ─── */
  const [rawLogs, setRawLogs] = useState([]);            // the dataset logs for this bug
  const [matchedLog, setMatchedLog] = useState(null);     // the specific log entry matching bugId
  const [rcaResult, setRcaResult] = useState(null);       // RCAResponse from POST /bug-rca/analyze
  const [allDatasetLogs, setAllDatasetLogs] = useState([]); // all logs from the matched dataset

  /* ─── Ask-AI chat ─── */
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatInputRef = useRef(null);

  /* ─── Analysis timeline tracking ─── */
  const [analysisTimeline, setAnalysisTimeline] = useState([]);
  const [analysisStartTime, setAnalysisStartTime] = useState(null);

  const addTimelineStep = useCallback((event) => {
    setAnalysisStartTime((start) => {
      const now = Date.now();
      const s = start || now;
      const elapsed = Math.round((now - s) / 1000);
      const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const secs = String(elapsed % 60).padStart(2, '0');
      setAnalysisTimeline((prev) => [...prev, { time: `${mins}:${secs}`, event }]);
      return s;
    });
  }, []);

  /* ═══════════════════════════════════════════════════════════
     STEP 1: Fetch datasets → find the matching dataset for this bug
     STEP 2: Fetch that dataset's logs
     STEP 3: Call POST /bug-rca/analyze with those logs
     ═══════════════════════════════════════════════════════════ */
  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        setAnalysisTimeline([]);
        setAnalysisStartTime(null);
        setRcaResult(null);
        setChatMessages([]);

        /* --- Step 1: Get all datasets --- */
        addTimelineStep('Fetching available datasets');
        const dsRes = await fetch(`${BUG_RCA_API_BASE}/bug-rca/datasets`, {
          signal: controller.signal,
        });
        if (!dsRes.ok) throw new Error(`Datasets API returned ${dsRes.status}`);
        const dsPayload = await dsRes.json();
        const datasets = Array.isArray(dsPayload?.datasets) ? dsPayload.datasets : [];

        if (!datasets.length) throw new Error('No datasets available from backend');
        addTimelineStep(`Found ${datasets.length} datasets`);

        /* --- Step 2: Find the matching dataset --- */
        // The bugId is in format BUG-XXXX where XXXX are the last 4 chars of request_id
        // We need to search each dataset for a log entry whose request_id ends with the suffix
        const bugSuffix = bugId.replace(/^BUG-/i, '').toLowerCase();
        let foundLog = null;
        let foundDatasetLogs = [];
        let foundDatasetName = '';

        addTimelineStep('Searching datasets for matching bug log');

        for (const ds of datasets) {
          try {
            const logRes = await fetch(
              `${BUG_RCA_API_BASE}/bug-rca/dataset/${encodeURIComponent(ds.id)}`,
              { signal: controller.signal }
            );
            if (!logRes.ok) continue;
            const logPayload = await logRes.json();
            const logs = extractLogsArray(logPayload);

            // Try to find the specific log matching this bugId
            const match = logs.find((log) => {
              const reqId = String(log.request_id || log.id || '');
              return reqId.slice(-4).toLowerCase() === bugSuffix;
            });

            if (match) {
              foundLog = match;
              foundDatasetLogs = logs;
              foundDatasetName = ds.name || ds.id;
              break;
            }
          } catch {
            // continue searching other datasets
          }
        }

        if (!foundLog) {
          // If no exact match found, use the first dataset and the first log
          addTimelineStep('No exact match — using first dataset');
          const firstDs = datasets[0];
          const logRes = await fetch(
            `${BUG_RCA_API_BASE}/bug-rca/dataset/${encodeURIComponent(firstDs.id)}`,
            { signal: controller.signal }
          );
          if (logRes.ok) {
            const logPayload = await logRes.json();
            foundDatasetLogs = extractLogsArray(logPayload);
            foundLog = foundDatasetLogs[0] || null;
            foundDatasetName = firstDs.name || firstDs.id;
          }
        }

        if (!foundLog || !foundDatasetLogs.length) {
          throw new Error('Could not find any log data for this bug');
        }

        setMatchedLog(foundLog);
        setAllDatasetLogs(foundDatasetLogs);
        setRawLogs(foundDatasetLogs);
        addTimelineStep(`Found bug in "${foundDatasetName}" (${foundDatasetLogs.length} logs)`);

        /* --- Step 3: Run RCA analysis via POST /analyze --- */
        addTimelineStep('Sending logs to AI for Root Cause Analysis');
        setAnalyzing(true);

        const analyzePayload = {
          logs: foundDatasetLogs.slice(0, 50), // API limit
          analysis_depth: 'detailed',
          focus_areas: null,
        };

        const rcaRes = await fetch(`${BUG_RCA_API_BASE}/bug-rca/detailed-analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(analyzePayload),
          signal: controller.signal,
        });

        if (!rcaRes.ok) throw new Error(`RCA analyze returned ${rcaRes.status}`);
        const rcaData = await rcaRes.json();
        setRcaResult(rcaData);
        addTimelineStep('AI RCA analysis complete');
        addTimelineStep('Generated recommendations');
      } catch (err) {
        if (err.name !== 'AbortError') {
          setErrorMsg(err.message || 'Failed to load bug details');
          addTimelineStep(`Error: ${err.message}`);
        }
      } finally {
        setLoading(false);
        setAnalyzing(false);
      }
    };

    run();
    return () => controller.abort();
  }, [bugId, addTimelineStep]);

  /* ─── Ask AI handler ─── */
  const handleAskAI = async (question) => {
    const q = question || chatInput.trim();
    if (!q || chatLoading) return;

    setChatMessages((prev) => [...prev, { role: 'user', content: q }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const logsForQuery = rawLogs.slice(0, 50);
      const payload = {
        logs: logsForQuery,
        analysis_depth: 'quick',
        focus_areas: q.split(',').map((s) => s.trim()).filter(Boolean),
      };

      const res = await fetch(`${BUG_RCA_API_BASE}/bug-rca/quick-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`AI response failed: ${res.status}`);
      const data = await res.json();

      const reply = [
        `**Root Cause:** ${data.analysis?.root_cause || 'N/A'}`,
        `**Severity:** ${data.analysis?.severity || 'N/A'}`,
        `**Business Impact:** ${data.analysis?.business_impact || 'N/A'}`,
        `**Confidence:** ${Math.round((data.analysis?.confidence_score || 0) * 100)}%`,
        '',
        `**Recommendations:**`,
        ...(data.analysis?.recommendations || []).map((r, i) => `${i + 1}. ${r}`),
        '',
        `_${data.analysis_summary || ''}_`,
      ].join('\n');

      setChatMessages((prev) => [...prev, { role: 'ai', content: reply }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'ai', content: 'Sorry, I encountered an error processing your question. Please try again.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  /* ─── Export report ─── */
  const handleExport = () => {
    if (!rcaResult) return;
    const blob = new Blob([JSON.stringify(rcaResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rca-report-${bugId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Refresh / re-analyze ─── */
  const handleReAnalyze = async () => {
    if (analyzing || !rawLogs.length) return;
    setAnalyzing(true);
    setErrorMsg('');
    addTimelineStep('Re-running AI analysis');

    try {
      const payload = {
        logs: rawLogs.slice(0, 50),
        analysis_depth: 'detailed',
        focus_areas: null,
      };

      const res = await fetch(`${BUG_RCA_API_BASE}/bug-rca/detailed-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Re-analyze failed: ${res.status}`);
      const data = await res.json();
      setRcaResult(data);
      addTimelineStep('Re-analysis complete');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopying(true);
      setTimeout(() => setCopying(false), 1800);
    } catch {
      // No-op
    }
  };

  /* ═══════════════════════════════════════════════════════════
     DERIVED DATA from API responses
     ═══════════════════════════════════════════════════════════ */
  const analysis = rcaResult?.analysis || {};
  const confidencePercent = Math.round((analysis.confidence_score || 0) * 100);
  const confidenceLabel = confidencePercent >= 80 ? 'High' : confidencePercent >= 50 ? 'Medium' : 'Low';
  const confidenceColor = confidencePercent >= 80 ? 'emerald' : confidencePercent >= 50 ? 'amber' : 'rose';

  // Derive bug metadata from the matched log
  const bugTitle = matchedLog?.error_message || analysis.root_cause || bugId;
  const bugModule = matchedLog?.service_name || (analysis.affected_systems?.[0]) || 'Unknown';
  const bugSeverity = analysis.severity || deriveSeverity(matchedLog?.error_message);
  const bugEnvironment = matchedLog?.environment || 'production';
  const bugDateTime = formatDate(matchedLog?.timestamp);

  // Compute evidence metrics from raw logs
  const totalLogCount = allDatasetLogs.length;
  const uniqueServices = [...new Set(allDatasetLogs.map((l) => l.service_name).filter(Boolean))];
  const errorsByService = {};
  allDatasetLogs.forEach((l) => {
    const svc = l.service_name || 'unknown';
    errorsByService[svc] = (errorsByService[svc] || 0) + 1;
  });

  // Compute time span for response time metric
  const timestamps = allDatasetLogs
    .map((l) => new Date(l.timestamp))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => a - b);
  const timeSpanMinutes = timestamps.length >= 2
    ? Math.round((timestamps[timestamps.length - 1] - timestamps[0]) / 60000)
    : 0;

  // Unique users affected
  const uniqueUsers = [...new Set(allDatasetLogs.map((l) => l.user_id).filter(Boolean))];

  // Unique error patterns
  const uniqueErrors = [...new Set(allDatasetLogs.map((l) => l.error_message).filter(Boolean))];

  // First & last occurrence
  const firstOccurrence = timestamps.length ? formatDate(timestamps[0].toISOString()) : 'N/A';
  const lastOccurrence = timestamps.length ? formatDate(timestamps[timestamps.length - 1].toISOString()) : 'N/A';

  // Evidence cards derived from real data
  const evidenceCards = [
    {
      icon: <TrendingUp className="h-4 w-4 text-violet-600" />,
      label: 'Error Patterns',
      value: String(uniqueErrors.length),
      unit: '',
      note: 'Unique error types',
      color: 'text-violet-700',
      sparkline: <SparklineDown />,
    },
    {
      icon: <BarChart3 className="h-4 w-4 text-rose-500" />,
      label: 'Error Frequency',
      value: String(totalLogCount),
      unit: '',
      note: `In ${timeSpanMinutes} mins`,
      color: 'text-rose-600',
      sparkline: <SparklineBars />,
    },
    {
      icon: <Clock className="h-4 w-4 text-teal-600" />,
      label: 'Services Affected',
      value: String(uniqueServices.length),
      unit: '',
      note: uniqueServices.slice(0, 2).join(', '),
      color: 'text-teal-700',
      sparkline: <SparklineWave />,
    },
  ];

  // Build recommendations from API response
  const recommendations = (analysis.recommendations || []).map((rec, idx) => ({
    priority: idx + 1,
    action: rec,
    status: idx === 0 ? 'In Progress' : 'Pending',
    owner: idx === 0 ? 'Backend Team' : idx === 1 ? 'DevOps Team' : 'Platform Team',
  }));

  // "Why AI thinks this" bullets from the analysis
  const whyBullets = [
    analysis.root_cause && `Root cause identified: ${analysis.root_cause}`,
    analysis.affected_systems?.length && `${analysis.affected_systems.length} affected systems: ${analysis.affected_systems.join(', ')}`,
    analysis.business_impact && `Business impact: ${analysis.business_impact}`,
    analysis.related_errors?.length && `${analysis.related_errors.length} related error patterns found`,
    confidencePercent && `AI confidence score: ${confidencePercent}%`,
    totalLogCount && `Analyzed ${totalLogCount} log entries across ${uniqueServices.length} services`,
  ].filter(Boolean);

  const tabs = [
    { key: 'rca', label: 'AI RCA', icon: '✦' },
    { key: 'evidence', label: 'Evidence', icon: '✦' },
    { key: 'recommendations', label: 'Recommendations', icon: '✦' },
    { key: 'timeline', label: 'Timeline', icon: '✦' },
    { key: 'similar', label: 'Similar Incidents', icon: '✦' },
    { key: 'activity', label: 'Activity', icon: '✦' },
  ];

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          <p className="text-slate-600">Fetching bug logs from backend...</p>
          <p className="mt-1 text-xs text-slate-400">Loading datasets & running AI analysis</p>
        </div>
      </div>
    );
  }

  /* ─── Error State ─── */
  if (errorMsg && !rcaResult && !matchedLog) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-500 mb-3" />
          <p className="text-slate-700 font-semibold">Unable to load bug details</p>
          <p className="mt-1 text-sm text-slate-500">{errorMsg}</p>
          <button
            onClick={() => navigate('/bug-report')}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Bug Logs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden bg-[#F4F7FB] min-h-screen">
      <div className="w-full px-4 sm:px-5 lg:px-6 py-5">
        {/* Full-width header - Back button aligned with workspace */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-4 mb-5">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Back button */}
            <div className="flex items-center gap-4 shrink-0">
              <button
                onClick={() => navigate('/bug-report')}
                type="button"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
              <div className="h-6 w-px bg-slate-200" />
            </div>

            {/* Center: Bug ID (centered) */}
            <div className="flex items-center gap-3 justify-center flex-1 min-w-0">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <h1 className="text-xl font-bold text-slate-900 whitespace-nowrap">{bugId}</h1>
              {analyzing && (
                <span className="rounded-lg bg-violet-100 border border-violet-200 px-2 py-0.5 text-[11px] font-semibold text-violet-700 flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <Loader2 className="h-3 w-3 animate-spin" /> Analyzing
                </span>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => copyToClipboard(bugId)}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                <Copy className="h-4 w-4" /> {copying ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={!rcaResult}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-3 text-sm font-semibold text-white hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <Download className="h-4 w-4" /> Export Report
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">

          {/* ════════════════ SIDEBAR ════════════════ */}
          <aside className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm h-fit lg:sticky lg:top-24">
            <div className="mb-4 border-b border-slate-200 pb-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
              <p className="mt-1 text-sm font-bold text-slate-800">Agent Modules</p>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => item.path && navigate(item.path)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition-all duration-200 ${
                      item.active
                        ? 'bg-indigo-50 font-semibold text-indigo-700 shadow-sm border border-indigo-100'
                        : 'border border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded-md ${item.active ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                      <Icon className="h-4 w-4 shrink-0" />
                    </span>
                    <span className="leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Support</p>
              <div className="space-y-1">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2.5 text-[13px] font-semibold text-indigo-700"
                >
                  <Bot className="h-4 w-4" /> Assist AI
                  <span className="ml-auto rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-indigo-500 shadow-sm">beta</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-[13px] text-slate-600 transition hover:bg-slate-50"
                >
                  <LifeBuoy className="h-4 w-4" /> Help & Support
                </button>
              </div>
            </div>


          </aside>

          {/* ════════════════ MAIN CONTENT ════════════════ */}
          <section className="min-w-0 space-y-4">

            {/* Error message banner */}
            {errorMsg && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                <AlertTriangle className="inline h-4 w-4 mr-1" /> {errorMsg}
              </div>
            )}

           

            {/* Main 2-col grid */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">

              {/* ──── Left Column ──── */}
              <div className="min-w-0 space-y-4">

                {/* Probable Root Cause */}
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm border-l-4 border-l-violet-500">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-[#1d2f54]">
                      <Wrench className="h-5 w-5 text-slate-500" /> Probable Root Cause
                    </h3>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="rounded-md bg-violet-100 border border-violet-200 px-2.5 py-1 font-bold text-violet-700">AI Generated</span>
                      {rcaResult && (
                        <span className={`rounded-md bg-${confidenceColor}-100 border border-${confidenceColor}-200 px-2.5 py-1 font-bold text-${confidenceColor}-700`}>
                          {confidencePercent}% Confidence
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="break-words text-xl font-bold leading-snug text-violet-700">
                    {analysis.root_cause || bugTitle}
                  </h4>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {analysis.business_impact || rcaResult?.analysis_summary || `Analysis for ${bugModule} service.`}
                  </p>

                  {/* Why AI thinks this */}
                  {whyBullets.length > 0 && (
                    <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
                      <p className="text-sm font-bold text-violet-700">Why AI thinks this:</p>
                      <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
                        {whyBullets.map((bullet, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Confidence</p>
                      <p className="mt-0.5 flex items-center gap-1 text-lg font-bold text-violet-700">
                        {rcaResult ? `${confidencePercent}%` : '—'} <RefreshCw className="h-3.5 w-3.5 text-slate-400 cursor-pointer" onClick={handleReAnalyze} />
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Impact</p>
                      <p className="mt-0.5 text-lg font-bold text-rose-600">{bugSeverity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Detected in</p>
                      <p className="mt-0.5 text-lg font-bold text-slate-800">{bugModule}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Environment</p>
                      <p className="mt-0.5 text-lg font-bold capitalize text-slate-800">{bugEnvironment}</p>
                    </div>
                  </div>
                </article>

                {/* Key Evidence */}
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#1d2f54]">
                    <FileText className="h-5 w-5 text-slate-500" /> Key Evidence <span className="text-slate-400 font-normal">({evidenceCards.length})</span>
                  </h3>
                  <div className="grid gap-3 md:grid-cols-3">
                    {evidenceCards.map((item) => (
                      <div key={item.label} className="rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-3.5 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-1">
                          {item.icon}
                          <p className="text-xs font-semibold text-slate-500">{item.label}</p>
                        </div>
                        <div className="flex items-end justify-between">
                          <div>
                            <p className={`text-3xl font-extrabold ${item.color}`}>{item.value}<span className="text-lg font-bold">{item.unit}</span></p>
                            <p className="text-[11px] text-slate-400 font-medium">{item.note}</p>
                          </div>
                          {item.sparkline}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Affected systems breakdown */}
                  {analysis.affected_systems?.length > 0 && (
                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Affected Systems</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.affected_systems.map((sys) => (
                          <span key={sys} className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {sys}
                            {errorsByService[sys] && <span className="ml-1 text-rose-500 font-bold">({errorsByService[sys]})</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related errors */}
                  {analysis.related_errors?.length > 0 && (
                    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Related Error Patterns</p>
                      <div className="space-y-1">
                        {analysis.related_errors.map((err, i) => (
                          <p key={i} className="text-xs text-slate-600 font-mono bg-white rounded px-2 py-1 border border-slate-100">
                            {err}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </article>

               
              </div>

              {/* ──── Right Column ──── */}
              <div className="min-w-0 space-y-4">

                {/* AI Investigation Flow */}
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-[#1d2f54]">
                      <Zap className="h-5 w-5 text-slate-500" /> AI Investigation Flow
                    </h3>
                    <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                      Show Details <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {analysisTimeline.length > 0 ? (
                      analysisTimeline.map((step, idx) => {
                        const isLast = idx === analysisTimeline.length - 1;
                        const isError = step.event.startsWith('Error:');
                        return (
                          <div key={`${step.time}-${idx}`} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors group">
                            <p className="flex items-center gap-2.5 text-sm text-slate-700">
                              {isError ? (
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                              ) : isLast && !analyzing ? (
                                <Sparkles className="h-4 w-4 text-violet-500" />
                              ) : isLast && analyzing ? (
                                <Loader2 className="h-4 w-4 text-violet-500 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              )}
                              <span className={isLast ? 'font-semibold text-violet-700' : isError ? 'text-amber-600' : ''}>{step.event}</span>
                            </p>
                            <span className="text-xs font-semibold text-slate-400 tabular-nums">{step.time}</span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-slate-400 px-3 py-2">No investigation steps recorded yet.</p>
                    )}
                  </div>
                </article>

                {/* AI Suggested Actions */}
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-[#1d2f54]">
                      <Sparkles className="h-5 w-5 text-slate-500" /> AI Suggested Actions
                    </h3>
                    <span className="rounded-lg bg-violet-100 border border-violet-200 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                      {recommendations.length} Actionable
                    </span>
                  </div>

                  <div className="space-y-3">
                    {recommendations.length > 0 ? (
                      recommendations.slice(0, 4).map((rec, idx) => (
                        <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <span className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${rec.status === 'In Progress' ? 'bg-violet-100 text-violet-600' : 'bg-amber-100 text-amber-600'}`}>
                                <Wrench className="h-3.5 w-3.5" />
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-slate-800">{rec.action}</p>
                                <p className="mt-0.5 text-xs text-slate-500">Owner: {rec.owner}</p>
                              </div>
                            </div>
                            <span className={`rounded-lg px-2.5 py-1 text-[11px] font-bold whitespace-nowrap ${
                              rec.status === 'In Progress'
                                ? 'bg-indigo-100 border border-indigo-200 text-indigo-700'
                                : 'bg-slate-100 border border-slate-200 text-slate-600'
                            }`}>
                              {rec.status}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 text-center py-4">
                        {analyzing ? 'Generating recommendations...' : 'No recommendations available yet.'}
                      </p>
                    )}
                  </div>

                  {recommendations.length > 4 && (
                    <button type="button" className="mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-100 transition-colors">
                      View All Recommendations ({recommendations.length}) <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </article>

              </div>
            </div>

          </section>
        </div>
      </div>
    </div>
  );
}
