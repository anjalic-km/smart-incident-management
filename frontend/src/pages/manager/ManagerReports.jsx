import { createElement, useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, CheckCircle2, Clock3, FolderKanban, RefreshCcw } from "lucide-react";
import { getAllIssues, getIssueSlaStatus } from "../../api/issuesApi";
import { getAllProjects } from "../../api/projectApi";
import { showError } from "../../utils/toast";

function getApiMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.statusMessage ||
    err?.message ||
    "Something went wrong"
  );
}

function unwrapArrayData(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

function formatStatus(value) {
  return String(value || "-")
    .toLowerCase()
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function formatDateTime(value) {
  if (!value) return "-";
  const normalized = typeof value === "string" ? value.replace(" ", "T") : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return String(value);
  const datePart = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
  return `${datePart} ${timePart}`;
}

function issueCode(id) {
  const num = Number(id);
  if (Number.isNaN(num)) return "-";
  return `ISS-${String(num).padStart(3, "0")}`;
}

function StatCard({ icon, label, value, tone }) {
  const toneMap = {
    indigo: "bg-indigo-100 text-indigo-700",
    amber: "bg-amber-100 text-amber-700",
    emerald: "bg-emerald-100 text-emerald-700",
    rose: "bg-rose-100 text-rose-700"
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-xl p-2 ${toneMap[tone] || toneMap.indigo}`}>
          {icon ? createElement(icon, { className: "h-5 w-5" }) : null}
        </div>
      </div>
    </div>
  );
}

export default function ManagerReports() {
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [slaMap, setSlaMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedProject, setSelectedProject] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedSlaStatus, setSelectedSlaStatus] = useState("ALL");

  const fetchData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    setError("");
    try {
      const [issuesRes, projectsRes] = await Promise.all([getAllIssues(), getAllProjects()]);
      const issuesData = unwrapArrayData(issuesRes);
      const projectsData = unwrapArrayData(projectsRes);
      setIssues(issuesData);
      setProjects(projectsData);

      const slaEntries = await Promise.all(
        issuesData.map(async (issue) => {
          try {
            const res = await getIssueSlaStatus(issue.id);
            return [String(issue.id), String(res?.data?.status || "UNKNOWN").toUpperCase()];
          } catch {
            return [String(issue.id), "UNKNOWN"];
          }
        })
      );
      setSlaMap(new Map(slaEntries));
    } catch (err) {
      const msg = getApiMessage(err);
      setError(msg);
      showError(msg);
      setIssues([]);
      setProjects([]);
      setSlaMap(new Map());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const projectOptions = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      if (project?.id == null) return;
      map.set(String(project.id), project?.name || `Project #${project.id}`);
    });
    issues.forEach((issue) => {
      if (issue?.projectId == null) return;
      if (!map.has(String(issue.projectId))) {
        map.set(String(issue.projectId), issue?.projectName || `Project #${issue.projectId}`);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [issues, projects]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const projectId = issue?.projectId != null ? String(issue.projectId) : "";
      const projectMatch = selectedProject === "ALL" ? true : projectId === selectedProject;
      const status = String(issue?.status || "UNKNOWN").toUpperCase();
      const statusMatch = selectedStatus === "ALL" ? true : status === selectedStatus;
      const slaStatus = String(slaMap.get(String(issue?.id)) || "UNKNOWN").toUpperCase();
      const slaMatch = selectedSlaStatus === "ALL" ? true : slaStatus === selectedSlaStatus;
      return projectMatch && statusMatch && slaMatch;
    });
  }, [issues, selectedProject, selectedStatus, selectedSlaStatus, slaMap]);

  const summary = useMemo(() => {
    const source = selectedProject === "ALL" ? issues : issues.filter((i) => String(i?.projectId || "") === selectedProject);
    return {
      total: source.length,
      open: source.filter((i) => ["CREATED", "OPEN"].includes(String(i?.status || "").toUpperCase())).length,
      inProgress: source.filter((i) => String(i?.status || "").toUpperCase() === "IN_PROGRESS").length,
      resolved: source.filter((i) => String(i?.status || "").toUpperCase() === "RESOLVED").length,
      closed: source.filter((i) => String(i?.status || "").toUpperCase() === "CLOSED").length
    };
  }, [issues, selectedProject]);

  const slaSummary = useMemo(() => {
    let onTrack = 0;
    let atRisk = 0;
    let breached = 0;
    let notStarted = 0;
    filteredIssues.forEach((issue) => {
      const key = String(slaMap.get(String(issue?.id)) || "UNKNOWN").toUpperCase();
      if (key === "ON_TRACK") onTrack += 1;
      if (key === "AT_RISK") atRisk += 1;
      if (key === "BREACHED") breached += 1;
      if (key === "NOT_STARTED") notStarted += 1;
    });
    return { onTrack, atRisk, breached, notStarted };
  }, [filteredIssues, slaMap]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manager Reports</h1>
          <p className="mt-1 text-sm text-gray-600">Project-wise reporting for issue and SLA insights.</p>
        </div>
        <button
          type="button"
          onClick={() => fetchData({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={FolderKanban} label="Total Issues" value={summary.total} tone="indigo" />
        <StatCard icon={AlertCircle} label="Created/Open" value={summary.open} tone="rose" />
        <StatCard icon={Clock3} label="In Progress" value={summary.inProgress} tone="amber" />
        <StatCard icon={Check} label="Resolved" value={summary.resolved} tone="emerald" />
        <StatCard icon={CheckCircle2} label="Closed" value={summary.closed} tone="emerald" />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Projects</option>
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Issue Status</option>
            <option value="CREATED">Created</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select
            value={selectedSlaStatus}
            onChange={(e) => setSelectedSlaStatus(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All SLA Status</option>
            <option value="ON_TRACK">On Track</option>
            <option value="AT_RISK">At Risk</option>
            <option value="BREACHED">Breached</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-indigo-50 p-3">
            <p className="text-xs font-semibold uppercase text-indigo-700">Not Started</p>
            <p className="mt-1 text-2xl font-bold text-indigo-900">{slaSummary.notStarted}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3">
            <p className="text-xs font-semibold uppercase text-emerald-700">On Track</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{slaSummary.onTrack}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3">
            <p className="text-xs font-semibold uppercase text-amber-700">At Risk</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">{slaSummary.atRisk}</p>
          </div>
          <div className="rounded-xl bg-red-50 p-3">
            <p className="text-xs font-semibold uppercase text-red-700">Breached</p>
            <p className="mt-1 text-2xl font-bold text-red-900">{slaSummary.breached}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Filtered Result</h2>
          <p className="text-sm text-gray-600">
            {filteredIssues.length} issue{filteredIssues.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Issue</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Severity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">SLA Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-600" colSpan={6}>Loading report...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-red-700" colSpan={6}>Failed to load report: {error}</td>
                </tr>
              ) : filteredIssues.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-600" colSpan={6}>No issues found for selected filters.</td>
                </tr>
              ) : (
                filteredIssues.map((issue) => (
                  <tr key={issue.id}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{issue.title || "-"}</p>
                      <p className="mt-0.5 text-xs text-indigo-600">
                        {issueCode(issue?.id)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{issue.projectName || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatStatus(issue.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{issue.severity || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatStatus(slaMap.get(String(issue.id)) || "UNKNOWN")}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(issue.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
