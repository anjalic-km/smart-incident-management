import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, RefreshCcw } from "lucide-react";
import { getAllIssues, getIssueSlaStatus, updateIssueStatus } from "../../api/issuesApi";
import { getAllProjects } from "../../api/projectApi";
import { showError, showSuccess } from "../../utils/toast";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

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

function unwrapData(res) {
  if (!res) return null;
  if (res?.data?.data !== undefined) return res.data.data;
  if (res?.data !== undefined) return res.data;
  return res;
}

function formatStatus(value) {
  return String(value || "-")
    .toLowerCase()
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function issueCode(id) {
  const num = Number(id);
  if (Number.isNaN(num)) return "-";
  return `ISS-${String(num).padStart(3, "0")}`;
}

function statusBadgeClass(status) {
  const key = String(status || "").toUpperCase();
  if (key === "OPEN") return "border-blue-300 bg-blue-100 text-blue-700";
  if (key === "IN_PROGRESS") return "border-amber-300 bg-amber-100 text-amber-700";
  if (key === "RESOLVED") return "border-emerald-300 bg-emerald-100 text-emerald-700";
  if (key === "CLOSED") return "border-slate-300 bg-slate-100 text-slate-700";
  return "border-gray-300 bg-gray-100 text-gray-700";
}

function priorityPillClasses(priority) {
  const normalized = String(priority || "").toUpperCase();
  if (normalized === "CRITICAL") return "bg-red-500 text-white";
  if (normalized === "HIGH") return "bg-amber-500 text-white";
  if (normalized === "MEDIUM") return "bg-blue-500 text-white";
  if (normalized === "LOW") return "bg-gray-200 text-gray-700";
  return "bg-gray-100 text-gray-600";
}

function formatDuration(totalSeconds) {
  const safe = Math.max(0, Number(totalSeconds) || 0);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function parseDateMs(value) {
  if (!value) return null;
  const normalized = typeof value === "string" ? value.replace(" ", "T") : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function getElapsedSeconds(issue, nowTs) {
  const startMs = parseDateMs(issue?.slaStartTime);
  if (!startMs) return 0;

  const status = String(issue?.status || "").toUpperCase();
  if (status === "IN_PROGRESS") {
    return Math.max(0, Math.floor((nowTs - startMs) / 1000));
  }
  if (status === "RESOLVED" || status === "CLOSED") {
    const resolvedMs = parseDateMs(issue?.resolvedAt);
    if (!resolvedMs) return 0;
    return Math.max(0, Math.floor((resolvedMs - startMs) / 1000));
  }
  return 0;
}

function getRemainingMinutes(issue, nowTs) {
  const dueMs = parseDateMs(issue?.slaDueTime);
  if (!dueMs) return null;
  return Math.floor((dueMs - nowTs) / 60000);
}

export default function MyIssues() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [savingIssueId, setSavingIssueId] = useState(null);
  const [nowTs, setNowTs] = useState(Date.now());

  const enrichIssuesWithSla = useCallback(async (list) => {
    return Promise.all(
      list.map(async (issue) => {
        try {
          const slaRes = await getIssueSlaStatus(issue.id);
          const sla = unwrapData(slaRes) || {};
            return {
              ...issue,
              slaStatus: sla.status || "UNKNOWN",
              slaStartTime: sla.slaStartTime || null,
              slaDueTime: sla.slaDueTime || null,
              remainingMinutes: sla.remainingMinutes
            };
        } catch {
          return {
              ...issue,
              slaStatus: "UNKNOWN",
              slaStartTime: null,
              slaDueTime: null,
              remainingMinutes: null
            };
        }
      })
    );
  }, []);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [issuesRes, projectsRes] = await Promise.all([getAllIssues(), getAllProjects()]);
      const baseIssues = unwrapArrayData(issuesRes);
      setProjects(unwrapArrayData(projectsRes));
      const withSla = await enrichIssuesWithSla(baseIssues);
      setIssues(withSla);
    } catch (err) {
      const msg = getApiMessage(err);
      setError(msg);
      showError(msg);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [enrichIssuesWithSla]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const projectsForFilter = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      if (project?.id != null) {
        map.set(String(project.id), project?.name || `Project #${project.id}`);
      }
    });
    issues.forEach((issue) => {
      if (issue?.projectId != null) {
        map.set(String(issue.projectId), issue?.projectName || `Project #${issue.projectId}`);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [issues, projects]);

  const filteredIssues = useMemo(() => {
    const q = search.trim().toLowerCase();
    return issues.filter((issue) => {
      const status = String(issue?.status || "").toUpperCase();
      const projectId = String(issue?.projectId || "");
      const matchesStatus = statusFilter === "ALL" ? true : status === statusFilter;
      const matchesProject = projectFilter === "ALL" ? true : projectId === String(projectFilter);
      const haystack = `${issue?.title || ""} ${issue?.description || ""} ${issue?.projectName || ""} ${status}`.toLowerCase();
      const matchesSearch = q ? haystack.includes(q) : true;
      return matchesStatus && matchesProject && matchesSearch;
    });
  }, [issues, search, statusFilter, projectFilter]);

  const transitionStatus = async (issue, nextStatus) => {
    try {
      setSavingIssueId(issue.id);
      await updateIssueStatus(issue.id, nextStatus);
      await fetchIssues();
      showSuccess(`Issue moved to ${formatStatus(nextStatus)}`);
    } catch (err) {
      showError(getApiMessage(err));
    } finally {
      setSavingIssueId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Assigned Issues</h1>
          <p className="mt-1 text-sm text-gray-600">Start work, mark resolved, and open details to view manager comments.</p>
        </div>
        <button
          type="button"
          onClick={fetchIssues}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 lg:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, description, project..."
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 lg:col-span-2"
        />
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All projects</option>
          {projectsForFilter.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All status</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {formatStatus(status)}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Issue</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Project</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Timer</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td className="px-4 py-8 text-sm text-gray-600" colSpan={7}>
                  Loading assigned issues...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-4 py-8 text-sm text-red-700" colSpan={7}>
                  Failed to load issues: {error}
                </td>
              </tr>
            ) : filteredIssues.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-gray-600" colSpan={7}>
                  {issues.length === 0
                    ? "No issues are currently assigned to you."
                    : "No issues found for selected filters."}
                </td>
              </tr>
            ) : (
              filteredIssues.map((issue) => {
                const normalizedStatus = String(issue?.status || "").toUpperCase();
                const elapsedSeconds = getElapsedSeconds(issue, nowTs);
                const remainingMinutes = getRemainingMinutes(issue, nowTs);
                const timerText =
                  normalizedStatus === "CLOSED"
                    ? `Resolved in ${formatDuration(elapsedSeconds)}`
                    : formatDuration(elapsedSeconds);
                const isNearBreach =
                  normalizedStatus === "IN_PROGRESS" &&
                  remainingMinutes != null &&
                  remainingMinutes > 0 &&
                  remainingMinutes <= 15;
                const isBreached =
                  normalizedStatus === "IN_PROGRESS" &&
                  remainingMinutes != null &&
                  remainingMinutes <= 0;
                const timerClass =
                  normalizedStatus !== "IN_PROGRESS"
                    ? "text-gray-700"
                    : isNearBreach || isBreached
                      ? "text-red-600"
                      : "text-emerald-600";
                return (
                  <tr key={issue.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {issueCode(issue.id)} - {issue.title || "-"}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-600">{issue.description || "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{issue.projectName || "-"}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${priorityPillClasses(
                        issue.severity
                      )}`}
                    >
                      {formatStatus(issue.severity)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(issue.status)}`}>
                      {formatStatus(issue.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className={`text-sm font-semibold ${timerClass}`}>{timerText}</p>
                    {isNearBreach && (
                      <p className="mt-1 text-xs font-semibold text-red-600">SLA policy is near to breach</p>
                    )}
                    {isBreached && (
                      <p className="mt-1 text-xs font-semibold text-red-700">SLA policy breached</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {String(issue?.status || "").toUpperCase() === "OPEN" && (
                        <button
                          type="button"
                          disabled={savingIssueId === issue.id}
                          onClick={() => transitionStatus(issue, "IN_PROGRESS")}
                          className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                        >
                          Start
                        </button>
                      )}
                      {String(issue?.status || "").toUpperCase() === "IN_PROGRESS" && (
                        <button
                          type="button"
                          disabled={savingIssueId === issue.id}
                          onClick={() => transitionStatus(issue, "RESOLVED")}
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                        >
                          Mark Resolved
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => navigate(`/engineer/issues/${issue.id}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
