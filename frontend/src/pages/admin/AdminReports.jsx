import { useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { getAllUsers } from "../../api/userApi";
import { getAllProjects } from "../../api/projectApi";
import { getAllIssues, getIssueSlaStatus } from "../../api/issuesApi";
import { getEngineerWorkload, getManagerWorkload } from "../../api/workloadApi";
import { showError } from "../../utils/toast";

const REPORT_TABS = [
  { key: "workload", label: "Workload" },
  { key: "issues", label: "Issue Report" },
  { key: "sla", label: "SLA Report" }
];
const ISSUE_STATUS_ORDER = ["CREATED", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const SLA_STATUS_ORDER = ["NOT_STARTED", "ON_TRACK", "RESOLVED_IN_SLA", "AT_RISK", "BREACHED"];

function getApiMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.statusMessage ||
    err?.message ||
    "Something went wrong"
  );
}

function unwrapApiData(res) {
  if (!res) return null;
  if (Array.isArray(res)) return res;
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

function formatMinutes(value) {
  if (value == null || Number.isNaN(Number(value))) return "-";
  const total = Number(value);
  const sign = total < 0 ? "-" : "";
  const abs = Math.abs(total);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  if (h === 0) return `${sign}${m}m`;
  return `${sign}${h}h ${m}m`;
}

function StatCard({ label, value, hint, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border bg-white p-4 text-left transition ${
        active ? "border-indigo-300 ring-2 ring-indigo-200" : "border-gray-200"
      } ${onClick ? "hover:bg-gray-50" : ""}`}
      disabled={!onClick}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{hint}</p>
    </button>
  );
}

function SlaStatusCard({ label, value, hint, onClick, active, tone }) {
  const palette = {
    indigo: {
      card: "border-indigo-200 bg-indigo-50 dark:border-indigo-500/35 dark:bg-indigo-500/12",
      text: "text-indigo-900 dark:text-indigo-100",
      hint: "text-indigo-700/80 dark:text-indigo-300/90",
      ring: "ring-indigo-200"
    },
    emerald: {
      card: "border-emerald-200 bg-emerald-50 dark:border-emerald-500/35 dark:bg-emerald-500/12",
      text: "text-emerald-900 dark:text-emerald-100",
      hint: "text-emerald-700/80 dark:text-emerald-300/90",
      ring: "ring-emerald-200"
    },
    cyan: {
      card: "border-cyan-200 bg-cyan-50 dark:border-cyan-500/35 dark:bg-cyan-500/12",
      text: "text-cyan-900 dark:text-cyan-100",
      hint: "text-cyan-700/80 dark:text-cyan-300/90",
      ring: "ring-cyan-200"
    },
    amber: {
      card: "border-amber-200 bg-amber-50 dark:border-amber-500/35 dark:bg-amber-500/12",
      text: "text-amber-900 dark:text-amber-100",
      hint: "text-amber-700/80 dark:text-amber-300/90",
      ring: "ring-amber-200"
    },
    red: {
      card: "border-red-200 bg-red-50 dark:border-red-500/35 dark:bg-red-500/12",
      text: "text-red-900 dark:text-red-100",
      hint: "text-red-700/80 dark:text-red-300/90",
      ring: "ring-red-200"
    }
  };
  const styles = palette[tone] || palette.indigo;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition ${styles.card} ${
        active ? `ring-2 ${styles.ring}` : ""
      } ${onClick ? "hover:opacity-90" : ""}`}
      disabled={!onClick}
    >
      <p className={`text-xs font-semibold uppercase tracking-wide ${styles.hint}`}>{label}</p>
      <p className={`mt-2 text-2xl font-bold ${styles.text}`}>{value}</p>
      <p className={`mt-1 text-xs ${styles.hint}`}>{hint}</p>
    </button>
  );
}

function WorkloadDistributionChart({ items, selectedId, onSelect }) {
  const max = Math.max(1, ...items.map((i) => Number(i?.workload || 0)));
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-3xl font-semibold text-gray-900">Workload Distribution</h3>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No workload data available.</p>
        ) : (
          items.map((item) => {
            const value = Number(item?.workload || 0);
            const width = Math.max((value / max) * 100, value > 0 ? 6 : 0);
            const isSelected = String(selectedId || "") === String(item.id);
            const isDimmed = selectedId && !isSelected;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                  isSelected ? "border-indigo-300 bg-indigo-50" : "border-gray-200 hover:bg-gray-50"
                } ${isDimmed ? "opacity-50" : "opacity-100"}`}
              >
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">{item?.fullName || "-"}</span>
                  <span className="font-semibold text-indigo-700">{value}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${width}%` }} />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function IssueStatusBarChart({ items, selectedKey, onSelect }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const palette = ["#0ea5e9", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#6b7280"];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-3xl font-semibold text-gray-900">Issue Status Distribution</h3>
      <div className="mt-5">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">No status data available.</p>
        ) : (
          <>
            <div
              className="grid h-64 items-end gap-3 rounded-lg border border-dashed border-gray-200 p-4"
              style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))` }}
            >
              {items.map((item, idx) => {
                const h = Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0);
                const isSelected = selectedKey === item.key;
                const isDimmed = selectedKey && !isSelected;
                return (
                  <button
                    type="button"
                    key={item.label}
                    onClick={() => onSelect(item.key)}
                    className="flex h-full flex-col justify-end text-left"
                  >
                    <div className="mb-2 text-center text-xs font-semibold text-gray-600">{item.value}</div>
                    <div
                      className={`rounded-t-md transition-all ${isSelected ? "ring-2 ring-indigo-400" : ""} ${isDimmed ? "opacity-40" : "opacity-100"}`}
                      style={{
                        height: `${h}%`,
                        backgroundColor: palette[idx % palette.length]
                      }}
                    />
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
              {items.map((item, idx) => (
                <div key={item.label} className="flex items-center gap-2 text-gray-700">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: palette[idx % palette.length] }}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PriorityPieChart({ items, selectedKey, onSelect }) {
  const total = items.reduce((sum, i) => sum + i.value, 0);
  const colors = {
    CRITICAL: "#0ea5e9",
    HIGH: "#f59e0b",
    MEDIUM: "#10b981",
    LOW: "#ef4444"
  };

  const ordered = PRIORITY_ORDER
    .map((key) => items.find((i) => i.key === key))
    .filter(Boolean);
  const cx = 112;
  const cy = 112;
  const radius = 92;
  const toXY = (angleDeg, r = radius) => {
    const a = (Math.PI / 180) * angleDeg;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  };
  const sectorPath = (startDeg, endDeg) => {
    const start = toXY(startDeg);
    const end = toXY(endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  };

  const slices = ordered
    .filter((item) => item.value > 0)
    .reduce(
      (acc, item) => {
        const sweep = total === 0 ? 0 : (item.value / total) * 360;
        const start = acc.currentAngle;
        const end = start + sweep;
        const mid = start + sweep / 2;
        return {
          currentAngle: end,
          items: [...acc.items, { ...item, start, end, mid }]
        };
      },
      { currentAngle: -90, items: [] }
    ).items;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-3xl font-semibold text-gray-900">Priority Distribution</h3>
      <div className="mt-5 flex flex-col items-center">
        <div className="relative h-56 w-56">
          <svg viewBox="0 0 224 224" className="h-56 w-56">
            {total === 0 && <circle cx={cx} cy={cy} r={radius} fill="#e5e7eb" />}
            {slices.map((slice) => {
              const isSelected = selectedKey === slice.key;
              const isDimmed = selectedKey && !isSelected;
              const shift = toXY(slice.mid, isSelected ? 6 : 0);
              const tx = shift.x - cx;
              const ty = shift.y - cy;
              const fullCircle = Math.abs(slice.end - slice.start) >= 359.999;
              return (
                fullCircle ? (
                  <circle
                    key={slice.key}
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={colors[slice.key] || "#9ca3af"}
                    className={`cursor-pointer transition-all ${isDimmed ? "opacity-40" : "opacity-100"}`}
                    onClick={() => onSelect(slice.key)}
                  />
                ) : (
                  <path
                    key={slice.key}
                    d={sectorPath(slice.start, slice.end)}
                    fill={colors[slice.key] || "#9ca3af"}
                    transform={`translate(${tx} ${ty})`}
                    className={`cursor-pointer transition-all ${isDimmed ? "opacity-40" : "opacity-100"}`}
                    onClick={() => onSelect(slice.key)}
                  />
                )
              );
            })}
          </svg>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
          {ordered.map((item) => {
            const pct = total === 0 ? 0 : Number(((item.value / total) * 100).toFixed(1));
            const isSelected = selectedKey === item.key;
            return (
              <button
                type="button"
                key={item.key}
                onClick={() => onSelect(item.key)}
                className={`flex items-center gap-2 rounded-md px-2 py-1 transition ${isSelected ? "bg-indigo-50 ring-1 ring-indigo-300" : "hover:bg-gray-50"}`}
              >
                <span
                  className="inline-block h-3 w-3 rounded-sm"
                  style={{ backgroundColor: colors[item.key] || "#9ca3af" }}
                />
                <span className="text-gray-700">
                  {formatStatus(item.key)} {pct}% ({item.value})
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AdminReports() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [issues, setIssues] = useState([]);
  const [issuesWithSla, setIssuesWithSla] = useState([]);
  const [managerWorkloads, setManagerWorkloads] = useState([]);
  const [employeeWorkloads, setEmployeeWorkloads] = useState([]);

  const [activeTab, setActiveTab] = useState("workload");
  const [workloadView, setWorkloadView] = useState("MANAGER");
  const [selectedWorkloadUserId, setSelectedWorkloadUserId] = useState("");
  const [issueProjectFilter, setIssueProjectFilter] = useState("ALL");
  const [selectedIssueStatus, setSelectedIssueStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedSlaStatus, setSelectedSlaStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    setError("");
    try {
      const [usersRes, projectsRes, issuesRes] = await Promise.all([
        getAllUsers(),
        getAllProjects(),
        getAllIssues()
      ]);

      const usersData = unwrapApiData(usersRes);
      const projectsData = unwrapApiData(projectsRes);
      const issuesData = unwrapApiData(issuesRes);

      const usersList = Array.isArray(usersData) ? usersData : [];
      const projectsList = Array.isArray(projectsData) ? projectsData : [];
      const issuesList = Array.isArray(issuesData) ? issuesData : [];

      setUsers(usersList);
      setProjects(projectsList);
      setIssues(issuesList);

      const withSla = await Promise.all(
        issuesList.map(async (issue) => {
          try {
            const res = await getIssueSlaStatus(issue.id);
            const sla = unwrapApiData(res) || {};
            return {
              ...issue,
              slaStatus: String(sla?.status || "UNKNOWN").toUpperCase(),
              slaDueTime: sla?.slaDueTime || null,
              remainingMinutes:
                sla?.remainingMinutes == null ? null : Number(sla.remainingMinutes)
            };
          } catch {
            return {
              ...issue,
              slaStatus: "UNKNOWN",
              slaDueTime: null,
              remainingMinutes: null
            };
          }
        })
      );
      setIssuesWithSla(withSla);

      const managers = usersList.filter((u) => String(u?.role || "") === "MANAGER");
      const engineers = usersList.filter((u) => String(u?.role || "") === "ENGINEER");

      const [managerLoads, employeeLoads] = await Promise.all([
        Promise.all(
          managers.map(async (manager) => {
            try {
              const res = await getManagerWorkload(manager.id);
              return { ...manager, workload: Number(unwrapApiData(res) || 0) };
            } catch {
              return { ...manager, workload: 0 };
            }
          })
        ),
        Promise.all(
          engineers.map(async (employee) => {
            try {
              const res = await getEngineerWorkload(employee.id);
              return { ...employee, workload: Number(unwrapApiData(res) || 0) };
            } catch {
              return { ...employee, workload: 0 };
            }
          })
        )
      ]);

      setManagerWorkloads(managerLoads.sort((a, b) => b.workload - a.workload));
      setEmployeeWorkloads(employeeLoads.sort((a, b) => b.workload - a.workload));
    } catch (err) {
      const msg = getApiMessage(err);
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const projectNameById = useMemo(() => {
    const map = new Map();
    projects.forEach((p) => {
      if (p?.id != null) {
        map.set(String(p.id), p?.name || p?.projectName || `Project #${p.id}`);
      }
    });
    return map;
  }, [projects]);

  const managerCount = useMemo(
    () => users.filter((u) => String(u?.role || "") === "MANAGER").length,
    [users]
  );
  const employeeCount = useMemo(
    () => users.filter((u) => String(u?.role || "") === "ENGINEER").length,
    [users]
  );

  const totalManagerWorkload = useMemo(
    () => managerWorkloads.reduce((sum, item) => sum + Number(item?.workload || 0), 0),
    [managerWorkloads]
  );
  const totalEmployeeWorkload = useMemo(
    () => employeeWorkloads.reduce((sum, item) => sum + Number(item?.workload || 0), 0),
    [employeeWorkloads]
  );

  const issueProjectOptions = useMemo(() => {
    const set = new Map();
    projects.forEach((project) => {
      if (project?.id != null) {
        const pid = String(project.id);
        set.set(pid, project?.name || project?.projectName || `Project #${pid}`);
      }
    });
    issues.forEach((issue) => {
      if (issue?.projectId == null) return;
      const pid = String(issue.projectId);
      if (!set.has(pid)) {
        set.set(pid, issue?.projectName || projectNameById.get(pid) || `Project #${pid}`);
      }
    });
    return Array.from(set.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, issues, projectNameById]);

  const projectScopedIssues = useMemo(() => {
    if (issueProjectFilter === "ALL") return issues;
    return issues.filter((issue) => String(issue?.projectId) === String(issueProjectFilter));
  }, [issues, issueProjectFilter]);

  const issuesForStatusChart = useMemo(() => {
    if (!selectedPriority) return projectScopedIssues;
    return projectScopedIssues.filter(
      (issue) => String(issue?.severity || "UNKNOWN").toUpperCase() === selectedPriority
    );
  }, [projectScopedIssues, selectedPriority]);

  const issuesForPriorityChart = useMemo(() => {
    if (!selectedIssueStatus) return projectScopedIssues;
    return projectScopedIssues.filter(
      (issue) => String(issue?.status || "UNKNOWN").toUpperCase() === selectedIssueStatus
    );
  }, [projectScopedIssues, selectedIssueStatus]);

  const filteredIssues = useMemo(() => {
    return projectScopedIssues.filter((issue) => {
      const statusOk = selectedIssueStatus
        ? String(issue?.status || "UNKNOWN").toUpperCase() === selectedIssueStatus
        : true;
      const priorityOk = selectedPriority
        ? String(issue?.severity || "UNKNOWN").toUpperCase() === selectedPriority
        : true;
      return statusOk && priorityOk;
    });
  }, [projectScopedIssues, selectedIssueStatus, selectedPriority]);

  const statusDistribution = useMemo(() => {
    const map = new Map();
    issuesForStatusChart.forEach((issue) => {
      const key = String(issue?.status || "UNKNOWN").toUpperCase();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return ISSUE_STATUS_ORDER.map((status) => ({
      key: status,
      label: formatStatus(status),
      value: map.get(status) || 0
    }));
  }, [issuesForStatusChart]);

  const priorityDistribution = useMemo(() => {
    const map = new Map();
    issuesForPriorityChart.forEach((issue) => {
      const key = String(issue?.severity || "UNKNOWN").toUpperCase();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return PRIORITY_ORDER.map((priority) => ({
      key: priority,
      label: formatStatus(priority),
      value: map.get(priority) || 0
    }));
  }, [issuesForPriorityChart]);

  const slaKnownIssues = useMemo(
    () =>
      issuesWithSla.filter((issue) =>
        ["NOT_STARTED", "ON_TRACK", "RESOLVED_IN_SLA", "AT_RISK", "BREACHED"].includes(
          String(issue?.slaStatus || "").toUpperCase()
        )
      ),
    [issuesWithSla]
  );

  const filteredSlaIssues = useMemo(() => {
    return slaKnownIssues.filter((issue) => {
      const currentStatus = String(issue?.slaStatus || "").toUpperCase();
      return selectedSlaStatus ? currentStatus === selectedSlaStatus : true;
    });
  }, [slaKnownIssues, selectedSlaStatus]);

  const slaSummary = useMemo(() => {
    const notStarted = filteredSlaIssues.filter((i) => i.slaStatus === "NOT_STARTED").length;
    const onTrack = filteredSlaIssues.filter((i) => i.slaStatus === "ON_TRACK").length;
    const resolvedWithinSla = filteredSlaIssues.filter((i) => i.slaStatus === "RESOLVED_IN_SLA").length;
    const atRisk = filteredSlaIssues.filter((i) => i.slaStatus === "AT_RISK").length;
    const breached = filteredSlaIssues.filter((i) => i.slaStatus === "BREACHED").length;
    const total = filteredSlaIssues.length;
    const compliance = total === 0 ? 0 : Number((((onTrack + resolvedWithinSla) / total) * 100).toFixed(2));

    const allocatedSamples = filteredSlaIssues
      .map((i) => {
        if (!i?.createdAt || !i?.slaDueTime) return null;
        const start = new Date(i.createdAt).getTime();
        const due = new Date(i.slaDueTime).getTime();
        if (Number.isNaN(start) || Number.isNaN(due) || due <= start) return null;
        return (due - start) / 60000;
      })
      .filter((v) => v != null);

    const avgAllocatedMin =
      allocatedSamples.length === 0
        ? 0
        : Math.round(
            allocatedSamples.reduce((sum, value) => sum + value, 0) / allocatedSamples.length
          );

    return { notStarted, onTrack, resolvedWithinSla, atRisk, breached, total, compliance, avgAllocatedMin };
  }, [filteredSlaIssues]);

  const slaStatusDistribution = useMemo(() => {
    const map = new Map();
    slaKnownIssues.forEach((issue) => {
      const key = String(issue?.slaStatus || "UNKNOWN").toUpperCase();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return SLA_STATUS_ORDER.map((status) => ({
      key: status,
      label: formatStatus(status),
      value: map.get(status) || 0
    }));
  }, [slaKnownIssues]);

  const workloadRows = workloadView === "MANAGER" ? managerWorkloads : employeeWorkloads;
  const filteredWorkloadRows = useMemo(() => {
    if (!selectedWorkloadUserId) return workloadRows;
    return workloadRows.filter((row) => String(row.id) === String(selectedWorkloadUserId));
  }, [workloadRows, selectedWorkloadUserId]);

  useEffect(() => {
    if (!selectedWorkloadUserId) return;
    const exists = workloadRows.some((row) => String(row.id) === String(selectedWorkloadUserId));
    if (!exists) setSelectedWorkloadUserId("");
  }, [workloadRows, selectedWorkloadUserId]);

  return (
    <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-600">
            Analytics dashboard for workload, issue distribution, and SLA trend.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchData({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {REPORT_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-gray-600 hover:bg-white/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "workload" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Managers" value={managerCount} hint="Total manager accounts" />
            <StatCard label="Employees" value={employeeCount} hint="Total engineer accounts" />
            <StatCard label="Manager Workload" value={totalManagerWorkload} hint="Overall manager load" />
            <StatCard label="Employee Workload" value={totalEmployeeWorkload} hint="Overall employee load" />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <WorkloadDistributionChart
              items={workloadRows}
              selectedId={selectedWorkloadUserId}
              onSelect={(id) =>
                setSelectedWorkloadUserId((prev) => (String(prev) === String(id) ? "" : String(id)))
              }
            />

            <div className="rounded-xl border border-gray-200">
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <h2 className="text-base font-semibold text-gray-900">Workload Filters</h2>
                <button
                  type="button"
                  onClick={() => setSelectedWorkloadUserId("")}
                  data-report-exclude="true"
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Clear Selection
                </button>
              </div>
              <div className="p-4">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  View Type
                </label>
                <select
                  value={workloadView}
                  onChange={(e) => {
                    setWorkloadView(e.target.value);
                    setSelectedWorkloadUserId("");
                  }}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="MANAGER">Manager</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
                <p className="mt-3 text-sm text-gray-600">
                  Click a person in the workload chart to highlight and filter table rows.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200">
            <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-gray-900">Workload Details</h2>
              <div className="text-sm text-gray-600">
                {filteredWorkloadRows.length} entr{filteredWorkloadRows.length === 1 ? "y" : "ies"}
              </div>
            </div>
            <div className="max-h-[24rem] overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Company</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Workload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-sm text-gray-600">Loading workload data...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-sm text-gray-700">Failed to load workload: {error}</td>
                    </tr>
                  ) : filteredWorkloadRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-600">No workload data found.</td>
                    </tr>
                  ) : (
                    filteredWorkloadRows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-gray-800">{row.fullName || "-"}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{row.email || "-"}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{row.company || "-"}</td>
                        <td className="px-4 py-2 text-sm font-semibold text-indigo-700">{row.workload ?? 0}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "issues" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-gray-900">Issue Report</h2>
            <div className="flex items-center gap-2" data-report-exclude="true">
              <select
                value={issueProjectFilter}
                onChange={(e) => setIssueProjectFilter(e.target.value)}
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">All Projects</option>
                {issueProjectOptions.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setSelectedIssueStatus("");
                  setSelectedPriority("");
                }}
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear Selection
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <IssueStatusBarChart
              items={statusDistribution}
              selectedKey={selectedIssueStatus}
              onSelect={(key) =>
                setSelectedIssueStatus((prev) => (prev === key ? "" : key))
              }
            />
            <PriorityPieChart
              items={priorityDistribution}
              selectedKey={selectedPriority}
              onSelect={(key) =>
                setSelectedPriority((prev) => (prev === key ? "" : key))
              }
            />
          </div>

          <div className="rounded-xl border border-gray-200">
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900">Issues by Project and Status</h3>
            </div>
            <div className="max-h-[24rem] overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Issue ID</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Title</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Project</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Priority</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-sm text-gray-600">Loading issues...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-sm text-gray-700">Failed to load issues: {error}</td>
                    </tr>
                  ) : filteredIssues.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-600">
                        {issueProjectFilter === "ALL"
                          ? "No issues found."
                          : `No issues found for ${issueProjectOptions.find((p) => p.id === issueProjectFilter)?.name || "the selected project"}.`}
                      </td>
                    </tr>
                  ) : (
                    filteredIssues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-indigo-600">{issueCode(issue.id)}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{issue.title || "-"}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {issue.projectName || projectNameById.get(String(issue.projectId)) || "-"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">{formatStatus(issue.status)}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{formatStatus(issue.severity)}</td>
                        <td className="px-4 py-2 text-xs text-gray-700">{formatDateTime(issue.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "sla" && (
        <div className="space-y-4">
          <div className="flex items-center justify-end" data-report-exclude="true">
              <button
                type="button"
                onClick={() => {
                  setSelectedSlaStatus("");
                }}
                className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear Selection
              </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <SlaStatusCard
              label="Not Started"
              value={slaSummary.notStarted}
              hint="SLA timer not started"
              onClick={() => setSelectedSlaStatus((prev) => (prev === "NOT_STARTED" ? "" : "NOT_STARTED"))}
              active={selectedSlaStatus === "NOT_STARTED"}
              tone="indigo"
            />
            <SlaStatusCard
              label="On Track"
              value={slaSummary.onTrack}
              hint="Within SLA window"
              onClick={() => setSelectedSlaStatus((prev) => (prev === "ON_TRACK" ? "" : "ON_TRACK"))}
              active={selectedSlaStatus === "ON_TRACK"}
              tone="emerald"
            />
            <SlaStatusCard
              label="Solved Within SLA"
              value={slaSummary.resolvedWithinSla}
              hint="Resolved before SLA due"
              onClick={() =>
                setSelectedSlaStatus((prev) =>
                  prev === "RESOLVED_IN_SLA" ? "" : "RESOLVED_IN_SLA"
                )
              }
              active={selectedSlaStatus === "RESOLVED_IN_SLA"}
              tone="cyan"
            />
            <SlaStatusCard
              label="At Risk"
              value={slaSummary.atRisk}
              hint="Near due time"
              onClick={() => setSelectedSlaStatus((prev) => (prev === "AT_RISK" ? "" : "AT_RISK"))}
              active={selectedSlaStatus === "AT_RISK"}
              tone="amber"
            />
            <SlaStatusCard
              label="Breached"
              value={slaSummary.breached}
              hint="SLA crossed due"
              onClick={() => setSelectedSlaStatus((prev) => (prev === "BREACHED" ? "" : "BREACHED"))}
              active={selectedSlaStatus === "BREACHED"}
              tone="red"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="w-full max-w-3xl">
              <IssueStatusBarChart
                items={slaStatusDistribution}
                selectedKey={selectedSlaStatus}
                onSelect={(key) => setSelectedSlaStatus((prev) => (prev === key ? "" : key))}
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200">
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900">SLA Issue Details</h3>
              <p className="mt-1 text-sm text-gray-600">
                Compliance: <span className="font-semibold text-gray-900">{slaSummary.compliance}%</span>
              </p>
            </div>
            <div className="max-h-[24rem] overflow-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Issue ID</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Title</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Project</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">SLA Status</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">SLA Due</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-sm text-gray-600">Loading SLA issues...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-sm text-gray-700">Failed to load SLA data: {error}</td>
                    </tr>
                  ) : filteredSlaIssues.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-600">No SLA issues found.</td>
                    </tr>
                  ) : (
                    filteredSlaIssues.map((issue) => (
                      <tr key={issue.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm font-medium text-indigo-600">{issueCode(issue.id)}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{issue.title || "-"}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">
                          {issue.projectName || projectNameById.get(String(issue.projectId)) || "-"}
                        </td>
                        <td className="px-4 py-2">
                          <span className="inline-flex rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            {formatStatus(issue.slaStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-700">{formatDateTime(issue.slaDueTime)}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{formatMinutes(issue.remainingMinutes)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
