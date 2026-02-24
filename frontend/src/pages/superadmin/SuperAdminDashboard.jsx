import { createElement, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Building2,
  ClipboardList,
  RefreshCcw,
  ShieldCheck,
  Users
} from "lucide-react";
import { getAllUsers } from "../../api/userApi";
import { getAllProjects } from "../../api/projectApi";
import { getAllAuditLogs } from "../../api/auditLogApi";
import { showError } from "../../utils/toast";
import { useTheme } from "../../context/useTheme";

const ROLE_ORDER = ["SUPER_ADMIN", "ADMIN", "MANAGER", "ENGINEER", "USER"];
const ROLE_COLORS = {
  SUPER_ADMIN: "bg-rose-500",
  ADMIN: "bg-blue-500",
  MANAGER: "bg-amber-500",
  ENGINEER: "bg-emerald-500",
  USER: "bg-violet-500"
};
const LOG_WINDOW_OPTIONS = [
  { value: "24H", label: "Last 24h" },
  { value: "7D", label: "Last 7d" },
  { value: "30D", label: "Last 30d" },
  { value: "ALL", label: "All time" }
];

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

function safeDate(input) {
  if (!input) return null;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function timeAgo(input) {
  const date = safeDate(input);
  if (!date) return "-";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function humanizeToken(value) {
  return String(value || "-")
    .toLowerCase()
    .split("_")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ");
}

function StatCard({ icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        </div>
        <div className="rounded-xl bg-gray-100 p-2 text-gray-700">
          {icon ? createElement(icon, { className: "h-5 w-5" }) : null}
        </div>
      </div>
    </div>
  );
}

function BarList({ items, emptyText }) {
  if (!items.length) {
    return <p className="text-sm text-gray-500">{emptyText}</p>;
  }

  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">{item.label}</span>
            <span className="text-gray-500">{item.value}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div
              className={`h-2 rounded-full ${item.color}`}
              style={{ width: `${Math.max((item.value / max) * 100, 8)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusDonut({ values, selected, onSelect, isDark }) {
  const total = values.active + values.disabled + values.locked;
  const safeTotal = Math.max(total, 1);
  const center = 70;
  const radius = 52;

  const opacityFor = (key) => (!selected || selected === key ? 1 : 0.5);

  const toXY = (angleDeg, r = radius) => {
    const a = (Math.PI / 180) * angleDeg;
    return { x: center + r * Math.cos(a), y: center + r * Math.sin(a) };
  };

  const sectorPath = (startDeg, endDeg) => {
    const start = toXY(startDeg);
    const end = toXY(endDeg);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  };

  const slices = [
    { key: "active", label: "Active", value: values.active, color: "#16a34a" },
    { key: "disabled", label: "Disabled", value: values.disabled, color: "#f59e0b" },
    { key: "locked", label: "Locked", value: values.locked, color: "#ef4444" }
  ];
  const pieSlices = slices.reduce(
    (acc, slice) => {
      const sweep = (slice.value / safeTotal) * 360;
      const start = acc.currentAngle;
      const end = start + sweep;
      const mid = start + sweep / 2;
      return {
        currentAngle: end,
        items: [...acc.items, { ...slice, start, end, sweep, mid }]
      };
    },
    { currentAngle: -90, items: [] }
  ).items;

  const textPrimary = isDark ? "#F1F5F9" : "#0F172A";
  const hoverBg = isDark ? "rgba(30,41,59,0.8)" : "#F8FAFC";
  const selectedBg = (tone) =>
    isDark
      ? tone === "active"
        ? "rgba(20,83,45,0.35)"
        : tone === "disabled"
          ? "rgba(120,53,15,0.35)"
          : "rgba(127,29,29,0.35)"
      : tone === "active"
        ? "#ECFDF5"
        : tone === "disabled"
          ? "#FFFBEB"
          : "#FEF2F2";
  const selectedRing = (tone) =>
    isDark
      ? tone === "active"
        ? "1px solid rgba(34,197,94,0.45)"
        : tone === "disabled"
          ? "1px solid rgba(245,158,11,0.45)"
          : "1px solid rgba(239,68,68,0.45)"
      : tone === "active"
        ? "1px solid #86EFAC"
        : tone === "disabled"
          ? "1px solid #FCD34D"
          : "1px solid #FCA5A5";

  return (
    <div className="flex flex-col items-center gap-6 md:flex-row md:items-center">
      <div className="relative h-52 w-52">
        <svg viewBox="0 0 140 140" className="h-52 w-52">
          {pieSlices.map((slice) => {
            if (slice.value <= 0 || slice.sweep <= 0) return null;
            const isSelected = selected === slice.key;
            const offset = isSelected ? 5 : 0;
            const shift = toXY(slice.mid, offset);
            const tx = shift.x - center;
            const ty = shift.y - center;
            const fullCircle = slice.sweep >= 359.999;
            return (
              fullCircle ? (
                <circle
                  key={slice.key}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill={slice.color}
                  className="cursor-pointer transition-all"
                  opacity={opacityFor(slice.key)}
                  onClick={() => onSelect(slice.key)}
                >
                  <title>{`${slice.label}: ${slice.value} user${slice.value === 1 ? "" : "s"}`}</title>
                </circle>
              ) : (
                <path
                  key={slice.key}
                  d={sectorPath(slice.start, slice.end)}
                  fill={slice.color}
                  stroke={slice.color}
                  className="cursor-pointer transition-all"
                  opacity={opacityFor(slice.key)}
                  transform={`translate(${tx} ${ty})`}
                  onClick={() => onSelect(slice.key)}
                >
                  <title>{`${slice.label}: ${slice.value} user${slice.value === 1 ? "" : "s"}`}</title>
                </path>
              )
            );
          })}
        </svg>
      </div>

      <div className="w-full max-w-[220px] space-y-2 text-sm">
        <button
          type="button"
          onClick={() => onSelect("active")}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 transition-all"
          style={{
            backgroundColor: selected === "active" ? selectedBg("active") : "transparent",
            border: selected === "active" ? selectedRing("active") : "1px solid transparent"
          }}
          onMouseEnter={(e) => {
            if (selected !== "active") e.currentTarget.style.backgroundColor = hoverBg;
          }}
          onMouseLeave={(e) => {
            if (selected !== "active") e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span className="flex items-center gap-2" style={{ color: textPrimary }}>
            <span className="h-2.5 w-2.5 rounded-full bg-green-600" />
            <span className="font-medium">Active</span>
          </span>
          <span className="font-semibold" style={{ color: textPrimary }}>{values.active}</span>
        </button>
        <button
          type="button"
          onClick={() => onSelect("disabled")}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 transition-all"
          style={{
            backgroundColor: selected === "disabled" ? selectedBg("disabled") : "transparent",
            border: selected === "disabled" ? selectedRing("disabled") : "1px solid transparent"
          }}
          onMouseEnter={(e) => {
            if (selected !== "disabled") e.currentTarget.style.backgroundColor = hoverBg;
          }}
          onMouseLeave={(e) => {
            if (selected !== "disabled") e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span className="flex items-center gap-2" style={{ color: textPrimary }}>
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="font-medium">Disabled</span>
          </span>
          <span className="font-semibold" style={{ color: textPrimary }}>{values.disabled}</span>
        </button>
        <button
          type="button"
          onClick={() => onSelect("locked")}
          className="flex w-full items-center justify-between rounded-lg px-3 py-2 transition-all"
          style={{
            backgroundColor: selected === "locked" ? selectedBg("locked") : "transparent",
            border: selected === "locked" ? selectedRing("locked") : "1px solid transparent"
          }}
          onMouseEnter={(e) => {
            if (selected !== "locked") e.currentTarget.style.backgroundColor = hoverBg;
          }}
          onMouseLeave={(e) => {
            if (selected !== "locked") e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span className="flex items-center gap-2" style={{ color: textPrimary }}>
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span className="font-medium">Locked</span>
          </span>
          <span className="font-semibold" style={{ color: textPrimary }}>{values.locked}</span>
        </button>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { isDark } = useTheme();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [logWindow, setLogWindow] = useState("7D");
  const [logSearch, setLogSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(null);

  const fetchData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    setError("");
    try {
      const [usersRes, projectsRes, logsRes] = await Promise.all([
        getAllUsers(),
        getAllProjects(),
        getAllAuditLogs()
      ]);
      setUsers(unwrapApiData(usersRes));
      setProjects(unwrapApiData(projectsRes));
      setLogs(unwrapApiData(logsRes));
      setLastUpdated(new Date());
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

  const companies = useMemo(() => {
    const set = new Set(
      users
        .map((u) => String(u?.company || "").trim())
        .filter(Boolean)
    );
    return Array.from(set);
  }, [users]);

  const roleDistribution = useMemo(() => {
    return ROLE_ORDER.map((role) => ({
      label: role,
      value: users.filter((u) => String(u?.role || "") === role).length,
      color: ROLE_COLORS[role] || "bg-gray-400"
    }));
  }, [users]);

  const topCompanies = useMemo(() => {
    const counts = new Map();
    users.forEach((u) => {
      const company = String(u?.company || "").trim();
      if (!company) return;
      counts.set(company, (counts.get(company) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value, color: "bg-indigo-500" }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
  }, [users]);

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const ad = safeDate(a?.timestamp)?.getTime() || 0;
      const bd = safeDate(b?.timestamp)?.getTime() || 0;
      return bd - ad;
    });
  }, [logs]);

  const logsInWindow = useMemo(() => {
    if (logWindow === "ALL") return sortedLogs;
    const now = Date.now();
    const hours = logWindow === "24H" ? 24 : logWindow === "7D" ? 24 * 7 : 24 * 30;
    return sortedLogs.filter((log) => {
      const ts = safeDate(log?.timestamp)?.getTime();
      if (!ts) return false;
      return now - ts <= hours * 60 * 60 * 1000;
    });
  }, [sortedLogs, logWindow]);

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    if (!q) return logsInWindow;
    return logsInWindow
      .filter((log) => {
        const hay = `${log?.actorEmail || ""} ${log?.action || ""} ${log?.entityType || ""} ${log?.description || ""}`.toLowerCase();
        return hay.includes(q);
      });
  }, [logsInWindow, logSearch]);

  const userNameById = useMemo(() => {
    const map = new Map();
    users.forEach((u) => {
      if (u?.id != null) map.set(Number(u.id), u?.fullName || u?.email || `User #${u.id}`);
    });
    return map;
  }, [users]);

  const projectNameById = useMemo(() => {
    const map = new Map();
    projects.forEach((p) => {
      if (p?.id != null) map.set(Number(p.id), p?.name || p?.projectName || `Project #${p.id}`);
    });
    return map;
  }, [projects]);

  const resolveEntityText = (log) => {
    const type = String(log?.entityType || "").toUpperCase();
    const entityId = log?.entityId != null ? Number(log.entityId) : null;
    if (!type) return "-";
    if (type === "USER") {
      const name = entityId != null ? userNameById.get(entityId) : "";
      return name ? `User: ${name}` : `User${entityId != null ? ` #${entityId}` : ""}`;
    }
    if (type === "PROJECT") {
      const name = entityId != null ? projectNameById.get(entityId) : "";
      return name ? `Project: ${name}` : `Project${entityId != null ? ` #${entityId}` : ""}`;
    }
    return `${humanizeToken(type)}${entityId != null ? ` #${entityId}` : ""}`;
  };

  const statusValues = useMemo(() => {
    let active = 0;
    let disabled = 0;
    let locked = 0;
    users.forEach((u) => {
      if (u?.locked === true) locked += 1;
      if (u?.enabled === false) disabled += 1;
      if (u?.enabled !== false && u?.locked !== true) active += 1;
    });
    return { active, disabled, locked };
  }, [users]);

  const mustChangePasswordCount = useMemo(
    () => users.filter((u) => u?.mustChangePassword === true).length,
    [users]
  );

  const companyAdmins = users.filter((u) => String(u?.role || "") === "ADMIN");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-200">
              Live overview of users, companies, projects, and platform activity.
            </p>
            <p className="mt-2 text-xs text-slate-300">
              Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchData({ silent: true })}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-60"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
          Loading dashboard data...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Failed to load dashboard data: {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Users}
              label="Total Users"
              value={users.length}
              hint={`${statusValues.active} active accounts`}
            />
            <StatCard
              icon={Building2}
              label="Companies"
              value={companies.length}
              hint={`${companyAdmins.length} company admins`}
            />
            <StatCard
              icon={ClipboardList}
              label="First-Login Resets"
              value={mustChangePasswordCount}
              hint="Users that must change password"
            />
            <StatCard
              icon={Activity}
              label="Audit Events"
              value={logsInWindow.length}
              hint={`Within ${LOG_WINDOW_OPTIONS.find((o) => o.value === logWindow)?.label || "window"}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 xl:col-span-1">
              <h2 className="text-base font-semibold text-gray-900">User Status</h2>
              <p className="mt-1 text-sm text-gray-500">
                Click status to highlight and inspect account totals.
              </p>
              <div className="mt-4">
                <StatusDonut
                  values={statusValues}
                  selected={selectedStatus}
                  onSelect={(key) => setSelectedStatus((prev) => (prev === key ? null : key))}
                  isDark={isDark}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 xl:col-span-1">
              <h2 className="text-base font-semibold text-gray-900">Role Distribution</h2>
              <p className="mt-1 text-sm text-gray-500">Users split by role.</p>
              <div className="mt-4">
                <BarList items={roleDistribution} emptyText="No users found." />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 xl:col-span-1">
              <h2 className="text-base font-semibold text-gray-900">Top Companies</h2>
              <p className="mt-1 text-sm text-gray-500">Companies with the most users.</p>
              <div className="mt-4 max-h-[12rem] overflow-y-auto pr-1">
                <BarList items={topCompanies} emptyText="No company data found." />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 2xl:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 2xl:col-span-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">Recent Audit Activity</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Track sensitive operations and user actions.
                  </p>
                </div>
                <div className="flex gap-2">
                  <select
                    value={logWindow}
                    onChange={(e) => setLogWindow(e.target.value)}
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {LOG_WINDOW_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <input
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Filter logs by email, action, entity, or description..."
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="mt-4 max-h-[32rem] overflow-y-auto overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Email
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Action
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Entity
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                          No logs found for this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-800">{log.actorEmail || "-"}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-800">
                            {humanizeToken(log.action)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {resolveEntityText(log)}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            <div>{safeDate(log.timestamp)?.toLocaleString() || "-"}</div>
                            <div className="text-[11px] text-gray-500">{timeAgo(log.timestamp)}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <h2 className="text-base font-semibold text-gray-900">Company Admin Directory</h2>
              </div>
              <p className="mt-1 text-sm text-gray-500">Quick view of admin ownership by company.</p>

              <div className="mt-4 max-h-[28rem] space-y-2 overflow-y-auto pr-1">
                {companyAdmins.length === 0 ? (
                  <p className="text-sm text-gray-500">No company admins found.</p>
                ) : (
                  companyAdmins
                    .slice()
                    .sort((a, b) => String(a.company || "").localeCompare(String(b.company || "")))
                    .map((admin) => (
                      <div
                        key={admin.id}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-gray-800">{admin.company || "-"}</p>
                        <p className="text-xs text-gray-600">{admin.fullName || "-"}</p>
                        <p className="text-xs text-gray-500">{admin.email || "-"}</p>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
