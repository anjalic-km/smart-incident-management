import { useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { getCurrentUserSlaPolicies } from "../../api/slaApi";
import { getAllProjects } from "../../api/projectApi";
import { showError } from "../../utils/toast";

const PRIORITY_OPTIONS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

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

function formatPriority(value) {
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

function minutesToText(minutes) {
  if (minutes == null || Number.isNaN(Number(minutes))) return "-";
  const total = Number(minutes);
  if (total < 60) return `${total}m`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function priorityCardClasses(priority) {
  const normalized = String(priority || "").toUpperCase();
  if (normalized === "CRITICAL") {
    return {
      card: "border-red-300 bg-gradient-to-br from-red-50 to-rose-50 dark:border-red-500/40 dark:from-red-500/15 dark:to-rose-500/10",
      title: "text-red-900 dark:text-red-100",
      metaLabel: "text-red-700/80 dark:text-red-300/80",
      metaValue: "text-red-900 dark:text-red-100",
      desc: "text-red-800/90 dark:text-red-200"
    };
  }
  if (normalized === "HIGH") {
    return {
      card: "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-500/40 dark:from-amber-500/15 dark:to-orange-500/10",
      title: "text-amber-900 dark:text-amber-100",
      metaLabel: "text-amber-700/80 dark:text-amber-300/80",
      metaValue: "text-amber-900 dark:text-amber-100",
      desc: "text-amber-800/90 dark:text-amber-200"
    };
  }
  if (normalized === "MEDIUM") {
    return {
      card: "border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 dark:border-blue-500/40 dark:from-blue-500/15 dark:to-cyan-500/10",
      title: "text-blue-900 dark:text-blue-100",
      metaLabel: "text-blue-700/80 dark:text-blue-300/80",
      metaValue: "text-blue-900 dark:text-blue-100",
      desc: "text-blue-800/90 dark:text-blue-200"
    };
  }
  return {
    card: "border-slate-300 bg-gradient-to-br from-slate-50 to-gray-50 dark:border-slate-500/40 dark:from-slate-500/15 dark:to-gray-500/10",
    title: "text-slate-900 dark:text-slate-100",
    metaLabel: "text-slate-700/80 dark:text-slate-300/80",
    metaValue: "text-slate-900 dark:text-slate-100",
    desc: "text-slate-800/90 dark:text-slate-200"
  };
}

export default function EngineerSlaPolicies() {
  const [policies, setPolicies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [policiesRes, projectsRes] = await Promise.all([getCurrentUserSlaPolicies(), getAllProjects()]);
      setPolicies(unwrapArrayData(policiesRes));
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
    fetchData();
  }, []);

  const projectNameById = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      if (project?.id != null) {
        map.set(String(project.id), project?.name || `Project #${project.id}`);
      }
    });
    return map;
  }, [projects]);

  const projectsForFilter = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      if (project?.id != null) {
        map.set(String(project.id), project?.name || `Project #${project.id}`);
      }
    });
    policies.forEach((policy) => {
      const pid = policy?.projectId ?? policy?.project?.id;
      if (pid != null && !map.has(String(pid))) {
        map.set(String(pid), policy?.projectName || policy?.project?.name || `Project #${pid}`);
      }
    });
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [policies, projects]);

  const displayPolicies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return policies
      .map((policy) => {
        const pid = policy?.projectId ?? policy?.project?.id ?? null;
        const priority = String(policy?.priorityLevel || "").toUpperCase();
        const projectName =
          policy?.projectName ||
          policy?.project?.name ||
          (pid != null ? projectNameById.get(String(pid)) : "") ||
          (pid != null ? `Project #${pid}` : "-");
        return {
          ...policy,
          projectId: pid,
          priorityLevel: priority,
          projectName
        };
      })
      .filter((policy) => {
        const projectMatch =
          projectFilter === "ALL" ? true : String(policy?.projectId || "") === String(projectFilter);
        const priorityMatch = priorityFilter === "ALL" ? true : policy.priorityLevel === priorityFilter;
        const haystack = `${policy.projectName || ""} ${policy.priorityLevel || ""} ${policy.description || ""}`.toLowerCase();
        const searchMatch = q ? haystack.includes(q) : true;
        return projectMatch && priorityMatch && searchMatch;
      })
      .sort((a, b) => {
        const byProject = String(a.projectName || "").localeCompare(String(b.projectName || ""));
        if (byProject !== 0) return byProject;
        return PRIORITY_OPTIONS.indexOf(a.priorityLevel) - PRIORITY_OPTIONS.indexOf(b.priorityLevel);
      });
  }, [policies, search, projectFilter, priorityFilter, projectNameById]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">SLA Policies</h1>
          <p className="mt-1 text-sm text-gray-600">View SLA targets configured for your assigned projects.</p>
        </div>
        <button
          type="button"
          onClick={fetchData}
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
          placeholder="Search by project, priority, description..."
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
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All priorities</option>
          {PRIORITY_OPTIONS.map((priority) => (
            <option key={priority} value={priority}>
              {formatPriority(priority)}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        {loading ? (
          <div className="py-8 text-sm text-gray-600">Loading SLA policies...</div>
        ) : error ? (
          <div className="py-8 text-sm text-red-700">Failed to load SLA policies: {error}</div>
        ) : displayPolicies.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-600">No SLA policies found for selected filters.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {displayPolicies.map((policy) => {
              const tone = priorityCardClasses(policy.priorityLevel);
              return (
              <article
                key={`${policy.projectId}-${policy.priorityLevel}`}
                className={`rounded-xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${tone.card}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold ${tone.title}`}>{policy.projectName || "-"}</p>
                  <span
                    className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${priorityPillClasses(
                      policy.priorityLevel
                    )}`}
                  >
                    {formatPriority(policy.priorityLevel)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${tone.metaLabel}`}>Resolution Target</span>
                  <span className={`text-sm font-bold ${tone.metaValue}`}>{minutesToText(policy.resolutionTimeMinutes)}</span>
                </div>
                <div className="mt-3">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${tone.metaLabel}`}>Description</p>
                  <p className={`mt-1 text-sm ${tone.desc}`}>{policy.description || "-"}</p>
                </div>
              </article>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
