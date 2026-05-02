import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, Bot, Clock, Home, LifeBuoy, Search, Settings,
  Sparkles, UserRound, CheckCircle, XCircle,
  Loader2, ChevronDown, ChevronRight, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FALLBACK_ACCESS_REQUESTS = [
  { request_id: 'REQ010', user_id: 'U001', user_name: 'Dr. Alice Smith', resource_id: 'RES006', resource_name: 'Oncology Pipeline', requested_action: 'run', status: 'PENDING', created_at: '2026-04-23T09:30:00Z', requested_by: 'Self', priority: 'High' },
  { request_id: 'REQ009', user_id: 'U010', user_name: 'John Carter', resource_id: 'RES002', resource_name: 'Diabetes Analysis Dataset', requested_action: 'read', status: 'PENDING', created_at: '2026-04-23T08:00:00Z', requested_by: 'Self', priority: 'Medium' },
  { request_id: 'REQ008', user_id: 'U009', user_name: 'Isha Verma', resource_id: 'RES001', resource_name: 'Oncology Patient Dataset', requested_action: 'read', status: 'PENDING', created_at: '2026-04-22T16:00:00Z', requested_by: 'Self', priority: 'Low' },
  { request_id: 'REQ006', user_id: 'U007', user_name: 'Grace Liu', resource_id: 'RES004', resource_name: 'Neurology Biomarker Dataset', requested_action: 'read', status: 'PENDING', created_at: '2026-04-22T14:00:00Z', requested_by: 'Manager', priority: 'Medium' },
  { request_id: 'REQ004', user_id: 'U004', user_name: 'David Kim', resource_id: 'RES008', resource_name: 'Cardiology Submission Report', requested_action: 'approve', status: 'PENDING', created_at: '2026-04-21T12:00:00Z', requested_by: 'Admin', priority: 'High' },
  { request_id: 'REQ002', user_id: 'U002', user_name: 'Dr. Bob Lee', resource_id: 'RES001', resource_name: 'Oncology Patient Dataset', requested_action: 'read', status: 'PENDING', created_at: '2026-04-20T10:00:00Z', requested_by: 'Self', priority: 'Low' },
];

const USER_ACCESS_API_BASE =
  (import.meta.env?.VITE_BACKEND_BASE_URL ?? '').replace(/\/$/, '');

const menuItems = [
  { label: 'Home', icon: Home, path: '/', active: false },
  { label: 'Intelligent Incident Triage', icon: Sparkles, path: '/incident-triage', active: false },
  { label: 'User Access Management', icon: UserRound, path: '/user-access', active: true },
  { label: 'Bug Logs Summary & RCA', icon: AlertTriangle, path: '/bug-report', active: false },
  { label: 'Settings', icon: Settings, path: null, active: false },
];

/* ─── Derive priority from the requested_action when the API doesn't return it ─── */
const derivePriority = (action, resourceName) => {
  const act = String(action || '').toLowerCase();
  const res = String(resourceName || '').toLowerCase();
  if (act === 'approve' || act === 'admin' || act === 'delete') return 'High';
  if (act === 'write' || act === 'run' || act === 'export') return 'Medium';
  if (res.includes('patient') || res.includes('oncology')) return 'Medium';
  return 'Low';
};

const toneByPriority = (value) => {
  const key = String(value || '').toLowerCase();
  if (key.includes('critical') || key.includes('high')) return { chip: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' };
  if (key.includes('medium')) return { chip: 'bg-amber-100 text-amber-600', dot: 'bg-amber-500' };
  return { chip: 'bg-emerald-100 text-emerald-600', dot: 'bg-emerald-500' };
};

const toneByStatus = (value) => {
  const key = String(value || '').toLowerCase();
  if (key.includes('pending')) return 'bg-sky-100 text-sky-600';
  if (key.includes('approved')) return 'bg-emerald-100 text-emerald-600';
  if (key.includes('rejected')) return 'bg-rose-100 text-rose-600';
  return 'bg-slate-100 text-slate-600';
};

const formatDate = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
};

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return `${Math.floor(diffMs / (1000 * 60))}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return `${diffDays}d ago`;
};

/* ─── Normalize API data to include derived fields ─── */
const normalizeRequest = (req) => ({
  ...req,
  priority: req.priority || derivePriority(req.requested_action, req.resource_name),
  requested_by: req.requested_by || 'Self',
});

const pickBackendNumber = (...values) => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value);
  }
  return null;
};

const pickBackendText = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim() !== '') return value;
  }
  return null;
};

export default function UserAccess() {
  const navigate = useNavigate();
  const [accessRequests, setAccessRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [accessTypeFilter, setAccessTypeFilter] = useState('all');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDescending, setSortDescending] = useState(true);
  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState('');
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [actionInProgress, setActionInProgress] = useState({});
  const [analysisResults, setAnalysisResults] = useState({});
  const [backendSummary, setBackendSummary] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRequestData, setNewRequestData] = useState({
    user_id: '',
    resource_name: 'Oncology Patient Dataset',
    requested_action: 'read',
    justification: ''
  });

  useEffect(() => {
    // Create a fresh AbortController each mount — fixes React 18 StrictMode
    // double-mount where the first unmount aborts a shared ref controller.
    const controller = new AbortController();

    const fetchAccessRequests = async () => {
      try {
        setLoading(true);
        setApiStatus('');
        const allRequests = [];
        const summaryAccumulator = {};
        for (const status of ['PENDING', 'APPROVED', 'REJECTED']) {
          try {
            const response = await fetch(
              `${USER_ACCESS_API_BASE}/user-access/get-access-requests?status=${status}`,
              { signal: controller.signal }
            );
            if (!response.ok) throw new Error(`API error: ${response.status}`);
            const data = await response.json();
            const requests = Array.isArray(data?.data) ? data.data : [];
            allRequests.push(...requests.map(normalizeRequest));

            const meta = data?.meta || data?.summary || {};
            summaryAccumulator.pending = pickBackendNumber(
              summaryAccumulator.pending,
              data?.pending,
              meta?.pending,
              meta?.pending_count
            );
            summaryAccumulator.approved = pickBackendNumber(
              summaryAccumulator.approved,
              data?.approved,
              meta?.approved,
              meta?.approved_count
            );
            summaryAccumulator.rejected = pickBackendNumber(
              summaryAccumulator.rejected,
              data?.rejected,
              meta?.rejected,
              meta?.rejected_count
            );
            summaryAccumulator.avgApprovalTime = pickBackendText(
              summaryAccumulator.avgApprovalTime,
              data?.avg_approval_time,
              data?.avgApprovalTime,
              meta?.avg_approval_time,
              meta?.avgApprovalTime
            );
            summaryAccumulator.reviewsDue = pickBackendNumber(
              summaryAccumulator.reviewsDue,
              data?.reviews_due,
              data?.reviewsDue,
              meta?.reviews_due,
              meta?.reviewsDue
            );
          } catch (error) {
            if (error.name !== 'AbortError') console.error(`Failed to fetch ${status} requests:`, error);
          }
        }
        if (allRequests.length === 0) {
          setApiStatus('API unavailable - using demo data');
          setAccessRequests(FALLBACK_ACCESS_REQUESTS);
          setBackendSummary({});
        } else {
          setApiStatus('');
          setAccessRequests(allRequests);
          setBackendSummary(summaryAccumulator);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching access requests:', error);
          setApiStatus('API unavailable - using demo data');
          setAccessRequests(FALLBACK_ACCESS_REQUESTS);
          setBackendSummary({});
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAccessRequests();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    let results = [...accessRequests];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter((req) =>
        req.request_id.toLowerCase().includes(query) ||
        req.user_name.toLowerCase().includes(query) ||
        req.resource_name.toLowerCase().includes(query)
      );
    }
    if (statusFilter !== 'all') results = results.filter((req) => req.status.toLowerCase() === statusFilter.toLowerCase());
    if (priorityFilter !== 'all') results = results.filter((req) => (req.priority || '').toLowerCase() === priorityFilter.toLowerCase());
    if (accessTypeFilter !== 'all') results = results.filter((req) => req.requested_action.toLowerCase() === accessTypeFilter.toLowerCase());
    if (resourceFilter !== 'all') results = results.filter((req) => req.resource_id === resourceFilter);
    results.sort((a, b) => {
      let aVal = a[sortBy], bVal = b[sortBy];
      if (sortBy === 'created_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      } else if (typeof aVal === 'string') {
        aVal = (aVal || '').toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sortDescending ? -comparison : comparison;
    });
    setFilteredRequests(results);
  }, [accessRequests, searchQuery, statusFilter, priorityFilter, accessTypeFilter, resourceFilter, sortBy, sortDescending]);

  const stats = useMemo(() => {
    const pendingFromRows = accessRequests.filter((r) => r.status.toLowerCase() === 'pending').length;
    const approvedFromRows = accessRequests.filter((r) => r.status.toLowerCase() === 'approved').length;
    const rejectedFromRows = accessRequests.filter((r) => r.status.toLowerCase() === 'rejected').length;
    const totalRequestsFromRows = accessRequests.length;
    const uniqueResourcesFromRows = new Set(
      accessRequests
        .map((r) => r.resource_id || r.resource_name)
        .filter(Boolean)
    ).size;

    return {
      pending: pickBackendNumber(backendSummary.pending, pendingFromRows) ?? 0,
      approved: pickBackendNumber(backendSummary.approved, approvedFromRows) ?? 0,
      rejected: pickBackendNumber(backendSummary.rejected, rejectedFromRows) ?? 0,
      totalRequests: pickBackendNumber(backendSummary.total, backendSummary.total_count, totalRequestsFromRows) ?? 0,
      uniqueResources: pickBackendNumber(backendSummary.unique_resources, backendSummary.uniqueResources, uniqueResourcesFromRows) ?? 0,
    };
  }, [accessRequests, backendSummary]);

  const uniqueResources = useMemo(() => [...new Set(accessRequests.map((r) => r.resource_id))].sort(), [accessRequests]);
  const accessTypes = useMemo(() => [...new Set(accessRequests.map((r) => r.requested_action))].sort(), [accessRequests]);

  /* ─── Decision handler: sends required approver_id to backend ─── */
  const handleDecision = async (requestId, decision) => {
    setActionInProgress((prev) => ({ ...prev, [requestId]: decision }));
    try {
      const decisionCandidates =
        decision === 'approved'
          ? ['APPROVED', 'approved', 'approve']
          : ['REJECTED', 'rejected', 'reject'];

      let appliedStatus = null;
      let lastError = null;

      for (const decisionValue of decisionCandidates) {
        const response = await fetch(
          `${USER_ACCESS_API_BASE}/user-access/access-requests/${requestId}/decision`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              decision: decisionValue,
              req_id: requestId,
              request_id: requestId,
              approver_id: 'UI_APPROVER',
              comments: `${decisionValue} via UI`,
              roles_to_assign: [],
            }),
          }
        );

        if (response.ok) {
          appliedStatus = decisionValue.toUpperCase().startsWith('APPROV') ? 'APPROVED' : 'REJECTED';
          break;
        }

        let detail = `Decision failed: ${response.status}`;
        try {
          const errBody = await response.json();
          detail = errBody?.detail || errBody?.message || JSON.stringify(errBody);
        } catch {
          // Ignore JSON parse errors and keep default detail text.
        }
        lastError = new Error(detail);

        // If the backend accepted the payload shape but rejected business logic,
        // don't retry alternate decision formats.
        if (response.status !== 400 && response.status !== 422) break;
      }

      if (!appliedStatus) {
        throw lastError || new Error('Decision request failed');
      }

      // Update local state to reflect the decision
      setAccessRequests((prev) =>
        prev.map((req) =>
          req.request_id === requestId
            ? { ...req, status: appliedStatus }
            : req
        )
      );

      // Clear any analysis result for this request
      setAnalysisResults((prev) => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });
    } catch (error) {
      console.error('Error making decision:', error);
      alert(`Failed to ${decision} request: ${error.message}`);
    } finally {
      setActionInProgress((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  /* ─── Analyze handler: sends required req_id and status in body ─── */
  const handleAnalyze = async (request) => {
    const requestId = request.request_id;
    setActionInProgress((prev) => ({ ...prev, [requestId]: 'analyzing' }));
    // Open accordion immediately so users can see analysis progress.
    setExpandedRequest(requestId);
    // Clear any previous error for this request
    setAnalysisResults((prev) => {
      const updated = { ...prev };
      if (updated[requestId]?._error) delete updated[requestId];
      return updated;
    });

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for LLM

      const response = await fetch(
        `${USER_ACCESS_API_BASE}/user-access/${requestId}/analyze`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            req_id: requestId,
            status: request.status,
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!response.ok) {
        let detail = `Server returned ${response.status}`;
        try {
          const errBody = await response.json();
          detail = errBody?.detail || detail;
        } catch { /* ignore */ }
        throw new Error(detail);
      }

      const analysisResult = await response.json();

      // Store analysis result for this request
      setAnalysisResults((prev) => ({ ...prev, [requestId]: analysisResult }));

      // Auto-expand the row to show results
      setExpandedRequest(requestId);
    } catch (error) {
      console.error('Error analyzing request:', error);

      // Determine user-friendly error message
      let userMessage;
      if (error.name === 'AbortError') {
        userMessage = 'Analysis timed out — the AI agent is taking too long. Please try again.';
      } else if (error.message === 'Failed to fetch') {
        userMessage = 'Cannot reach the backend AI agent. The server may have crashed while processing. Check if the backend is running and try again.';
      } else {
        userMessage = `Analysis failed: ${error.message}`;
      }

      // Store error inline instead of using alert()
      setAnalysisResults((prev) => ({
        ...prev,
        [requestId]: { _error: true, _message: userMessage },
      }));
      setExpandedRequest(requestId);
    } finally {
      setActionInProgress((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  /* ─── Refresh data from backend ─── */
  const refreshData = async () => {
    const controller = new AbortController();
    setLoading(true);
    setApiStatus('');
    try {
      const allRequests = [];
      const summaryAccumulator = {};
      for (const status of ['PENDING', 'APPROVED', 'REJECTED']) {
        const response = await fetch(
          `${USER_ACCESS_API_BASE}/user-access/get-access-requests?status=${status}`,
          { signal: controller.signal }
        );
        if (response.ok) {
          const data = await response.json();
          const requests = Array.isArray(data?.data) ? data.data : [];
          allRequests.push(...requests.map(normalizeRequest));

          const meta = data?.meta || data?.summary || {};
          summaryAccumulator.pending = pickBackendNumber(summaryAccumulator.pending, data?.pending, meta?.pending, meta?.pending_count);
          summaryAccumulator.approved = pickBackendNumber(summaryAccumulator.approved, data?.approved, meta?.approved, meta?.approved_count);
          summaryAccumulator.rejected = pickBackendNumber(summaryAccumulator.rejected, data?.rejected, meta?.rejected, meta?.rejected_count);
          summaryAccumulator.avgApprovalTime = pickBackendText(summaryAccumulator.avgApprovalTime, data?.avg_approval_time, data?.avgApprovalTime, meta?.avg_approval_time, meta?.avgApprovalTime);
          summaryAccumulator.reviewsDue = pickBackendNumber(summaryAccumulator.reviewsDue, data?.reviews_due, data?.reviewsDue, meta?.reviews_due, meta?.reviewsDue);
        }
      }
      if (allRequests.length > 0) {
        setAccessRequests(allRequests);
        setBackendSummary(summaryAccumulator);
        setApiStatus('');
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Create request matching exactly the payload expected by the backend
      const payload = {
        user_id: "",
        resource_name: newRequestData.resource_name,
        requested_action: newRequestData.requested_action,
        justification: newRequestData.justification
      };

      const response = await fetch(`${USER_ACCESS_API_BASE}/user-access/create-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to create request');

      setIsModalOpen(false);
      setNewRequestData({ user_id: '', resource_name: 'Oncology Patient Dataset', requested_action: 'read', justification: '' });
      refreshData();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-white py-4 sm:py-6">
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
                    className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[15px] transition ${item.active
                        ? 'border border-indigo-100 bg-indigo-50 font-semibold text-indigo-700 shadow-sm'
                        : 'border border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-800'
                      }`}
                  >
                    <span className={`flex h-7 w-7 items-center justify-center rounded ${item.active ? 'bg-white text-indigo-600' : 'text-slate-500'}`}>
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
            <div className="mb-6 pb-5 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl sm:text-[32px] leading-tight font-sans font-bold text-[#1e293b]">User Access Management</h2>
                <p className="mt-1 text-sm text-slate-500">Manage and approve access requests</p>
                {apiStatus && <div className="mt-3 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">{apiStatus}</div>}
              </div>
              <div className="flex items-center gap-3">

                <button
                  type="button"
                  onClick={refreshData}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                  <div className="text-sm font-medium text-slate-600">Pending Requests</div>
                  <div className="mt-2 flex items-end gap-2">
                    <div className="text-3xl font-bold text-slate-900">{stats.pending}</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                  <div className="text-sm font-medium text-slate-600">Approved</div>
                  <div className="mt-2 flex items-end gap-2">
                    <div className="text-3xl font-bold text-slate-900">{stats.approved}</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                  <div className="text-sm font-medium text-slate-600">Rejected</div>
                  <div className="mt-2 flex items-end gap-2">
                    <div className="text-3xl font-bold text-slate-900">{stats.rejected}</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                  <div className="text-sm font-medium text-slate-600">Total Requests</div>
                  <div className="mt-2 flex items-end gap-2">
                    <div className="text-3xl font-bold text-slate-900">{stats.totalRequests}</div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                  <div className="text-sm font-medium text-slate-600">Unique Resources</div>
                  <div className="mt-2 flex items-end gap-2">
                    <div className="text-3xl font-bold text-slate-900">{stats.uniqueResources}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                    <input type="text" placeholder="Search by Request ID, User, or Resource..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="all">Status: All</option>
                      <option value="pending">Status: Pending</option>
                      <option value="approved">Status: Approved</option>
                      <option value="rejected">Status: Rejected</option>
                    </select>
                    <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="all">Priority: All</option>
                      <option value="high">Priority: High</option>
                      <option value="medium">Priority: Medium</option>
                      <option value="low">Priority: Low</option>
                    </select>
                    <select value={accessTypeFilter} onChange={(e) => setAccessTypeFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="all">Access Type: All</option>
                      {accessTypes.map((type) => <option key={type} value={type}>Access Type: {type}</option>)}
                    </select>
                    <select value={resourceFilter} onChange={(e) => setResourceFilter(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="all">Resource: All</option>
                      {uniqueResources.map((resource) => <option key={resource} value={resource}>{resource}</option>)}
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value="created_at">Sort by Date</option>
                      <option value="user_name">Sort by User</option>
                      <option value="priority">Sort by Priority</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Request ID</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Resource</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Access Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Requested At</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-500 border-t-transparent" />
                              Loading requests from backend...
                            </div>
                          </td>
                        </tr>
                      ) : filteredRequests.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                            No access requests found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredRequests.map((request) => (
                          <React.Fragment key={request.request_id}>
                            <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 text-sm font-semibold text-indigo-600">{request.request_id}</td>
                              <td className="px-6 py-4 text-sm text-slate-900">{request.user_name}</td>
                              <td className="px-6 py-4 text-sm text-slate-700">{request.resource_name}</td>
                              <td className="px-6 py-4 text-sm text-slate-700 capitalize">{request.requested_action}</td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                <div className="text-xs text-slate-500">{formatTime(request.created_at)}</div>
                                <div className="text-xs text-slate-400">{formatDate(request.created_at)}</div>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${toneByStatus(request.status)}`}>
                                  {request.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="inline-flex items-center gap-1">
                                  {request.status.toLowerCase() === 'pending' && (
                                    <>
                                      <button
                                        type="button"
                                        title="Approve"
                                        onClick={() => handleDecision(request.request_id, 'approved')}
                                        disabled={!!actionInProgress[request.request_id]}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {actionInProgress[request.request_id] === 'approved' ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <CheckCircle className="h-3.5 w-3.5" />
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        title="Reject"
                                        onClick={() => handleDecision(request.request_id, 'rejected')}
                                        disabled={!!actionInProgress[request.request_id]}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {actionInProgress[request.request_id] === 'rejected' ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <XCircle className="h-3.5 w-3.5" />
                                        )}
                                      </button>
                                    </>
                                  )}
                                  <button
                                    type="button"
                                    title="Analyze"
                                    onClick={() => handleAnalyze(request)}
                                    disabled={actionInProgress[request.request_id] === 'analyzing'}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {actionInProgress[request.request_id] === 'analyzing' ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Bot className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {expandedRequest === request.request_id && (actionInProgress[request.request_id] === 'analyzing' || !!analysisResults[request.request_id]) && (
                              <tr className="bg-slate-50 border-t border-b border-slate-200">
                                <td colSpan="7" className="px-6 py-4">
                                  {/* Analysis results panel */}
                                  {actionInProgress[request.request_id] === 'analyzing' && !analysisResults[request.request_id] && (
                                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
                                      <p className="flex items-center gap-2 text-sm font-medium text-indigo-700">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Running AI analysis...
                                      </p>
                                    </div>
                                  )}

                                  {analysisResults[request.request_id] && (
                                    <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-white p-5 space-y-4">
                                      <div className="flex items-center justify-between">
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-900">
                                          <Sparkles className="h-4 w-4 text-indigo-600" /> AI Analysis Result
                                        </h4>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setAnalysisResults((prev) => { const u = { ...prev }; delete u[request.request_id]; return u; });
                                            setExpandedRequest(null);
                                          }}
                                          className="text-slate-400 hover:text-slate-600"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      </div>

                                      {/* Summary */}
                                      {analysisResults[request.request_id].summary && (
                                        <div className="rounded-lg bg-white border border-indigo-100 p-3">
                                          <p className="text-xs font-semibold text-slate-500 mb-1">Summary</p>
                                          <p className="text-sm text-slate-700 leading-relaxed">{analysisResults[request.request_id].summary}</p>
                                        </div>
                                      )}

                                      <div className="grid gap-3 sm:grid-cols-2">
                                        {/* Current Roles */}
                                        {analysisResults[request.request_id].current_roles?.length > 0 && (
                                          <div className="rounded-lg bg-white border border-slate-100 p-3">
                                            <p className="text-xs font-semibold text-slate-500 mb-2">Current Roles</p>
                                            <div className="space-y-1">
                                              {analysisResults[request.request_id].current_roles.map((role, i) => (
                                                <div key={i} className="flex items-center justify-between text-xs">
                                                  <span className="font-medium text-slate-700">{role.role}</span>
                                                  <span className="text-slate-400">{role.scope}</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Candidate Roles */}
                                        {analysisResults[request.request_id].candidate_roles?.length > 0 && (
                                          <div className="rounded-lg bg-white border border-slate-100 p-3">
                                            <p className="text-xs font-semibold text-slate-500 mb-2">Candidate Roles</p>
                                            <div className="flex flex-wrap gap-1.5">
                                              {analysisResults[request.request_id].candidate_roles.map((role, i) => (
                                                <span key={i} className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{role}</span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Impact */}
                                      {analysisResults[request.request_id].impact && (
                                        <div className={`rounded-lg border p-3 ${analysisResults[request.request_id].impact.risk_level?.toLowerCase() === 'high'
                                            ? 'bg-rose-50 border-rose-200'
                                            : analysisResults[request.request_id].impact.risk_level?.toLowerCase() === 'medium'
                                              ? 'bg-amber-50 border-amber-200'
                                              : 'bg-emerald-50 border-emerald-200'
                                          }`}>
                                          <p className="text-xs font-semibold text-slate-500 mb-1">Impact Assessment</p>
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${analysisResults[request.request_id].impact.risk_level?.toLowerCase() === 'high'
                                                ? 'bg-rose-100 text-rose-700'
                                                : analysisResults[request.request_id].impact.risk_level?.toLowerCase() === 'medium'
                                                  ? 'bg-amber-100 text-amber-700'
                                                  : 'bg-emerald-100 text-emerald-700'
                                              }`}>
                                              {analysisResults[request.request_id].impact.risk_level} Risk
                                            </span>
                                          </div>
                                          <p className="text-xs text-slate-600">{analysisResults[request.request_id].impact.description}</p>
                                        </div>
                                      )}

                                      {/* Recommendation */}
                                      {analysisResults[request.request_id].recommendation && (
                                        <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
                                          <p className="text-xs font-semibold text-slate-500 mb-1">AI Recommendation</p>
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${analysisResults[request.request_id].recommendation.decision?.toLowerCase() === 'approve'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-rose-100 text-rose-700'
                                              }`}>
                                              {analysisResults[request.request_id].recommendation.decision}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                              Confidence: {analysisResults[request.request_id].recommendation.confidence}
                                            </span>
                                          </div>
                                          <p className="text-xs text-slate-600">{analysisResults[request.request_id].recommendation.reason}</p>
                                        </div>
                                      )}

                                      {/* History */}
                                      {analysisResults[request.request_id].history && (
                                        <div className="rounded-lg bg-white border border-slate-100 p-3">
                                          <p className="text-xs font-semibold text-slate-500 mb-2">Request History</p>
                                          <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                              <span className="text-slate-400">Previously Approved:</span>{' '}
                                              <span className="font-medium text-emerald-600">{analysisResults[request.request_id].history.approved_request_ids?.length || 0}</span>
                                            </div>
                                            <div>
                                              <span className="text-slate-400">Previously Rejected:</span>{' '}
                                              <span className="font-medium text-rose-600">{analysisResults[request.request_id].history.rejected_request_ids?.length || 0}</span>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* Quick action based on recommendation */}
                                      {request.status.toLowerCase() === 'pending' && analysisResults[request.request_id].recommendation && (
                                        <div className="flex items-center gap-3 pt-2 border-t border-indigo-100">
                                          <span className="text-xs text-slate-500">AI suggests:</span>
                                          <button
                                            onClick={() => handleDecision(
                                              request.request_id,
                                              analysisResults[request.request_id].recommendation.decision?.toLowerCase() === 'approve' ? 'approved' : 'rejected'
                                            )}
                                            disabled={!!actionInProgress[request.request_id]}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50 ${analysisResults[request.request_id].recommendation.decision?.toLowerCase() === 'approve'
                                                ? 'bg-emerald-500 hover:bg-emerald-600'
                                                : 'bg-rose-500 hover:bg-rose-600'
                                              }`}
                                          >
                                            <Sparkles className="w-3 h-3" />
                                            {analysisResults[request.request_id].recommendation.decision} (AI Recommended)
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </section>
        </div>
      </div>

      {/* Create Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Create Access Request</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">User ID</label>
                <input
                  type="text"
                  placeholder="e.g. U001 (Leave empty for Sachin fallback)"
                  value={newRequestData.user_id}
                  onChange={e => setNewRequestData({ ...newRequestData, user_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Resource Name</label>
                <select
                  value={newRequestData.resource_name}
                  onChange={e => setNewRequestData({ ...newRequestData, resource_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="Oncology Patient Dataset">Oncology Patient Dataset</option>
                  <option value="Diabetes Analysis Dataset">Diabetes Analysis Dataset</option>
                  <option value="Cardiology Results Dataset">Cardiology Results Dataset</option>
                  <option value="Neurology Biomarker Dataset">Neurology Biomarker Dataset</option>
                  <option value="Oncology Pipeline">Oncology Pipeline</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Action</label>
                <select
                  value={newRequestData.requested_action}
                  onChange={e => setNewRequestData({ ...newRequestData, requested_action: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="read">Read</option>
                  <option value="write">Write</option>
                  <option value="approve">Approve</option>
                  <option value="export">Export</option>
                  <option value="run">Run</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Justification (Optional)</label>
                <textarea
                  rows="3"
                  value={newRequestData.justification}
                  onChange={e => setNewRequestData({ ...newRequestData, justification: e.target.value })}
                  placeholder="Why do you need access?"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                ></textarea>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 border border-slate-200">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
