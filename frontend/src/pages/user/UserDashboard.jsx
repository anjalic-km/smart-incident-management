import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardList, FolderKanban } from "lucide-react";
import { getAllIssues } from "../../api/issuesApi";
import { getAllProjects } from "../../api/projectApi";
import { useAuth } from "../../context/useAuth";
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

function statusBadgeClass(status) {
  const key = String(status || "").toUpperCase();
  if (key === "OPEN") return "border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200";
  if (key === "IN_PROGRESS") return "border-amber-300 bg-amber-100 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200";
  if (key === "RESOLVED") return "border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200";
  if (key === "ESCALATED") return "border-red-300 bg-red-100 text-red-700 dark:border-red-700 dark:bg-red-900/30 dark:text-red-200";
  if (key === "CLOSED") return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-700/70 dark:text-slate-100";
  return "border-gray-300 bg-gray-100 text-gray-700 dark:border-slate-600 dark:bg-slate-700/70 dark:text-slate-100";
}

function StatCard({ icon: Icon, label, value, hint, tone }) {
  const toneMap = {
    indigo: "bg-indigo-100 text-indigo-700",
    rose: "bg-rose-100 text-rose-700",
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700"
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        </div>
        <div className={`rounded-xl p-2 ${toneMap[tone] || toneMap.indigo}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [issueRes, projectRes] = await Promise.all([getAllIssues(), getAllProjects()]);
      setIssues(unwrapArrayData(issueRes));
      setProjects(unwrapArrayData(projectRes));
    } catch (err) {
      const msg = getApiMessage(err);
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const summary = useMemo(() => {
    const total = issues.length;
    const open = issues.filter((issue) => issue?.status === "OPEN").length;
    const inProgress = issues.filter((issue) => issue?.status === "IN_PROGRESS").length;
    const resolved = issues.filter(
      (issue) => issue?.status === "RESOLVED" || issue?.status === "CLOSED"
    ).length;
    return { total, open, inProgress, resolved };
  }, [issues]);

  const recentIssues = useMemo(
    () =>
      [...issues]
        .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime())
        .slice(0, 5),
    [issues]
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h1 className="text-xl font-bold text-gray-900">User Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          {`Welcome ${user?.fullName || user?.sub || "User"}. Track your projects and issues here.`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={FolderKanban}
          label="My Projects"
          value={projects.length}
          hint="Projects you are part of"
          tone="blue"
        />
        <StatCard
          icon={ClipboardList}
          label="My Issues"
          value={summary.total}
          hint="Visible issues"
          tone="indigo"
        />
        <StatCard
          icon={AlertCircle}
          label="Open"
          value={summary.open + summary.inProgress}
          hint="Open and in progress"
          tone="rose"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved"
          value={summary.resolved}
          hint="Resolved and closed"
          tone="emerald"
        />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-gray-900">Recent Issues</h2>
        {loading ? (
          <p className="mt-3 text-sm text-gray-600">Loading dashboard data...</p>
        ) : error ? (
          <p className="mt-3 text-sm text-red-700">Failed to load data: {error}</p>
        ) : recentIssues.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">No issues to display.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {recentIssues.map((issue) => (
              <article key={issue.id} className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-900">{issue.title || "-"}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(issue.status)}`}
                    >
                      {formatStatus(issue.status)}
                    </span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{issue.description || "-"}</p>
                <p className="mt-2 text-xs text-gray-500">{issue.projectName || "Unknown project"}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
