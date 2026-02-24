import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, FolderKanban, RefreshCcw, Ticket, TimerReset } from "lucide-react";
import { getAllIssues, getIssueSlaStatus } from "../../api/issuesApi";
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

function unwrapApiData(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  return Array.isArray(res?.data?.data) ? res.data.data : [];
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function issueCode(id) {
  const num = Number(id);
  if (Number.isNaN(num)) return "-";
  return `ISS-${String(num).padStart(3, "0")}`;
}

function getAssigneeKeys(issue) {
  return [
    issue?.assignedTo,
    issue?.assignedEngineer,
    issue?.engineerId,
    issue?.assigneeId,
    issue?.assignee?.id,
    issue?.assignedToId
  ]
    .filter((value) => value != null && String(value).trim() !== "")
    .map((value) => String(value));
}

function matchesCurrentEngineer(issue, user) {
  const byId = getAssigneeKeys(issue).some((key) => key === String(user?.userId || ""));
  if (byId) return true;
  const identityTokens = [
    user?.email,
    user?.username,
    user?.fullName,
    user?.name,
    user?.displayName
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  const issueTokens = [
    issue?.assignedToName,
    issue?.assignedEngineerName,
    issue?.assigneeName,
    issue?.assignedToEmail,
    issue?.assignee?.email
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  return issueTokens.some((token) => identityTokens.includes(token));
}

function getUserIdentity(user) {
  const userId = String(user?.userId || "").trim();
  const tokens = new Set(
    [user?.email, user?.username, user?.fullName, user?.name, user?.displayName]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
  );
  return { userId, tokens };
}

function projectMemberMatches(member, identity) {
  if (member == null) return false;
  if (typeof member === "string" || typeof member === "number") {
    const raw = String(member).trim();
    if (!raw) return false;
    return raw === identity.userId || identity.tokens.has(raw.toLowerCase());
  }
  const role = String(member?.role || member?.userRole || "").toUpperCase();
  if (role && role !== "ENGINEER") return false;

  const idCandidates = [member?.id, member?.userId, member?.memberId]
    .filter((value) => value != null && String(value).trim() !== "")
    .map((value) => String(value));
  if (idCandidates.some((value) => value === identity.userId)) return true;

  const textCandidates = [member?.email, member?.fullName, member?.name, member?.username]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  return textCandidates.some((value) => identity.tokens.has(value));
}

function matchesEngineerProject(project, user) {
  const identity = getUserIdentity(user);
  if (!identity.userId && identity.tokens.size === 0) return false;

  const detailGroups = [project?.memberDetails, project?.members, project?.engineers];
  for (const group of detailGroups) {
    if (!Array.isArray(group)) continue;
    if (group.some((member) => projectMemberMatches(member, identity))) return true;
  }

  const idGroups = [project?.memberIds, project?.engineerIds];
  for (const group of idGroups) {
    if (!Array.isArray(group)) continue;
    if (group.map((value) => String(value)).includes(identity.userId)) return true;
  }

  const nameGroups = [project?.memberNames, project?.engineerNames];
  for (const group of nameGroups) {
    if (!Array.isArray(group)) continue;
    const normalized = group.map((value) => String(value).toLowerCase());
    if (normalized.some((value) => identity.tokens.has(value))) return true;
  }

  return false;
}

function getIssueProjectMeta(issue) {
  const rawId = issue?.projectId ?? issue?.project?.id ?? issue?.project?.projectId ?? null;
  const projectId = rawId != null && String(rawId).trim() !== "" ? String(rawId) : "";
  const projectName =
    issue?.projectName ||
    issue?.project?.name ||
    issue?.project?.projectName ||
    (projectId ? `Project #${projectId}` : "Unassigned Project");
  return { projectId, projectName };
}

function StatCard({ icon, label, value, hint, tone = "indigo" }) {
  const tones = {
    indigo: "bg-indigo-100 text-indigo-700",
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700"
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        </div>
        <div className={`rounded-xl p-2 ${tones[tone] || tones.indigo}`}>
          {icon ? createElement(icon, { className: "h-5 w-5" }) : null}
        </div>
      </div>
    </div>
  );
}

function IssueStatusChart({ items, selectedStatus, onSelect }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  const palette = {
    CREATED: "#6366f1",
    OPEN: "#0ea5e9",
    IN_PROGRESS: "#f59e0b",
    RESOLVED: "#10b981",
    CLOSED: "#6366f1"
  };
  return (
    <div className="flex h-full min-h-[360px] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">My Issue Status</h2>
        <button
          type="button"
          onClick={() => onSelect("")}
          className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const width = Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0);
          const isSelected = selectedStatus === item.key;
          const isDimmed = selectedStatus && !isSelected;
          return (
            <button
              type="button"
              key={item.key}
              onClick={() => onSelect((prev) => (prev === item.key ? "" : item.key))}
              className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                isSelected ? "border-indigo-300 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"
              } ${isDimmed ? "opacity-50" : "opacity-100"}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">{item.label}</span>
                <span className="text-sm font-bold text-gray-900">{item.value}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${width}%`, backgroundColor: palette[item.key] || "#9ca3af" }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PriorityPieChart({ items, selectedPriority, onSelect }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const safeTotal = Math.max(total, 1);
  const center = 76;
  const radius = 56;
  const colors = {
    CRITICAL: "#ef4444",
    HIGH: "#f59e0b",
    MEDIUM: "#10b981",
    LOW: "#0ea5e9"
  };
  const toXY = (angleDeg, r = radius) => {
    const rad = (Math.PI / 180) * angleDeg;
    return { x: center + r * Math.cos(rad), y: center + r * Math.sin(rad) };
  };
  const sectorPath = (startDeg, endDeg) => {
    const start = toXY(startDeg);
    const end = toXY(endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  };
  const slices = items.reduce(
    (acc, item) => {
      const sweep = (item.value / safeTotal) * 360;
      const start = acc.currentAngle;
      const end = start + sweep;
      const mid = start + sweep / 2;
      return {
        currentAngle: end,
        items: [...acc.items, { ...item, start, end, sweep, mid }]
      };
    },
    { currentAngle: -90, items: [] }
  ).items;
  return (
    <div className="flex h-full min-h-[360px] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">My Priority Distribution</h2>
        <button
          type="button"
          onClick={() => onSelect("")}
          className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>
      <div className="mt-5 flex flex-col items-center gap-5 md:flex-row md:items-center">
        <div className="relative h-40 w-40">
          <svg className="h-40 w-40" viewBox="0 0 152 152">
            {total === 0 && <circle cx={center} cy={center} r={radius} fill="#e5e7eb" />}
            {slices.map((slice) => {
              if (slice.value <= 0 || slice.sweep <= 0) return null;
              const fullCircle = slice.sweep >= 359.999;
              const isSelected = selectedPriority === slice.key;
              const isDimmed = selectedPriority && !isSelected;
              const offset = isSelected ? 4 : 0;
              const shift = toXY(slice.mid, offset);
              const tx = shift.x - center;
              const ty = shift.y - center;
              return fullCircle ? (
                <circle
                  key={slice.key}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill={colors[slice.key] || "#9ca3af"}
                  className={`cursor-pointer transition-all ${isDimmed ? "opacity-40" : "opacity-100"}`}
                  onClick={() => onSelect((prev) => (prev === slice.key ? "" : slice.key))}
                />
              ) : (
                <path
                  key={slice.key}
                  d={sectorPath(slice.start, slice.end)}
                  fill={colors[slice.key] || "#9ca3af"}
                  transform={`translate(${tx} ${ty})`}
                  className={`cursor-pointer transition-all ${isDimmed ? "opacity-40" : "opacity-100"}`}
                  onClick={() => onSelect((prev) => (prev === slice.key ? "" : slice.key))}
                />
              );
            })}
          </svg>
        </div>
        <div className="w-full max-w-[220px] space-y-2">
          {items.map((item) => {
            const isSelected = selectedPriority === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelect((prev) => (prev === item.key ? "" : item.key))}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 transition ${
                  isSelected ? "border-indigo-300 bg-indigo-50" : "border-transparent hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[item.key] || "#9ca3af" }} />
                  {formatStatus(item.key)}
                </span>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProjectLoad({ items, selectedProject, onSelect }) {
  if (!items.length) {
    return (
      <div className="flex h-full min-h-[360px] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">My Project Load</h2>
        <p className="mt-4 text-sm text-gray-500">No project data available.</p>
      </div>
    );
  }
  const max = Math.max(1, ...items.map((item) => item.total));
  return (
    <div className="flex h-full min-h-[360px] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">My Project Load</h2>
        <button
          type="button"
          onClick={() => onSelect("")}
          className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>
      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {items.map((item) => {
          const width = Math.max((item.total / max) * 100, item.total > 0 ? 8 : 0);
          const isSelected = selectedProject === item.projectId;
          const isDimmed = selectedProject && !isSelected;
          return (
            <button
              type="button"
              key={item.projectId || item.name}
              onClick={() => onSelect((prev) => (prev === item.projectId ? "" : item.projectId))}
              className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                isSelected ? "border-indigo-300 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"
              } ${isDimmed ? "opacity-50" : "opacity-100"}`}
            >
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="truncate font-medium text-gray-800">{item.name}</span>
                <span className="font-semibold text-gray-900">{item.total}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${width}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function EngineerDashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    setError("");
    try {
      const [issuesRes, projectsRes] = await Promise.all([getAllIssues(), getAllProjects()]);
      const allIssues = unwrapApiData(issuesRes);
      const allProjects = unwrapApiData(projectsRes);

      const associatedProjects = allProjects.filter((project) => matchesEngineerProject(project, user));
      const associatedProjectIds = new Set(
        associatedProjects
          .map((project) => (project?.id != null ? String(project.id) : ""))
          .filter(Boolean)
      );

      const scopedByAssignee = allIssues.filter((issue) => matchesCurrentEngineer(issue, user));
      const scopedByProject = allIssues.filter((issue) => {
        const { projectId } = getIssueProjectMeta(issue);
        return projectId ? associatedProjectIds.has(projectId) : false;
      });
      const sourceIssues = Array.from(
        new Map([...scopedByAssignee, ...scopedByProject].map((issue) => [String(issue.id), issue])).values()
      );

      const withSla = await Promise.all(
        sourceIssues.map(async (issue) => {
          try {
            const slaRes = await getIssueSlaStatus(issue.id);
            const sla = slaRes?.data || {};
            return { ...issue, slaStatus: String(sla?.status || "UNKNOWN").toUpperCase() };
          } catch {
            return { ...issue, slaStatus: "UNKNOWN" };
          }
        })
      );

      setIssues(withSla);
      if (associatedProjects.length > 0) {
        setProjects(associatedProjects);
      } else {
        const fallbackProjectMap = new Map();
        withSla.forEach((issue) => {
          const { projectId, projectName } = getIssueProjectMeta(issue);
          if (projectId) {
            fallbackProjectMap.set(projectId, { id: projectId, name: projectName });
          }
        });
        setProjects(Array.from(fallbackProjectMap.values()));
      }
      setLastUpdated(new Date());
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
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const projectLoad = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      if (project?.id == null) return;
      const pid = String(project.id);
      map.set(pid, { projectId: pid, name: project?.name || `Project #${project.id}`, total: 0 });
    });
    issues.forEach((issue) => {
      const { projectId, projectName } = getIssueProjectMeta(issue);
      const pid = projectId || "UNKNOWN";
      const current = map.get(pid) || {
        projectId: pid,
        name: projectName,
        total: 0
      };
      current.total += 1;
      map.set(pid, current);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }, [issues, projects]);

  const statusDistribution = useMemo(() => {
    const keys = ["CREATED", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    const map = new Map();
    issues.forEach((issue) => {
      const { projectId } = getIssueProjectMeta(issue);
      const projectOk = selectedProject ? projectId === selectedProject : true;
      const priorityOk = selectedPriority ? String(issue?.severity || "").toUpperCase() === selectedPriority : true;
      if (!projectOk || !priorityOk) return;
      const key = String(issue?.status || "UNKNOWN").toUpperCase();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return keys.map((key) => ({ key, label: formatStatus(key), value: map.get(key) || 0 }));
  }, [issues, selectedProject, selectedPriority]);

  const priorityDistribution = useMemo(() => {
    const keys = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
    const map = new Map();
    issues.forEach((issue) => {
      const { projectId } = getIssueProjectMeta(issue);
      const projectOk = selectedProject ? projectId === selectedProject : true;
      const statusOk = selectedStatus ? String(issue?.status || "").toUpperCase() === selectedStatus : true;
      if (!projectOk || !statusOk) return;
      const key = String(issue?.severity || "UNKNOWN").toUpperCase();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return keys.map((key) => ({ key, label: formatStatus(key), value: map.get(key) || 0 }));
  }, [issues, selectedProject, selectedStatus]);

  const filteredIssues = useMemo(() => {
    return issues
      .filter((issue) => {
        const { projectId } = getIssueProjectMeta(issue);
        const projectOk = selectedProject ? projectId === selectedProject : true;
        const statusOk = selectedStatus ? String(issue?.status || "").toUpperCase() === selectedStatus : true;
        const priorityOk = selectedPriority ? String(issue?.severity || "").toUpperCase() === selectedPriority : true;
        return projectOk && statusOk && priorityOk;
      })
      .sort((a, b) => new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime());
  }, [issues, selectedProject, selectedPriority, selectedStatus]);

  const createdCount = statusDistribution.find((item) => item.key === "CREATED")?.value || 0;
  const openCount = statusDistribution.find((item) => item.key === "OPEN")?.value || 0;
  const inProgressCount = statusDistribution.find((item) => item.key === "IN_PROGRESS")?.value || 0;
  const resolvedCount = statusDistribution.find((item) => item.key === "RESOLVED")?.value || 0;
  const closedCount = statusDistribution.find((item) => item.key === "CLOSED")?.value || 0;
  const doneCount = resolvedCount + closedCount;
  const totalCount = statusDistribution.reduce((sum, item) => sum + item.value, 0);
  const resolvedRate = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const breachedCount = issues.filter((issue) => String(issue?.slaStatus || "").toUpperCase() === "BREACHED").length;
  const projectCount = useMemo(() => projects.length, [projects]);

  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Engineer Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Monitor your issues, priorities, and SLA risks from one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">Updated: {lastUpdated ? lastUpdated.toLocaleString() : "-"}</div>
          <button
            type="button"
            onClick={() => fetchData({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={FolderKanban} label="My Projects" value={projectCount} hint="Projects associated with you" tone="indigo" />
        <StatCard icon={Ticket} label="My Issues" value={totalCount} hint="Total tracked for you" tone="blue" />
        <StatCard icon={AlertTriangle} label="Active Backlog" value={createdCount + openCount + inProgressCount} hint="Created + Open + In Progress" tone="amber" />
        <StatCard icon={CheckCircle2} label="Resolved Rate" value={`${resolvedRate}%`} hint={`${doneCount} resolved/closed`} tone="emerald" />
        <StatCard icon={TimerReset} label="SLA Breached" value={breachedCount} hint="Requires immediate action" tone="red" />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
        <div className="h-full xl:col-span-1">
          <IssueStatusChart items={statusDistribution} selectedStatus={selectedStatus} onSelect={setSelectedStatus} />
        </div>
        <div className="h-full xl:col-span-1">
          <PriorityPieChart items={priorityDistribution} selectedPriority={selectedPriority} onSelect={setSelectedPriority} />
        </div>
        <div className="h-full xl:col-span-1">
          <ProjectLoad items={projectLoad} selectedProject={selectedProject} onSelect={setSelectedProject} />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200">
        <div className="flex flex-col gap-2 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Recent My Issues</h2>
            <p className="text-xs text-gray-500">
              {selectedProject || selectedStatus || selectedPriority
                ? `Filtered by ${selectedProject ? "Project / " : ""}${selectedStatus ? formatStatus(selectedStatus) : "All Status"} / ${selectedPriority ? formatStatus(selectedPriority) : "All Priority"}`
                : "Showing latest issue activity"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectedProject && (
              <button
                type="button"
                onClick={() => setSelectedProject("")}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear Project
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedStatus("")}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear Status
            </button>
            <button
              type="button"
              onClick={() => setSelectedPriority("")}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear Priority
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Issue ID</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">SLA</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {(loading ? [] : filteredIssues.slice(0, 10)).map((issue) => (
                <tr key={issue.id} className="border-t border-gray-200">
                  <td className="px-4 py-3 font-semibold text-indigo-700">{issueCode(issue.id)}</td>
                  <td className="px-4 py-3 text-gray-900">{issue?.title || "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{getIssueProjectMeta(issue).projectName || "-"}</td>
                  <td className="px-4 py-3 text-gray-700">{formatStatus(issue?.status)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatStatus(issue?.severity)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatStatus(issue?.slaStatus || "UNKNOWN")}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDateTime(issue?.createdAt)}</td>
                </tr>
              ))}
              {!loading && filteredIssues.length === 0 && (
                <tr className="border-t border-gray-200">
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    No issues found for current filters.
                  </td>
                </tr>
              )}
              {loading && (
                <tr className="border-t border-gray-200">
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                    Loading dashboard...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
