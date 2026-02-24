import { createElement, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Layers3, RefreshCcw, ShieldCheck } from "lucide-react";
import { getAllIssues } from "../../api/issuesApi";
import { getAllProjects } from "../../api/projectApi";
import { showError } from "../../utils/toast";

const TARGET_STATUSES = new Set(["RESOLVED", "CLOSED"]);

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

function priorityPillClasses(priority) {
  const normalized = String(priority || "").toUpperCase();
  if (normalized === "CRITICAL") return "bg-red-500 text-white";
  if (normalized === "HIGH") return "bg-amber-500 text-white";
  if (normalized === "MEDIUM") return "bg-blue-500 text-white";
  if (normalized === "LOW") return "bg-gray-200 text-gray-700";
  return "bg-gray-100 text-gray-600";
}

function statusBadgeClass(status) {
  const key = String(status || "").toUpperCase();
  if (key === "RESOLVED") return "border-emerald-300 bg-emerald-100 text-emerald-700";
  if (key === "CLOSED") return "border-slate-300 bg-slate-100 text-slate-700";
  return "border-gray-300 bg-gray-100 text-gray-700";
}

function formatDateTime(value) {
  if (!value) return "-";
  const normalized = typeof value === "string" ? value.replace(" ", "T") : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "-";
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

function SummaryCard({ icon, label, value, hint, tone }) {
  const tones = {
    indigo: {
      card: "border-indigo-200 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10",
      label: "text-indigo-700 dark:text-indigo-300",
      value: "text-indigo-900 dark:text-indigo-100",
      hint: "text-indigo-700/80 dark:text-indigo-300/80",
      icon: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
    },
    emerald: {
      card: "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10",
      label: "text-emerald-700 dark:text-emerald-300",
      value: "text-emerald-900 dark:text-emerald-100",
      hint: "text-emerald-700/80 dark:text-emerald-300/80",
      icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
    },
    cyan: {
      card: "border-cyan-200 bg-cyan-50 dark:border-cyan-500/30 dark:bg-cyan-500/10",
      label: "text-cyan-700 dark:text-cyan-300",
      value: "text-cyan-900 dark:text-cyan-100",
      hint: "text-cyan-700/80 dark:text-cyan-300/80",
      icon: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300"
    }
  };
  const palette = tones[tone] || tones.indigo;
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${palette.card}`}>
      <div className="flex items-start justify-between gap-3">
        <p className={`text-xs font-semibold uppercase tracking-wide ${palette.label}`}>{label}</p>
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${palette.icon}`}>
          {icon ? createElement(icon, { className: "h-5 w-5" }) : null}
        </span>
      </div>
      <p className={`mt-1 text-3xl font-extrabold ${palette.value}`}>{value}</p>
      <p className={`mt-1 text-xs ${palette.hint}`}>{hint}</p>
    </div>
  );
}

function IssueTable({ title, items, loading, error }) {
  return (
    <section className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Issue</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Project</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Priority</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Resolved At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {loading ? (
            <tr>
              <td className="px-4 py-8 text-sm text-gray-600" colSpan={5}>
                Loading issues...
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td className="px-4 py-8 text-sm text-red-700" colSpan={5}>
                Failed to load issues: {error}
              </td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-sm text-gray-600" colSpan={5}>
                No issues found.
              </td>
            </tr>
          ) : (
            items.map((issue) => (
              <tr key={issue.id}>
                <td className="px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">{issueCode(issue.id)}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-600">{issue.title || "-"}</p>
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
                <td className="px-4 py-3 text-sm">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(issue.status)}`}>
                    {formatStatus(issue.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(issue.resolvedAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}

export default function EngineerSolvedIssues() {
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const fetchData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    setError("");
    try {
      const [issuesRes, projectsRes] = await Promise.all([getAllIssues(), getAllProjects()]);
      const allIssues = unwrapArrayData(issuesRes);
      const solvedIssues = allIssues.filter((issue) => TARGET_STATUSES.has(String(issue?.status || "").toUpperCase()));
      setIssues(solvedIssues);
      setProjects(unwrapArrayData(projectsRes));
    } catch (err) {
      const msg = getApiMessage(err);
      setError(msg);
      showError(msg);
      setIssues([]);
      setProjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const projectsForFilter = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      if (project?.id != null) {
        map.set(String(project.id), project?.name || `Project #${project.id}`);
      }
    });
    issues.forEach((issue) => {
      if (issue?.projectId != null && !map.has(String(issue.projectId))) {
        map.set(String(issue.projectId), issue?.projectName || `Project #${issue.projectId}`);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [issues, projects]);

  const filteredIssues = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return issues.filter((issue) => {
      const projectMatch =
        projectFilter === "ALL" ? true : String(issue?.projectId || "") === String(projectFilter);
      const priorityMatch =
        priorityFilter === "ALL" ? true : String(issue?.severity || "").toUpperCase() === priorityFilter;
      const textMatch =
        query.length === 0
          ? true
          : [
              issueCode(issue?.id),
              issue?.title,
              issue?.projectName,
              issue?.severity,
              issue?.status
            ]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(query));
      return projectMatch && priorityMatch && textMatch;
    });
  }, [issues, projectFilter, priorityFilter, searchTerm]);

  const resolvedCount = useMemo(
    () => filteredIssues.filter((issue) => String(issue?.status || "").toUpperCase() === "RESOLVED").length,
    [filteredIssues]
  );
  const closedCount = useMemo(
    () => filteredIssues.filter((issue) => String(issue?.status || "").toUpperCase() === "CLOSED").length,
    [filteredIssues]
  );
  const sortedIssues = useMemo(() => {
    return [...filteredIssues].sort((a, b) => {
      const aTime = new Date(a?.resolvedAt ? String(a.resolvedAt).replace(" ", "T") : 0).getTime();
      const bTime = new Date(b?.resolvedAt ? String(b.resolvedAt).replace(" ", "T") : 0).getTime();
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });
  }, [filteredIssues]);
  const resolvedIssues = useMemo(
    () => sortedIssues.filter((issue) => String(issue?.status || "").toUpperCase() === "RESOLVED"),
    [sortedIssues]
  );
  const closedIssues = useMemo(
    () => sortedIssues.filter((issue) => String(issue?.status || "").toUpperCase() === "CLOSED"),
    [sortedIssues]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Solved Issues</h1>
          <p className="mt-1 text-sm text-gray-600">Track issues you solved and those closed after manager review.</p>
        </div>
        <button
          type="button"
          onClick={() => fetchData({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 lg:grid-cols-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by project, priority, description..."
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 lg:col-span-2"
        />
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All projects</option>
          {projectsForFilter.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All priorities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard icon={Layers3} label="Total" value={filteredIssues.length} hint="Resolved + Closed" tone="indigo" />
        <SummaryCard icon={CheckCircle2} label="Resolved" value={resolvedCount} hint="Solved by engineer" tone="emerald" />
        <SummaryCard icon={ShieldCheck} label="Closed" value={closedCount} hint="Validated by manager" tone="cyan" />
      </div>

      <div className="space-y-4">
        <IssueTable title="Resolved Issues" items={resolvedIssues} loading={loading} error={error} />
        <IssueTable title="Closed Issues" items={closedIssues} loading={loading} error={error} />
      </div>
    </div>
  );
}
