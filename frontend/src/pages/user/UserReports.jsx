import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, FolderKanban } from "lucide-react";
import { getAllIssues } from "../../api/issuesApi";
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

const ISSUE_STATUS_ORDER = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

function StatCard({ icon: Icon, label, value, tone }) {
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
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function UserReports() {
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedProject, setSelectedProject] = useState("ALL");

  const fetchReportsData = async () => {
    setLoading(true);
    setError("");
    try {
      const [issuesRes, projectsRes] = await Promise.all([getAllIssues(), getAllProjects()]);
      setIssues(unwrapArrayData(issuesRes));
      setProjects(unwrapArrayData(projectsRes));
    } catch (err) {
      const msg = getApiMessage(err);
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const summary = useMemo(() => {
    const total = issues.length;
    const open = issues.filter((i) => i?.status === "OPEN").length;
    const inProgress = issues.filter((i) => i?.status === "IN_PROGRESS").length;
    const resolved = issues.filter((i) => i?.status === "RESOLVED" || i?.status === "CLOSED").length;
    const urgent = issues.filter((i) => i?.severity === "HIGH" || i?.severity === "CRITICAL").length;
    return { total, open, inProgress, resolved, urgent };
  }, [issues]);

  const issueProjectOptions = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      if (project?.id == null) return;
      const pid = String(project.id);
      const name = project?.name || project?.projectName || `Project #${pid}`;
      map.set(pid, name);
    });
    issues.forEach((issue) => {
      if (issue?.projectId == null) return;
      const pid = String(issue.projectId);
      if (!map.has(pid)) {
        map.set(pid, issue?.projectName || `Project #${pid}`);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [issues, projects]);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const status = String(issue?.status || "UNKNOWN").toUpperCase();
      const issueProjectId = issue?.projectId != null ? String(issue.projectId) : "";
      const statusMatch = selectedStatus === "ALL" ? true : status === selectedStatus;
      const projectMatch = selectedProject === "ALL" ? true : issueProjectId === selectedProject;
      return statusMatch && projectMatch;
    });
  }, [issues, selectedProject, selectedStatus]);

  const byStatus = useMemo(() => {
    const map = new Map();
    const source = selectedProject === "ALL" ? issues : filteredIssues;
    source.forEach((issue) => {
      const key = String(issue?.status || "UNKNOWN").toUpperCase();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return ISSUE_STATUS_ORDER.map((status) => ({
      status,
      count: map.get(status) || 0
    }));
  }, [issues, filteredIssues, selectedProject]);

  const byProject = useMemo(() => {
    const counts = new Map();
    issueProjectOptions.forEach((project) => counts.set(project.id, 0));
    const source = selectedStatus === "ALL" ? issues : filteredIssues;
    source.forEach((issue) => {
      if (issue?.projectId == null) return;
      const pid = String(issue.projectId);
      if (!counts.has(pid)) {
        counts.set(pid, 0);
      }
      counts.set(pid, (counts.get(pid) || 0) + 1);
    });
    return issueProjectOptions.map((project) => ({
      projectId: project.id,
      project: project.name,
      count: counts.get(project.id) || 0
    }));
  }, [issueProjectOptions, issues, filteredIssues, selectedStatus]);

  const maxStatus = Math.max(1, ...byStatus.map((item) => item.count));
  const maxProject = Math.max(1, ...byProject.map((item) => item.count));
  const filteredProjectName =
    selectedProject === "ALL" ? "All" : issueProjectOptions.find((p) => p.id === selectedProject)?.name || "-";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h1 className="text-xl font-bold text-gray-900">User Reports</h1>
        <p className="mt-1 text-sm text-gray-600">Overview of your visible issues.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={FolderKanban} label="Total Issues" value={summary.total} tone="indigo" />
        <StatCard icon={AlertCircle} label="Open" value={summary.open} tone="rose" />
        <StatCard icon={Clock3} label="In Progress" value={summary.inProgress} tone="amber" />
        <StatCard icon={CheckCircle2} label="Resolved/Closed" value={summary.resolved} tone="emerald" />
        <StatCard icon={AlertCircle} label="High/Critical" value={summary.urgent} tone="rose" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Status Distribution</h2>
            <button
              type="button"
              onClick={() => setSelectedStatus("ALL")}
              className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear Status
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Click a status bar to filter project chart.</p>
          {loading ? (
            <p className="mt-3 text-sm text-gray-600">Loading data...</p>
          ) : error ? (
            <p className="mt-3 text-sm text-red-700">Failed to load data: {error}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {byStatus.map((item) => (
                <button
                  key={item.status}
                  type="button"
                  onClick={() => setSelectedStatus((prev) => (prev === item.status ? "ALL" : item.status))}
                  className={`block w-full rounded-lg p-1 text-left ${
                    selectedStatus === item.status ? "bg-indigo-50 ring-1 ring-indigo-200" : ""
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{formatStatus(item.status)}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${(item.count / maxStatus) * 100}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Project Distribution</h2>
            <button
              type="button"
              onClick={() => setSelectedProject("ALL")}
              className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear Project
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Click a project bar to filter status chart.</p>
          {loading ? (
            <p className="mt-3 text-sm text-gray-600">Loading data...</p>
          ) : error ? (
            <p className="mt-3 text-sm text-red-700">Failed to load data: {error}</p>
          ) : byProject.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">No projects available.</p>
          ) : (
            <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {byProject.map((item) => (
                <button
                  key={item.projectId}
                  type="button"
                  onClick={() => setSelectedProject((prev) => (prev === item.projectId ? "ALL" : item.projectId))}
                  className={`block w-full rounded-lg p-1 text-left ${
                    selectedProject === item.projectId ? "bg-emerald-50 ring-1 ring-emerald-200" : ""
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="truncate pr-2 text-sm font-medium text-gray-700">{item.project}</span>
                    <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${(item.count / maxProject) * 100}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Filtered Result</h2>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-700">
              Status: {selectedStatus === "ALL" ? "All" : formatStatus(selectedStatus)}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-700">
              Project: {filteredProjectName}
            </span>
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-600">
          {filteredIssues.length} issue{filteredIssues.length === 1 ? "" : "s"} matched.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Issue</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Project</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Severity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-sm text-gray-600" colSpan={5}>
                    No issues found for selected filters.
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => (
                  <tr key={issue.id}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{issue.title || "-"}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        ISS-{String(issue?.id ?? "").padStart(3, "0")}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {issue.projectName || (issue.projectId ? `Project #${issue.projectId}` : "-")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatStatus(issue.status)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{issue.severity || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(issue.createdAt || issue.created_at)}</td>
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
