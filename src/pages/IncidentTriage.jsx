import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
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


const INCIDENT_TRIAGE_API_BASE =
  (import.meta.env?.VITE_BACKEND_BASE_URL ?? '').replace(/\/$/, '');

const firstValue = (...values) => values.find((value) => value !== undefined && value !== null && value !== '');

const extractIncidentsArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.incidents)) return payload.incidents;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.value)) return payload.value;
  return [];
};

const extractIncidentNumber = (value, fallback) => {
  const text = String(firstValue(value, fallback, ''));
  const numericPart = Number(text.replace(/\D/g, ''));
  if (Number.isFinite(numericPart) && numericPart > 0) return numericPart;
  const directNumber = Number(text);
  if (Number.isFinite(directNumber) && directNumber > 0) return directNumber;
  return 1000 + fallback;
};

const normalizeIncident = (item, index) => ({
  id: String(firstValue(item.number, item.incident_id, item.id, item.request_id, `INC-${1000 + index}`)),
  number: extractIncidentNumber(firstValue(item.number, item.incident_number, item.incident_no, item.incident_id, item.id, item.request_id), index),
  incidentNumber: extractIncidentNumber(firstValue(item.number, item.incident_number, item.incident_no, item.incident_id, item.id, item.request_id), index),
  service: String(firstValue(item.assigned_to, item.service, item.source, item.component, item.module, 'unknown-service')),
  title: String(firstValue(item.short_description, item.title, item.error_message, item.summary, item.description, 'No incident title provided')),
  summary: String(firstValue(item.short_description, item.summary, item.details, 'No additional context available')),
  severity: String(firstValue(item.severity, item.priority, 'Medium')),
  status: String(firstValue(item.state, item.status, 'Open')),
  timestamp: firstValue(item.timestamp, item.created_at, item.updated_at, null),
  raw: item,
});

const formatDateTime = (value) => {
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

const severityTone = (value) => {
  const key = String(value || '').toLowerCase();
  if (key.includes('critical')) return { chip: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' };
  if (key.includes('high')) return { chip: 'bg-rose-100 text-rose-600', dot: 'bg-rose-500' };
  if (key.includes('medium')) return { chip: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500' };
  return { chip: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500' };
};

const statusTone = (value) => {
  const key = String(value || '').toLowerCase();
  if (key.includes('open')) return 'bg-sky-100 text-sky-600';
  if (key.includes('progress')) return 'bg-indigo-100 text-indigo-600';
  if (key.includes('resolve') || key.includes('close')) return 'bg-emerald-100 text-emerald-600';
  return 'bg-sky-100 text-sky-600';
};

const IncidentTriage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('AI RCA');
  const [rootInfo, setRootInfo] = useState(null);
  const [allIncidents, setAllIncidents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [analysisById, setAnalysisById] = useState({});
  const [expandedAnalysis, setExpandedAnalysis] = useState({});
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState('');
  const [resolvingId, setResolvingId] = useState('');
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [incidentToResolve, setIncidentToResolve] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [apiMessage, setApiMessage] = useState('');

  const selectedIncident = useMemo(
    () => allIncidents.find((incident) => incident.id === selectedIncidentId) || null,
    [allIncidents, selectedIncidentId]
  );

  const selectedAnalysis = selectedIncidentId ? analysisById[selectedIncidentId] : null;

  const displayedIncidents = useMemo(() => {
    let filtered = allIncidents;
    if (statusFilter !== 'All') {
      filtered = filtered.filter((i) => {
        const lowerStatus = i.status.toLowerCase();
        if (statusFilter === 'Resolved') return lowerStatus.includes('resolve') || lowerStatus.includes('close') || lowerStatus === 'resolved';
        if (statusFilter === 'In Progress') return lowerStatus.includes('progress');
        if (statusFilter === 'Open') return lowerStatus === 'open';
        return true;
      });
    }
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      filtered = filtered.filter((i) =>
        i.id.toLowerCase().includes(lowerQ) ||
        i.service.toLowerCase().includes(lowerQ)
      );
    }
    return filtered;
  }, [allIncidents, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const openCount = allIncidents.filter((incident) => {
      const key = String(incident.status).toLowerCase();
      return key.includes('open') || key.includes('progress');
    }).length;
    const resolvedCount = allIncidents.length - openCount;
    const criticalCount = allIncidents.filter((incident) => String(incident.severity).toLowerCase().includes('critical')).length;
    const highCount = allIncidents.filter((incident) => String(incident.severity).toLowerCase().includes('high')).length;
    return {
      total: allIncidents.length,
      open: openCount,
      resolved: resolvedCount,
      critical: criticalCount,
      high: highCount,
    };
  }, [allIncidents]);

  const fetchRootInfo = async (signal) => {
    const response = await fetch(`${INCIDENT_TRIAGE_API_BASE}/incident-triage/`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
    });
    if (!response.ok) throw new Error(`Root API failed: ${response.status}`);
    const payload = await response.json();
    setRootInfo(payload);
  };

  const fetchIncidents = async (signal) => {
    const statuses = ['Open', 'In Progress', 'Resolved'];
    const promises = statuses.map((status) =>
      fetch(`${INCIDENT_TRIAGE_API_BASE}/incident-triage/get-incidents?status=${encodeURIComponent(status)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal,
      })
        .then((res) => {
          if (!res.ok) return [];
          return res.json().then((payload) => extractIncidentsArray(payload));
        })
        .catch(() => [])
    );
    const results = await Promise.all(promises);
    const all = results.flat();

    const uniqueMap = new Map();
    all.forEach((item) => {
      const id = firstValue(item.number, item.incident_id, item.id, item.request_id);
      if (!uniqueMap.has(id)) uniqueMap.set(id, item);
    });

    const normalized = Array.from(uniqueMap.values())
      .map((item, index) => normalizeIncident(item, index))
      .sort((a, b) => b.incidentNumber - a.incidentNumber);

    setAllIncidents(normalized);
  };

  const refreshAll = async () => {
    if (!INCIDENT_TRIAGE_API_BASE) {
      setApiMessage('Missing VITE_INCIDENT_TRIAGE_API_URL in environment configuration.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    try {
      setLoading(true);
      setApiMessage('');
      await Promise.all([
        fetchRootInfo(controller.signal),
        fetchIncidents(controller.signal),
      ]);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setApiMessage(error.message || 'Unable to reach incident triage APIs right now.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const handleAnalyze = async (incident) => {
    if (!incident || !INCIDENT_TRIAGE_API_BASE) return;
    setAnalyzingId(incident.id);
    setSelectedIncidentId(incident.id);
    setApiMessage('');
    console.log(incident, "incident")
    const incidentId = incident.id;
    try {
      const response = await fetch(
        `${INCIDENT_TRIAGE_API_BASE}/incident-triage/analyze?incident_id=${encodeURIComponent(incidentId)}`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            req_id: incidentId,
            status: incident.status,
          }),
        }
      );

      if (!response.ok) {
        let detail = `Analyze API failed: ${response.status}`;
        try {
          const errPayload = await response.json();
          detail = firstValue(errPayload?.detail, errPayload?.message, detail);
        } catch {
          // ignore parse errors
        }
        throw new Error(detail);
      }

      const payload = await response.json();
      setAnalysisById((prev) => ({ ...prev, [incident.id]: payload }));
      setExpandedAnalysis((prev) => ({ ...prev, [incident.id]: true }));
      setActiveTab('AI RCA');
    } catch (error) {
      setApiMessage(error.message || 'Failed to analyze incident.');
    } finally {
      setAnalyzingId('');
    }
  };

  const openResolveModal = (incident) => {
    setIncidentToResolve(incident);
    setResolutionNote('');
    setResolveModalOpen(true);
  };

  const closeResolveModal = () => {
    setResolveModalOpen(false);
    setIncidentToResolve(null);
    setResolutionNote('');
  };

  const submitResolution = async () => {
    if (!incidentToResolve || !INCIDENT_TRIAGE_API_BASE) return;
    const incident = incidentToResolve;
    setResolvingId(incident.id);
    setApiMessage('');
    const incidentId = incident.id;
    const note = resolutionNote.trim() || 'Resolved via Incident Triage UI';

    try {
      const response = await fetch(`${INCIDENT_TRIAGE_API_BASE}/incident-triage/resolve`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incident_id: incidentId,
          resolution: note,
          status: 'RESOLVED',
        }),
      });

      if (!response.ok) {
        let detail = `Resolve API failed: ${response.status}`;
        try {
          const errPayload = await response.json();
          detail = firstValue(errPayload?.detail, errPayload?.message, detail);
        } catch {
          // ignore parse errors
        }
        throw new Error(detail);
      }

      setAllIncidents((prev) =>
        prev.map((item) => (item.id === incident.id ? { ...item, status: 'Resolved' } : item))
      );
      closeResolveModal();
    } catch (error) {
      setApiMessage(error.message || 'Failed to resolve incident.');
      closeResolveModal();
    } finally {
      setResolvingId('');
    }
  };

  const confidencePercent = Math.round(
    Number(
      firstValue(
        selectedAnalysis?.confidence_score,
        selectedAnalysis?.analysis?.confidence_score,
        selectedAnalysis?.confidence,
        0
      )
    ) * 100
  );

  const rootCauseText = firstValue(
    selectedAnalysis?.analysis?.root_cause,
    selectedAnalysis?.root_cause,
    selectedAnalysis?.analysis_summary,
    selectedAnalysis?.summary,
    selectedIncident?.title,
    'Select an incident and click Analyze to generate AI RCA.'
  );

  const evidenceItems = firstValue(
    selectedAnalysis?.evidence,
    selectedAnalysis?.analysis?.related_errors,
    []
  );

  const recommendationItems = firstValue(
    selectedAnalysis?.recommendations,
    selectedAnalysis?.analysis?.recommendations,
    []
  );

  const timelineItems = firstValue(
    selectedAnalysis?.timeline,
    selectedAnalysis?.analysis?.timeline,
    []
  );

  const similarItems = firstValue(
    selectedAnalysis?.similar_incidents,
    selectedAnalysis?.analysis?.similar_incidents,
    []
  );

  const activityItems = firstValue(
    selectedAnalysis?.activity,
    selectedAnalysis?.analysis?.activity,
    []
  );

  return (
    <div className="w-full bg-[#f5f7fb] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1450px] gap-5 items-start lg:grid-cols-[256px_minmax(0,1fr)]">
        <aside className="order-2 lg:order-1 border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="space-y-1 px-4 pb-4 pt-3">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => item.path && navigate(item.path)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-[15px] transition ${item.active
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

        <section className="order-1 lg:order-2 min-w-0 border border-slate-200 bg-white px-4 pb-6 pt-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:px-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-2xl sm:text-[30px] leading-tight font-sans font-bold text-[#1e293b]">Intelligent Incident Triage</h2>
              <p className="mt-1 text-sm text-slate-500">Integrated with incident triage APIs for fetch, analyze, and resolve workflows.</p>
            </div>

            <button
              type="button"
              onClick={() => refreshAll(statusFilter)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {apiMessage ? (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              {apiMessage}
            </div>
          ) : null}


          <div className="mb-4 flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="status-filter" className="text-sm font-medium text-slate-600">Status</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-9 w-40 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-indigo-400"
              >
                <option value="All">All</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] max-w-sm">
              <label htmlFor="search" className="text-sm font-medium text-slate-600">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="search"
                  type="text"
                  placeholder="Search by Incident ID or User Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-indigo-400"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h4 className="text-lg font-semibold text-slate-900">Incidents</h4>
              {loading ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading
                </span>
              ) : null}
            </div>

            <div className="space-y-2">
              {displayedIncidents.map((incident) => {
                const severity = severityTone(incident.severity);
                return (
                  <article
                    key={incident.id}
                    className={`rounded-lg border px-3 py-3 transition ${selectedIncidentId === incident.id
                      ? 'border-indigo-200 bg-indigo-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-indigo-700">{incident.id}</span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${severity.chip}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${severity.dot}`} />
                            {incident.severity}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">{incident.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {incident.service}
                          {formatDateTime(incident.timestamp) !== 'N/A' && ` • ${formatDateTime(incident.timestamp)}`}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {!analysisById[incident.id] ? (
                          <button
                            type="button"
                            onClick={() => handleAnalyze(incident)}
                            disabled={analyzingId === incident.id}
                            className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                          >
                            {analyzingId === incident.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                            Analyze
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setExpandedAnalysis(prev => ({ ...prev, [incident.id]: !prev[incident.id] }))}
                            className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-200"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {expandedAnalysis[incident.id] ? "Hide Analysis" : "Show Analysis"}
                            {expandedAnalysis[incident.id] ? <ChevronUp className="h-3 w-3 ml-0.5" /> : <ChevronDown className="h-3 w-3 ml-0.5" />}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openResolveModal(incident)}
                          disabled={resolvingId === incident.id || incident.status.toLowerCase().includes('resolve') || incident.status === 'RESOLVED'}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {resolvingId === incident.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                          {incident.status.toLowerCase().includes('resolve') || incident.status === 'RESOLVED' ? 'Resolved' : 'Resolve'}
                        </button>
                      </div>
                    </div>

                    {/* AI Analysis Accordion content */}
                    {analysisById[incident.id] && expandedAnalysis[incident.id] && (
                      <div className="mt-4 pt-4 border-t border-indigo-100 flex flex-col gap-4 text-sm animate-in fade-in slide-in-from-top-2">
                        <div>
                          <p className="font-semibold text-indigo-900 mb-1 flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> AI Summary
                          </p>
                          <p className="text-slate-700 leading-relaxed bg-white/50 p-2.5 rounded-lg border border-indigo-50/50">
                            {analysisById[incident.id].summary || 'No summary provided.'}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-indigo-900 mb-1">Root Cause</p>
                          <p className="text-slate-700 leading-relaxed bg-white/50 p-2.5 rounded-lg border border-indigo-50/50">
                            {analysisById[incident.id].root_cause || 'No root cause identified.'}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold text-indigo-900 mb-1">Recommendation</p>
                          <p className="text-slate-700 leading-relaxed bg-white/50 p-2.5 rounded-lg border border-indigo-50/50">
                            {analysisById[incident.id].recommendation || 'No recommendation provided.'}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-6 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/50">
                          <div>
                            <p className="font-semibold text-indigo-900 mb-0.5 text-xs uppercase tracking-wide">Confidence</p>
                            <p className="text-slate-800 font-medium">
                              {analysisById[incident.id].confidence || 'Unknown'}
                            </p>
                          </div>
                          <div>
                            <p className="font-semibold text-indigo-900 mb-0.5 text-xs uppercase tracking-wide">Estimated Effort</p>
                            <p className="text-slate-800 font-medium">
                              {analysisById[incident.id].estimated_effort || 'Unknown'}
                            </p>
                          </div>
                        </div>

                        {Array.isArray(analysisById[incident.id].similar_incidents) && analysisById[incident.id].similar_incidents.length > 0 && (
                          <div>
                            <p className="font-semibold text-indigo-900 mb-2">Similar Incidents</p>
                            <div className="flex flex-col gap-2">
                              {analysisById[incident.id].similar_incidents.map((sim, i) => (
                                <div key={i} className="bg-white border border-indigo-100 p-3 rounded-lg shadow-sm">
                                  <div className="font-semibold text-indigo-700 text-sm">
                                    {sim.incident_id} <span className="text-slate-400 font-normal ml-1">|</span> {sim.short_description}
                                  </div>
                                  <div className="text-slate-600 mt-1.5 text-xs leading-relaxed">
                                    <span className="font-medium text-slate-700">Resolution:</span> {sim.resolution}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}

              {!loading && displayedIncidents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
                  No incidents matched your search or filter.
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {/* Resolution Modal */}
      {resolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 p-5">
              <h3 className="text-lg font-bold text-slate-900">Resolve Incident</h3>
              <p className="mt-1 text-sm text-slate-500">Provide a resolution note for <span className="font-semibold text-slate-700">{incidentToResolve?.id}</span>.</p>
            </div>
            <div className="p-5">
              <label htmlFor="resolutionNote" className="mb-2 block text-sm font-medium text-slate-700">
                Resolution Note
              </label>
              <textarea
                id="resolutionNote"
                rows={4}
                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                placeholder="Describe how the incident was resolved..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 p-5 bg-slate-50 rounded-b-xl">
              <button
                type="button"
                onClick={closeResolveModal}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitResolution}
                disabled={resolvingId === incidentToResolve?.id || !resolutionNote.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition"
              >
                {resolvingId === incidentToResolve?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default IncidentTriage;
