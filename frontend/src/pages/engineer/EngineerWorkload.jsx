import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { getAllProjects } from "../../api/projectApi";
import { getAllIssues } from "../../api/issuesApi";
import { getEngineerWorkload } from "../../api/workloadApi";
import { useAuth } from "../../context/useAuth";
import { showError } from "../../utils/toast";

const ACTIVE_STATUSES = new Set(["OPEN", "IN_PROGRESS"]);

function getApiMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.statusMessage ||
    err?.message ||
    "Something went wrong"
  );
}

function unwrapData(res) {
  if (!res) return null;
  if (res?.data !== undefined) return res.data;
  return res;
}

function issueCode(id) {
  const num = Number(id);
  if (Number.isNaN(num)) return "-";
  return `ISS-${String(num).padStart(3, "0")}`;
}

function formatStatus(value) {
  return String(value || "-")
    .toLowerCase()
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function statusBadgeClass(status) {
  const key = String(status || "").toUpperCase();
  if (key === "CREATED") return "border-indigo-300 bg-indigo-100 text-indigo-700";
  if (key === "OPEN") return "border-blue-300 bg-blue-100 text-blue-700";
  if (key === "IN_PROGRESS") return "border-amber-300 bg-amber-100 text-amber-700";
  if (key === "RESOLVED") return "border-emerald-300 bg-emerald-100 text-emerald-700";
  if (key === "CLOSED") return "border-slate-300 bg-slate-100 text-slate-700";
  return "border-gray-300 bg-gray-100 text-gray-700";
}

export default function EngineerWorkload() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [engineerActiveWorkload, setEngineerActiveWorkload] = useState(0);
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    setError("");
    try {
      const [projectRes, issueRes] = await Promise.all([getAllProjects(), getAllIssues()]);

      const projectList = Array.isArray(unwrapData(projectRes)) ? unwrapData(projectRes) : [];
      const issueList = Array.isArray(unwrapData(issueRes)) ? unwrapData(issueRes) : [];

      setProjects(projectList);
      setIssues(issueList);

      const engineerId = user?.userId;
      if (engineerId) {
        try {
          const workloadRes = await getEngineerWorkload(engineerId);
          setEngineerActiveWorkload(Number(unwrapData(workloadRes) || 0));
        } catch {
          setEngineerActiveWorkload(
            issueList.filter((issue) => ACTIVE_STATUSES.has(String(issue?.status || "").toUpperCase())).length
          );
        }
      }
    } catch (err) {
      const msg = getApiMessage(err);
      setError(msg);
      showError(msg);
      setProjects([]);
      setIssues([]);
      setEngineerActiveWorkload(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const projectsForFilter = useMemo(() => {
    const map = new Map();
    issues.forEach((issue) => {
      if (issue?.projectId != null) {
        map.set(String(issue.projectId), issue?.projectName || `Project #${issue.projectId}`);
      }
    });
    projects.forEach((project) => {
      if (project?.id != null && !map.has(String(project.id))) {
        map.set(String(project.id), project?.name || `Project #${project.id}`);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [issues, projects]);

  const selectedProjectIds = useMemo(() => {
    if (projectFilter === "ALL") {
      return new Set(projectsForFilter.map((project) => String(project.id)));
    }
    return new Set([String(projectFilter)]);
  }, [projectsForFilter, projectFilter]);

  const filteredIssues = useMemo(
    () => issues.filter((issue) => selectedProjectIds.has(String(issue?.projectId || ""))),
    [issues, selectedProjectIds]
  );

  const activeIssues = useMemo(
    () => filteredIssues.filter((issue) => ACTIVE_STATUSES.has(String(issue?.status || "").toUpperCase())),
    [filteredIssues]
  );

  const resolvedIssues = useMemo(
    () =>
      filteredIssues.filter((issue) =>
        ["RESOLVED", "CLOSED"].includes(String(issue?.status || "").toUpperCase())
      ),
    [filteredIssues]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Workload</h1>
          <p className="mt-1 text-sm text-gray-600">Track your assigned issues and active load by project.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 sm:w-64"
          >
            <option value="ALL">All Projects</option>
            {projectsForFilter.map((project) => (
              <option key={project.id} value={String(project.id)}>
                {project.name}
              </option>
            ))}
          </select>
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
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-sm font-medium text-indigo-700">My Active Workload</p>
          <p className="mt-1 text-3xl font-bold text-indigo-900">{engineerActiveWorkload}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-700">Active Issues (Scope)</p>
          <p className="mt-1 text-3xl font-bold text-amber-900">{activeIssues.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-700">Resolved/Closed Issues</p>
          <p className="mt-1 text-3xl font-bold text-emerald-900">{resolvedIssues.length}</p>
        </div>
      </div>

      <section className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-base font-semibold text-gray-900">My Active Issues</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Issue</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Project</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-sm text-gray-600">
                  Loading workload...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-sm text-red-700">
                  Failed to load workload: {error}
                </td>
              </tr>
            ) : activeIssues.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-600">
                  No active issues found.
                </td>
              </tr>
            ) : (
              activeIssues.map((issue) => (
                <tr key={issue.id}>
                  <td className="px-4 py-3 text-sm font-semibold text-indigo-700">{issueCode(issue.id)}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{issue.title || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{issue.projectName || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(issue.status)}`}>
                      {formatStatus(issue.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-base font-semibold text-gray-900">My Resolved/Closed Issues</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Issue</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Project</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-sm text-gray-600">
                  Loading resolved issues...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-sm text-red-700">
                  Failed to load resolved issues: {error}
                </td>
              </tr>
            ) : resolvedIssues.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-600">
                  No resolved issues found.
                </td>
              </tr>
            ) : (
              resolvedIssues.map((issue) => (
                <tr key={issue.id}>
                  <td className="px-4 py-3 text-sm font-semibold text-indigo-700">{issueCode(issue.id)}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{issue.title || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{issue.projectName || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(issue.status)}`}>
                      {formatStatus(issue.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
