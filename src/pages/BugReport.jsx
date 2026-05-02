import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Bug,
  ChevronDown,
  ChevronRight,
  FileText,
  Filter,
  Home,
  LifeBuoy,
  Search,
  SendHorizontal,
  Settings,
  Shield,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FALLBACK_BUG_LOGS = [
  {
    id: 'BUG-3081',
    module: 'Mobile App',
    severity: 'High',
    title: 'Crash on app launch - Android 13',
    summary: 'Users experiencing crash when launching app on Android 13 devices.',
    dateTime: '23 Apr 2026, 10:18 AM',
    status: 'RCA Generated',
  },
  {
    id: 'BUG-3080',
    module: 'Web Portal',
    severity: 'Critical',
    title: 'Login session timeout issues',
    summary: 'Users getting logged out frequently with session timeout errors.',
    dateTime: '23 Apr 2026, 09:55 AM',
    status: 'In Progress',
  },
  {
    id: 'BUG-3079',
    module: 'API Gateway',
    severity: 'Medium',
    title: 'API rate limiting returning 429 errors',
    summary: 'API calls failing with rate limit exceeded errors.',
    dateTime: '23 Apr 2026, 09:27 AM',
    status: 'Resolved',
  },
];

const BUG_RCA_API_BASE =
  (import.meta.env.VITE_BACKEND_BASE_URL ?? '').replace(/\/$/, '');

const menuItems = [
  { label: 'Home', icon: Home, path: '/', active: false },
  { label: 'Intelligent Incident Triage', icon: Sparkles, path: '/incident-triage', active: false },
  { label: 'User Access Management', icon: UserRound, path: '/user-access', active: false },
  { label: 'Bug Logs Summary & RCA', icon: AlertTriangle, path: '/bug-report', active: true },
  { label: 'Settings', icon: Settings, path: null, active: false },
];

const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const toneBySeverity = (value) => {
  const key = String(value || '').toLowerCase();

  if (key.includes('critical')) return { chip: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' };
  if (key.includes('high')) return { chip: 'bg-rose-100 text-rose-600', dot: 'bg-rose-500' };
  if (key.includes('medium')) return { chip: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500' };
  return { chip: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500' };
};

const toneByStatus = (value) => {
  const key = String(value || '').toLowerCase();

  if (key.includes('progress')) return 'bg-indigo-100 text-indigo-600';
  if (key.includes('resolved') || key.includes('closed')) return 'bg-emerald-100 text-emerald-600';
  if (key.includes('rca')) return 'bg-teal-100 text-teal-700';
  return 'bg-sky-100 text-sky-600';
};

const severityRank = (value) => {
  const key = String(value || '').toLowerCase();
  if (key.includes('critical')) return 4;
  if (key.includes('high')) return 3;
  if (key.includes('medium')) return 2;
  return 1;
};

const severityLabelFromRank = (rank) => {
  if (rank >= 4) return 'critical';
  if (rank >= 3) return 'high';
  if (rank >= 2) return 'medium';
  return 'low';
};

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

const normalizeBugLog = (item, index) => {
  const timestamp = firstValue(item.timestamp, item.dateTime, item.created_at, item.updated_at);
  const serviceName = firstValue(item.service_name, item.module, item.service, item.source, 'Unknown Module');
  const errorMessage = firstValue(item.error_message, item.title, item.summary, item.description, 'No error message');
  const reqId = firstValue(item.request_id, item.id, item.bug_id, item.bugId);
  const severity = String(firstValue(item.severity, item.priority, deriveSeverity(errorMessage)));
  const status = String(firstValue(item.status, item.state, 'New'));

  let extractedModule = serviceName;
  let extractedTitle = errorMessage;

  const bracketMatch = extractedTitle.match(/^\[([^\]]+)\]\s*(.*)$/);
  if (bracketMatch) {
    extractedModule = bracketMatch[1].trim();
    extractedTitle = bracketMatch[2].trim();
  } else if (extractedModule.toLowerCase() === 'bug') {
    extractedModule = 'Unknown Module';
  }

  return {
    id: firstValue(reqId ? `BUG-${String(reqId).slice(-4).toUpperCase()}` : null, `BUG-${3000 + index}`),
    module: extractedModule,
    severity,
    title: extractedTitle,
    summary: firstValue(item.summary, item.details, `Environment: ${firstValue(item.environment, 'production')}`),
    dateTime: formatDate(timestamp),
    timestampRaw: timestamp,
    status,
    rawLog: {
      timestamp,
      service_name: extractedModule,
      error_message: extractedTitle,
      stack_trace: item.stack_trace ?? null,
      environment: firstValue(item.environment, 'production'),
      user_id: firstValue(item.user_id, null),
      request_id: firstValue(item.request_id, reqId, null),
      metadata: item.metadata ?? null,
    },
  };
};

const extractLogsArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.value)) return payload.value;
  if (Array.isArray(payload?.logs)) return payload.logs;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const normalizeBugResponse = (payload) => {
  const logs = extractLogsArray(payload);
  return logs.map((item, index) => normalizeBugLog(item, index));
};

const parseFocusAreas = (text) =>
  text
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const buildRequestChunks = (logs, depth, focusAreas) => {
  const chunkSize = 50;
  const chunks = [];

  for (let index = 0; index < logs.length; index += chunkSize) {
    chunks.push({
      logs: logs.slice(index, index + chunkSize),
      analysis_depth: depth,
      focus_areas: focusAreas.length ? focusAreas : null,
    });
  }

  return chunks;
};

const mergeBatchResponses = (responses) => {
  const combinedRootCauses = responses.map((res) => res?.analysis?.root_cause).filter(Boolean);
  const combinedSystems = [...new Set(responses.flatMap((res) => res?.analysis?.affected_systems || []))];
  const combinedRecommendations = [
    ...new Set(responses.flatMap((res) => res?.analysis?.recommendations || [])),
  ].slice(0, 8);
  const maxSeverity = responses.reduce(
    (current, res) => Math.max(current, severityRank(res?.analysis?.severity)),
    1,
  );
  const confidenceList = responses
    .map((res) => Number(res?.analysis?.confidence_score || 0))
    .filter((value) => !Number.isNaN(value));
  const avgConfidence = confidenceList.length
    ? confidenceList.reduce((a, b) => a + b, 0) / confidenceList.length
    : 0;

  return {
    request_id: `batch-${Date.now()}`,
    analysis_summary: `Batch RCA completed for ${responses.length} chunks with ${combinedSystems.length} affected systems identified.`,
    analysis: {
      root_cause: combinedRootCauses.slice(0, 3).join(' | ') || 'No consolidated root cause available',
      affected_systems: combinedSystems,
      severity: severityLabelFromRank(maxSeverity),
      business_impact: `Multiple bug clusters analyzed across ${responses.length} chunks.`,
      recommendations: combinedRecommendations,
      confidence_score: avgConfidence,
      related_errors: [],
    },
    processing_time_ms: responses.reduce((sum, res) => sum + Number(res?.processing_time_ms || 0), 0),
    model_used: 'batch-aggregate',
    timestamp: new Date().toISOString(),
  };
};

const normalizeMatchAnalyzeResult = (payload, bugDescription, depth) => {
  const immediateActions = Array.isArray(payload?.immediate_actions) ? payload.immediate_actions : [];
  const preventiveMeasures = Array.isArray(payload?.preventive_measures) ? payload.preventive_measures : [];
  const timeline = Array.isArray(payload?.timeline) ? payload.timeline : [];
  const matchedScenario = payload?.matched_scenario || null;
  const fallbackSummary = matchedScenario
    ? `Matched scenario: ${firstValue(matchedScenario.scenario_name, matchedScenario.scenario_id, 'unknown')} (${Math.round(Number(matchedScenario.match_score || 0) * 100)}% confidence)`
    : `Generated RCA for bug description using ${depth} analysis.`;

  return {
    request_id: firstValue(payload?.request_id, `match-${Date.now()}`),
    timestamp: firstValue(payload?.timestamp, new Date().toISOString()),
    logs_analyzed: Number(firstValue(payload?.logs_analyzed, matchedScenario?.error_count_in_dataset, 0)),
    timeline,
    immediate_actions: immediateActions,
    preventive_measures: preventiveMeasures,
    matched_scenario: matchedScenario,
    analysis_summary: firstValue(payload?.analysis_summary, fallbackSummary),
    analysis: {
      root_cause: firstValue(payload?.analysis?.root_cause, matchedScenario?.description, bugDescription),
      severity: firstValue(payload?.analysis?.severity, 'unknown'),
      confidence_score: Number(firstValue(payload?.analysis?.confidence_score, matchedScenario?.match_score, 0)),
      business_impact: firstValue(payload?.analysis?.business_impact, payload?.business_impact, 'Impact details not provided.'),
      affected_systems: firstValue(payload?.analysis?.affected_systems, matchedScenario?.affected_services_in_scenario, []),
      recommendations: [
        ...immediateActions,
        ...preventiveMeasures,
      ],
    },
  };
};

const BugReport = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [serviceFilter, setServiceFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');

  const [bugLogs, setBugLogs] = useState(FALLBACK_BUG_LOGS);
  const [datasetOptions, setDatasetOptions] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiMessage, setApiMessage] = useState('');
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const [serviceInfo, setServiceInfo] = useState(null);
  const [serviceHealth, setServiceHealth] = useState(null);

  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [assistantLastDepth, setAssistantLastDepth] = useState('detailed');
  const [assistantLatestResult, setAssistantLatestResult] = useState(null);
  const [assistantConversation, setAssistantConversation] = useState([]);

  const serviceOptions = useMemo(() => {
    const services = [...new Set(bugLogs.map((entry) => entry.module).filter(Boolean))];
    return ['All', ...services];
  }, [bugLogs]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchServiceMeta = async () => {
      try {
        const [infoRes, healthRes] = await Promise.all([
          fetch(`${BUG_RCA_API_BASE}/bug-rca/info`, { signal: controller.signal }),
          fetch(`${BUG_RCA_API_BASE}/bug-rca/health`, { signal: controller.signal }),
        ]);

        if (infoRes.ok) {
          setServiceInfo(await infoRes.json());
        }
        if (healthRes.ok) {
          setServiceHealth(await healthRes.json());
        }
      } catch {
        // Non-blocking metadata fetch.
      }
    };

    const fetchDataset = async (datasetId) => {
      const response = await fetch(`${BUG_RCA_API_BASE}/bug-rca/dataset/${encodeURIComponent(datasetId)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Bug dataset API failed with status ${response.status}`);
      }

      const payload = await response.json();
      const normalized = normalizeBugResponse(payload);
      if (normalized.length) {
        setBugLogs(normalized);
        setApiMessage('');
      } else {
        setBugLogs(FALLBACK_BUG_LOGS);
        setApiMessage('Dataset loaded but no usable logs found. Showing demo data.');
      }
    };

    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        const datasetsRes = await fetch(`${BUG_RCA_API_BASE}/bug-rca/datasets`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (!datasetsRes.ok) {
          throw new Error(`Bug RCA datasets API failed with status ${datasetsRes.status}`);
        }

        const datasetsPayload = await datasetsRes.json();
        const datasets = Array.isArray(datasetsPayload?.datasets) ? datasetsPayload.datasets : [];
        setDatasetOptions(datasets);

        const firstDatasetId = firstValue(datasets[0]?.id, '');
        setSelectedDatasetId(firstDatasetId);

        if (firstDatasetId) {
          await fetchDataset(firstDatasetId);
        } else {
          setBugLogs(FALLBACK_BUG_LOGS);
          setApiMessage('Connected to backend, but no datasets are available. Showing demo logs.');
        }
      } catch {
        setBugLogs(FALLBACK_BUG_LOGS);
        setApiMessage('Unable to reach bug RCA APIs right now. Showing demo logs.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceMeta();
    loadInitialData();

    return () => controller.abort();
  }, []);

  const latestTimestamp = useMemo(() => {
    const parsed = bugLogs
      .map((entry) => new Date(entry.timestampRaw || entry.dateTime))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((a, b) => b.getTime() - a.getTime());

    return parsed[0] || new Date();
  }, [bugLogs]);

  const visibleLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const withinDateRange = (entry) => {
      if (dateFilter === 'All') return true;
      const parsed = new Date(entry.timestampRaw || entry.dateTime);
      if (Number.isNaN(parsed.getTime())) return true;

      const diffMs = latestTimestamp.getTime() - parsed.getTime();
      if (dateFilter === '24h') return diffMs <= 24 * 60 * 60 * 1000;
      if (dateFilter === '7d') return diffMs <= 7 * 24 * 60 * 60 * 1000;
      if (dateFilter === '30d') return diffMs <= 30 * 24 * 60 * 60 * 1000;
      return true;
    };

    return bugLogs.filter((bug) => {
      if (statusFilter !== 'All' && String(bug.status).toLowerCase() !== statusFilter.toLowerCase()) return false;
      if (severityFilter !== 'All' && String(bug.severity).toLowerCase() !== severityFilter.toLowerCase()) return false;
      if (serviceFilter !== 'All' && bug.module !== serviceFilter) return false;
      if (!withinDateRange(bug)) return false;

      if (!query) return true;
      return [bug.id, bug.module, bug.title, bug.summary].join(' ').toLowerCase().includes(query);
    });
  }, [searchTerm, bugLogs, statusFilter, severityFilter, serviceFilter, dateFilter, latestTimestamp]);

  const handleDatasetChange = async (event) => {
    const datasetId = event.target.value;
    setSelectedDatasetId(datasetId);
    setAnalysisResult(null);

    if (!datasetId) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${BUG_RCA_API_BASE}/bug-rca/dataset/${encodeURIComponent(datasetId)}`, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Dataset fetch failed: ${response.status}`);
      }

      const payload = await response.json();
      const normalized = normalizeBugResponse(payload);
      setBugLogs(normalized.length ? normalized : FALLBACK_BUG_LOGS);
      setApiMessage(normalized.length ? '' : 'Selected dataset has no usable logs. Showing demo logs.');
    } catch {
      setBugLogs(FALLBACK_BUG_LOGS);
      setApiMessage('Failed to load selected dataset. Showing demo logs.');
    } finally {
      setIsLoading(false);
    }
  };

  const logsForAnalysis = useMemo(
    () => visibleLogs.map((entry) => entry.rawLog).filter(Boolean),
    [visibleLogs],
  );

  const pushHistory = (mode, result) => {
    setAnalysisHistory((current) => [
      {
        id: result.request_id || `${mode}-${Date.now()}`,
        mode,
        timestamp: result.timestamp || new Date().toISOString(),
        summary: result.analysis_summary,
        severity: result.analysis?.severity,
        confidence: result.analysis?.confidence_score,
      },
      ...current,
    ]);
  };

  const runAnalysis = async (mode, customLogs = null, sourceLabel = '') => {
    const activeLogs = Array.isArray(customLogs) && customLogs.length ? customLogs : logsForAnalysis;

    if (!activeLogs.length) {
      setApiMessage('No logs available for analysis.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setApiMessage('');

      const focusAreas = parseFocusAreas(assistantQuestion);

      let result;
      if (mode === 'batch' || (mode === 'standard' && activeLogs.length > 50)) {
        const chunks = buildRequestChunks(activeLogs, 'standard', focusAreas);
        const response = await fetch(`${BUG_RCA_API_BASE}/bug-rca/batch-analyze`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunks),
        });

        if (!response.ok) {
          throw new Error(`Batch analyze failed with status ${response.status}`);
        }

        const responses = await response.json();
        result = mergeBatchResponses(Array.isArray(responses) ? responses : []);
      } else {
        const endpoint =
          mode === 'quick' ? '/bug-rca/quick-analyze' : mode === 'detailed' ? '/bug-rca/detailed-analyze' : '/bug-rca/analyze';

        const payload = {
          logs: activeLogs.slice(0, 50),
          analysis_depth: mode === 'detailed' ? 'detailed' : mode === 'quick' ? 'quick' : 'standard',
          focus_areas: focusAreas.length ? focusAreas : null,
        };

        const response = await fetch(`${BUG_RCA_API_BASE}${endpoint}`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Analyze failed with status ${response.status}`);
        }

        result = await response.json();
      }

      setAnalysisResult(result);
      pushHistory(mode, result);
      setShowHistory(true);
      if (sourceLabel) {
        setApiMessage(`RCA generated for ${sourceLabel}.`);
      }
    } catch {
      setApiMessage('Analysis request failed. Please verify backend availability and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runMatchAndAnalyze = async (description) => {
    const trimmed = String(description || '').trim();
    if (trimmed.length < 10) {
      setApiMessage('Bug description must be at least 10 characters for match-and-analyze.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setApiMessage('');

      const response = await fetch(`${BUG_RCA_API_BASE}/bug-rca/match-and-analyze`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bug_description: trimmed,
          analysis_depth: 'detailed',
        }),
      });

      if (!response.ok) {
        throw new Error(`Match and analyze failed with status ${response.status}`);
      }

      const payload = await response.json();
      const normalizedResult = normalizeMatchAnalyzeResult(payload, trimmed, 'detailed');

      setAssistantQuestion(trimmed);
      setAssistantLastDepth('detailed');
      setAssistantLatestResult(payload);
      setAssistantConversation((current) => [
        ...current,
        {
          id: `${Date.now()}-${current.length + 1}`,
          question: trimmed,
          result: payload,
        },
      ]);
      setAnalysisResult(normalizedResult);
      pushHistory('match-detailed', normalizedResult);
      setShowHistory(true);
      setAssistantPrompt('');
    } catch {
      setApiMessage('Match-and-analyze request failed. Please verify backend availability and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyAssistantSuggestion = (text) => {
    setAssistantPrompt(text);
  };

  const triggerStandardAnalysis = () => {
    runAnalysis('standard');
  };

  const handleUploadLogs = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = JSON.parse(content);
      const normalized = normalizeBugResponse(parsed);

      if (!normalized.length) {
        setApiMessage('Uploaded file does not contain valid bug logs.');
      } else {
        setBugLogs(normalized);
        setSelectedDatasetId('uploaded');
        setApiMessage(`Loaded ${normalized.length} logs from uploaded file.`);
      }
    } catch {
      setApiMessage('Failed to parse uploaded file. Please upload valid JSON.');
    } finally {
      event.target.value = '';
    }
  };

  const handleExportReport = () => {
    if (!analysisResult) {
      setApiMessage('Run an analysis first to export a report.');
      return;
    }

    const reportBlob = new Blob([JSON.stringify(analysisResult, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const reportUrl = URL.createObjectURL(reportBlob);
    const anchor = document.createElement('a');
    anchor.href = reportUrl;
    anchor.download = `bug-rca-report-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(reportUrl);
  };

  const healthStatus = firstValue(serviceHealth?.status, serviceHealth?.health, 'unknown');
  const analysisMetrics = useMemo(() => {
    return {
      logsAnalyzed: 50,
      incidentsLinked: 20,
      accuracy: 92,
      logsTrend: 4,
      incidentsTrend: 1,
    };
  }, []);

  return (
    <div className="w-full bg-white py-4 sm:py-6">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        onChange={handleUploadLogs}
        hidden
      />

      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 items-start lg:grid-cols-[260px_1fr]">
          <aside className="order-2 lg:order-1 border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm">
            <div className="mb-4 border-b border-slate-200 pb-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">Agent Modules</p>
            </div>

            <nav className="space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => item.path && navigate(item.path)}
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[15px] transition ${
                      item.active
                        ? 'border border-amber-100 bg-amber-50 font-semibold text-amber-700 shadow-sm'
                        : 'border border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-800'
                    }`}
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded ${item.active ? 'bg-white text-amber-600' : 'text-slate-500'}`}>
                      <Icon className="h-4 w-4 shrink-0" />
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Support</p>
              <div className="space-y-2">
                

                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-sm text-slate-600 transition hover:border-slate-200 hover:bg-white hover:text-slate-800"
                >
                  <LifeBuoy className="h-4 w-4" /> Help & Support
                </button>
              </div>
            </div>
          </aside>

          <section className="order-1 lg:order-2 border border-slate-200 bg-white p-4 sm:p-7">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center bg-amber-50 text-amber-600">
                  <Bug className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-2xl sm:text-[32px] leading-tight font-sans font-bold text-[#1e293b]">Bug Logs Summary & RCA</h2>
                  <p className="mt-1 text-sm text-slate-500">Get AI-powered summaries and root cause analysis from bug logs.</p>
                  <p className="mt-1 text-xs text-slate-400">
                    Service: {firstValue(serviceInfo?.service, 'bug_rca')} | Health: {String(healthStatus)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <Shield className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mb-6 select-none overflow-hidden rounded-xl bg-gradient-to-br from-[#5b21b6] via-[#6d28d9] to-[#8b5cf6] p-4 text-white shadow-[0_18px_45px_rgba(91,33,182,0.35)] sm:p-5">
              <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-16 left-12 h-48 w-48 rounded-full bg-fuchsia-300/20 blur-3xl" />

              <div className="relative z-10 grid gap-3 lg:grid-cols-[1.1fr_1fr] lg:gap-4">
                <div>
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/15">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-100">AI Risk Signal</p>
                      <h3 className="mt-1 text-3xl font-semibold leading-tight">AI Analysis Ready</h3>
                      
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-sm">
                    <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-violet-100">
                      <span>AI Accuracy</span>
                      <span>{analysisMetrics.accuracy}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-white/20">
                      <div className="h-2.5 rounded-full bg-white" style={{ width: `${analysisMetrics.accuracy}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-violet-100">High confidence pattern match across active clusters.</p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-2 lg:gap-2">
                  <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-violet-100">Logs Analyzed</p>
                    <p className="mt-1 text-[34px] font-semibold leading-none">{analysisMetrics.logsAnalyzed.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-violet-100">+{analysisMetrics.logsTrend}% vs last 7 days</p>
                  </div>

                  <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-violet-100">Incidents Linked</p>
                    <p className="mt-1 text-[34px] font-semibold leading-none">{analysisMetrics.incidentsLinked}</p>
                    <p className="mt-1 text-xs text-violet-100">+{analysisMetrics.incidentsTrend}% vs last 7 days</p>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-sm sm:col-span-2 lg:col-span-2">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-violet-100">Confidence</p>
                      <p className="mt-1 inline-flex whitespace-nowrap rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">High Confidence</p>
                    </div>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/20 bg-white/10">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-3 grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search bug logs by ID, service, module, or keyword..."
                  className="h-11 w-full border border-slate-200 bg-white pl-10 pr-3 text-[15px] text-slate-700 outline-none transition focus:border-[#6B46FF]"
                />
              </div>
              <button
                type="button"
                onClick={triggerStandardAnalysis}
                disabled={isLoading || isAnalyzing}
                className="h-11 border border-violet-600 bg-violet-600 px-5 text-[15px] font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAnalyzing ? 'Analyzing...' : 'Generate RCA'} ✨
              </button>
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Dataset</label>
              <select
                value={selectedDatasetId}
                onChange={handleDatasetChange}
                className="h-10 w-full border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#6B46FF]"
              >
                {!datasetOptions.length ? <option value="">No datasets available</option> : null}
                {datasetOptions.map((dataset) => (
                  <option key={dataset.id} value={dataset.id}>
                    {dataset.name || dataset.id}
                  </option>
                ))}
                <option value="uploaded">Uploaded logs (manual)</option>
              </select>
            </div>

            <div className="mb-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-9 border border-slate-200 px-3.5 text-sm text-slate-600"
              >
                {['All', 'RCA Generated', 'In Progress', 'Resolved', 'New'].map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>

              <select
                value={severityFilter}
                onChange={(event) => setSeverityFilter(event.target.value)}
                className="h-9 border border-slate-200 px-3.5 text-sm text-slate-600"
              >
                {['All', 'Critical', 'High', 'Medium', 'Low'].map((severity) => (
                  <option key={severity} value={severity}>{severity}</option>
                ))}
              </select>

              <select
                value={serviceFilter}
                onChange={(event) => setServiceFilter(event.target.value)}
                className="h-9 border border-slate-200 px-3.5 text-sm text-slate-600"
              >
                {serviceOptions.map((service) => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>

              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="h-9 border border-slate-200 px-3.5 text-sm text-slate-600"
              >
                <option value="All">Date Range</option>
                <option value="24h">Past 24h</option>
                <option value="7d">Past 7 days</option>
                <option value="30d">Past 30 days</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setStatusFilter('All');
                  setSeverityFilter('All');
                  setServiceFilter('All');
                  setDateFilter('All');
                }}
                className="inline-flex h-9 items-center justify-center gap-2 border border-slate-200 px-3.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                <Filter className="h-4 w-4" />
                Reset
              </button>
            </div>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-2xl sm:text-[32px] leading-tight font-sans font-bold text-[#1e293b]">Bug Logs ({visibleLogs.length})</h3>
                <p className="text-sm text-slate-500">AI-processed bug logs with summaries and RCA</p>
                {isLoading ? <p className="mt-1 text-xs text-slate-400">Syncing bug logs from backend...</p> : null}
                {apiMessage ? <p className="mt-1 text-xs text-amber-600">{apiMessage}</p> : null}
              </div>

              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 border border-slate-200 px-3 text-sm text-slate-600"
              >
                Sort by: Newest
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  Loading bug logs from backend...
                </div>
              ) : null}

              {visibleLogs.map((bug) => {
                const severityTone = toneBySeverity(bug.severity);
                const statusTone = toneByStatus(bug.status);

                return (
                  <article
                    key={bug.id}
                    onClick={() => {
                      navigate(`/bug-report/${bug.id}`);
                    }}
                    className="flex cursor-pointer flex-col gap-2 border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 sm:flex-row sm:items-start"
                  >
                    <div className={`mt-2 h-2 w-2 shrink-0 rounded-full ${severityTone.dot}`} />

                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-xl font-bold text-[#1e293b]">{bug.id}</span>
                        <span className="text-xs text-slate-500">{bug.module}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${severityTone.chip}`}>
                          {bug.severity}
                        </span>
                      </div>
                      <p className="text-[17px] font-semibold text-[#1e293b]">{bug.title}</p>
                      <p className="text-sm text-slate-500">{bug.summary}</p>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:min-w-[195px] sm:flex-col sm:items-end">
                      <p className="text-xs text-slate-500">{bug.dateTime}</p>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs font-semibold ${statusTone}`}>{bug.status}</span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  </article>
                );
              })}

              {!isLoading && !visibleLogs.length ? (
                <div className="border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  No bug logs found for your current filters.
                </div>
              ) : null}
            </div>


           

            {showHistory ? (
              <div className="mt-6 border border-slate-200 bg-white p-3">
                <p className="mb-2 text-sm font-semibold text-slate-800">RCA History</p>
                {!analysisHistory.length ? (
                  <p className="text-xs text-slate-500">No RCA runs yet.</p>
                ) : (
                  <div className="space-y-2">
                    {analysisHistory.map((item) => (
                      <div key={item.id} className="border border-slate-100 bg-slate-50 p-2 text-xs text-slate-600">
                        <p className="font-semibold text-slate-800">{item.mode.toUpperCase()} | {formatDate(item.timestamp)}</p>
                        <p className="mt-1">{item.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </section>

        </div>
      </div>

      {showAIAssistant ? (
        <aside className="fixed left-3 right-3 top-20 z-50 flex w-auto max-h-[calc(100vh-6rem)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)] sm:left-auto sm:right-6 sm:top-24 sm:w-80 sm:max-h-[calc(100vh-7rem)]">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <p className="text-sm font-semibold text-slate-900">AI Assistant ✦</p>
            </div>
            <div className="flex items-center gap-3 text-slate-500">
              <button type="button" className="hover:text-slate-700" onClick={() => setShowAIAssistant(false)}>
                <ChevronDown className="h-4 w-4" />
              </button>
              <button type="button" className="hover:text-slate-700" onClick={() => setShowAIAssistant(false)}>
                ✕
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 shadow-sm">
              <p className="text-[13px] font-semibold text-slate-800">👋 Hi! I’m your AI assistant.</p>
              <p className="mt-1 text-[13px] leading-5 text-slate-600">Describe a bug and I will match it with our dataset and generate RCA.</p>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">You can ask me:</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => applyAssistantSuggestion('Users are getting null pointer exceptions when they try to authenticate. The API gateway keeps crashing.')}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-[13px] text-slate-700 transition hover:bg-slate-50"
                >
                  What is the root cause of BUG-C3H5?
                </button>
                <button
                  type="button"
                  onClick={() => applyAssistantSuggestion('Repeated cache timeout alerts and service degradation observed over the last seven days.')}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-[13px] text-slate-700 transition hover:bg-slate-50"
                >
                  Show similar incidents in last 7 days
                </button>
                <button
                  type="button"
                  onClick={() => applyAssistantSuggestion('Authentication and API gateway failures are impacting multiple downstream services and users.')}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-[13px] text-slate-700 transition hover:bg-slate-50"
                >
                  Which services are most affected?
                </button>
                <button type="button" className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-[13px] text-slate-700 transition hover:bg-slate-50">
                  <span>More suggestions</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              </div>
            </div>

            {assistantConversation.map((message) => {
              const result = message.result;
              if (!result?.matched_scenario) return null;

              return (
                <div key={message.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[13px] text-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">You</p>
                  <p className="mt-1 text-slate-800">{message.question}</p>

                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <p className="font-semibold text-slate-900">Matched Scenario</p>
                    <p className="mt-1 text-slate-700">{firstValue(result.matched_scenario.scenario_name, result.matched_scenario.scenario_id, 'Unknown scenario')}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Score: {Math.round(Number(result.matched_scenario.match_score || 0) * 100)}% | Primary Error:{' '}
                      {firstValue(result.matched_scenario.primary_error_type, 'N/A')}
                    </p>

                    {Array.isArray(result.timeline) && result.timeline.length ? (
                      <div className="mt-2 border-t border-slate-200 pt-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline</p>
                        {result.timeline.slice(0, 3).map((entry, idx) => (
                          <p key={`${message.id}-timeline-${entry.time || idx}-${idx}`} className="mt-1 text-xs text-slate-600">
                            {firstValue(entry.time, 'Unknown time')}: {firstValue(entry.event, 'Event recorded')}
                          </p>
                        ))}
                      </div>
                    ) : null}

                    {Array.isArray(result.immediate_actions) && result.immediate_actions.length ? (
                      <div className="mt-2 border-t border-slate-200 pt-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Immediate Actions</p>
                        {result.immediate_actions.slice(0, 3).map((action, idx) => (
                          <p key={`${message.id}-action-${idx}`} className="mt-1 text-xs text-slate-600">{idx + 1}. {action}</p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Type Your Question Here</p>
            <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={assistantPrompt}
                  onChange={(event) => setAssistantPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      runMatchAndAnalyze(assistantPrompt);
                    }
                  }}
                  placeholder="Describe your bug in one sentence..."
                  className="min-w-0 flex-1 border-0 bg-transparent px-2 py-2 text-[13px] text-slate-700 outline-none"
                />
                <button
                  type="button"
                  onClick={() => runMatchAndAnalyze(assistantPrompt)}
                  disabled={isAnalyzing}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
                  title="Send question"
                  aria-label="Send question"
                >
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      ) : null}


    </div>
  );
};

export default BugReport;
