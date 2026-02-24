import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { getAllProjects } from "../../api/projectApi";
import { getAllUsers } from "../../api/userApi";
import { getAllIssues } from "../../api/issuesApi";
import { getManagerWorkload } from "../../api/workloadApi";
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

export default function ManagerWorkload() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [managerTotalWorkload, setManagerTotalWorkload] = useState(0);
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    setError("");
    try {
      const [projectRes, userRes, issueRes] = await Promise.all([
        getAllProjects(),
        getAllUsers(),
        getAllIssues()
      ]);

      const projectList = Array.isArray(unwrapData(projectRes)) ? unwrapData(projectRes) : [];
      const userList = Array.isArray(unwrapData(userRes)) ? unwrapData(userRes) : [];
      const issueList = Array.isArray(unwrapData(issueRes)) ? unwrapData(issueRes) : [];

      setProjects(projectList);
      setUsers(userList);
      setIssues(issueList);

      const managerId = user?.userId;
      if (managerId) {
        try {
          const workloadRes = await getManagerWorkload(managerId);
          setManagerTotalWorkload(Number(unwrapData(workloadRes) || 0));
        } catch {
          setManagerTotalWorkload(
            issueList.filter((issue) => ACTIVE_STATUSES.has(String(issue?.status || "").toUpperCase())).length
          );
        }
      }
    } catch (err) {
      const msg = getApiMessage(err);
      setError(msg);
      showError(msg);
      setProjects([]);
      setUsers([]);
      setIssues([]);
      setManagerTotalWorkload(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedProjectIds = useMemo(() => {
    if (projectFilter === "ALL") {
      return new Set(projects.map((project) => String(project.id)));
    }
    return new Set([String(projectFilter)]);
  }, [projects, projectFilter]);

  const filteredIssues = useMemo(
    () => issues.filter((issue) => selectedProjectIds.has(String(issue?.projectId || ""))),
    [issues, selectedProjectIds]
  );

  const activeIssues = useMemo(
    () => filteredIssues.filter((issue) => ACTIVE_STATUSES.has(String(issue?.status || "").toUpperCase())),
    [filteredIssues]
  );

  const engineersInScope = useMemo(() => {
    const projectEngineerIds = new Set();
    projects.forEach((project) => {
      if (!selectedProjectIds.has(String(project.id))) return;
      (project?.memberDetails || []).forEach((member) => {
        if (String(member?.role || "").toUpperCase() === "ENGINEER" && member?.id != null) {
          projectEngineerIds.add(String(member.id));
        }
      });
    });

    return users
      .filter((userItem) => String(userItem?.role || "").toUpperCase() === "ENGINEER")
      .filter((userItem) => projectEngineerIds.has(String(userItem.id)))
      .sort((a, b) => String(a.fullName || "").localeCompare(String(b.fullName || "")));
  }, [projects, users, selectedProjectIds]);

  const engineerCards = useMemo(
    () =>
      engineersInScope.map((engineer) => {
        const assigned = filteredIssues.filter((issue) => String(issue?.assignedEngineerId || "") === String(engineer.id));
        const active = assigned.filter((issue) => ACTIVE_STATUSES.has(String(issue?.status || "").toUpperCase()));
        return {
          engineerId: engineer.id,
          name: engineer.fullName || engineer.email || "-",
          email: engineer.email || "-",
          activeCount: active.length,
          totalAssignedCount: assigned.length,
          issues: assigned
        };
      }),
    [engineersInScope, filteredIssues]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Workload</h1>
          <p className="mt-1 text-sm text-gray-600">Track engineer issue load for your selected project.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 sm:w-64"
          >
            <option value="ALL">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={String(project.id)}>
                {project.name || `Project #${project.id}`}
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
          <p className="text-sm font-medium text-indigo-700">Manager Active Workload</p>
          <p className="mt-1 text-3xl font-bold text-indigo-900">{managerTotalWorkload}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-700">Project Active Issues</p>
          <p className="mt-1 text-3xl font-bold text-amber-900">{activeIssues.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-700">Engineers in Scope</p>
          <p className="mt-1 text-3xl font-bold text-emerald-900">{engineerCards.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600">Loading workload...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">Failed to load workload: {error}</div>
        ) : engineerCards.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600">No engineers found for selected project.</div>
        ) : (
          engineerCards.map((card) => (
            <section key={card.engineerId} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{card.name}</h2>
                  <p className="text-xs text-gray-500">{card.email}</p>
                </div>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                  Active {card.activeCount}
                </span>
              </div>
              <p className="mt-3 text-xs text-gray-500">Total assigned: {card.totalAssignedCount}</p>
              <div className="mt-3 space-y-2">
                {card.issues.length ? (
                  card.issues.slice(0, 6).map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                      <span className="text-xs font-semibold text-indigo-700">{issueCode(issue.id)}</span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusBadgeClass(issue.status)}`}>
                        {formatStatus(issue.status)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No assigned issues.</p>
                )}
              </div>
            </section>
          ))
        )}
      </div>

      <section className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 p-4">
          <h2 className="text-base font-semibold text-gray-900">Active Issues (Selected Scope)</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Issue</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Project</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Assigned To</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {activeIssues.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-600">No active issues found.</td>
              </tr>
            ) : (
              activeIssues.map((issue) => (
                <tr key={issue.id}>
                  <td className="px-4 py-3 text-sm font-semibold text-indigo-700">{issueCode(issue.id)}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{issue.title || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{issue.projectName || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{issue.assignedEngineerName || "-"}</td>
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
