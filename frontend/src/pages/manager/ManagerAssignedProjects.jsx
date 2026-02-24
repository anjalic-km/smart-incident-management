import { createElement, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays, Eye, FolderKanban, ShieldCheck, UserRound, UsersRound, Wrench } from "lucide-react";
import { getAllProjects } from "../../api/projectApi";
import { getAllUsers } from "../../api/userApi";
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

function getProjectCreatedAt(project) {
  return (
    project?.createdAt ??
    project?.created_at ??
    project?.createdDate ??
    project?.created_date ??
    project?.created ??
    null
  );
}

function splitMembersByRole(memberDetails, memberNames, userLookup) {
  const engineers = [];
  const users = [];
  const details = Array.isArray(memberDetails) ? memberDetails : [];

  details.forEach((member) => {
    const rawName = String(member?.fullName || "").trim();
    const resolvedUser =
      userLookup.byEmail.get(rawName.toLowerCase()) ||
      userLookup.byName.get(rawName.toLowerCase()) ||
      null;
    const role = String(member?.role || resolvedUser?.role || "").toUpperCase();
    const name = resolvedUser?.fullName || rawName || "-";
    if (role === "ENGINEER") engineers.push(name);
    if (role === "USER") users.push(name);
  });

  if (details.length === 0 && Array.isArray(memberNames)) {
    memberNames.forEach((value) => {
      const raw = String(value || "").trim();
      if (!raw) return;
      const resolvedUser =
        userLookup.byEmail.get(raw.toLowerCase()) ||
        userLookup.byName.get(raw.toLowerCase()) ||
        null;
      const role = String(resolvedUser?.role || "").toUpperCase();
      const name = resolvedUser?.fullName || raw;
      if (role === "ENGINEER") engineers.push(name);
      if (role === "USER") users.push(name);
    });
  }

  return {
    engineers: Array.from(new Set(engineers)),
    users: Array.from(new Set(users))
  };
}

function InfoCard({ icon, title, value, tone = "indigo" }) {
  const tones = {
    indigo: "bg-indigo-100 text-indigo-700",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700"
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-1 text-base font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${tones[tone] || tones.indigo}`}>
          {icon ? createElement(icon, { className: "h-4 w-4" }) : null}
        </div>
      </div>
    </div>
  );
}

export default function ManagerAssignedProjects() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    setError("");
    try {
      const projectRes = await getAllProjects();
      setProjects(unwrapArrayData(projectRes));
      try {
        const userRes = await getAllUsers();
        setAllUsers(unwrapArrayData(userRes));
      } catch {
        setAllUsers([]);
      }
    } catch (err) {
      const msg = getApiMessage(err);
      setError(msg);
      showError(msg);
      setProjects([]);
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const userLookup = useMemo(() => {
    const byEmail = new Map();
    const byName = new Map();
    allUsers.forEach((u) => {
      if (u?.email) byEmail.set(String(u.email).toLowerCase(), u);
      if (u?.fullName) byName.set(String(u.fullName).toLowerCase(), u);
    });
    return { byEmail, byName };
  }, [allUsers]);

  const resolveDisplayName = (value) => {
    const raw = String(value || "").trim();
    if (!raw) return "-";
    const resolved =
      userLookup.byEmail.get(raw.toLowerCase()) ||
      userLookup.byName.get(raw.toLowerCase()) ||
      null;
    return resolved?.fullName || raw;
  };

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => {
      const members = Array.isArray(p?.memberNames) ? p.memberNames.join(" ") : "";
      const haystack = `${p?.name || ""} ${p?.description || ""} ${p?.managerName || ""} ${members}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [projects, search]);

  const selectedProject = useMemo(
    () => projects.find((p) => String(p.id) === String(projectId)) || null,
    [projects, projectId]
  );

  const memberSplit = useMemo(
    () => splitMembersByRole(selectedProject?.memberDetails, selectedProject?.memberNames, userLookup),
    [selectedProject?.memberDetails, selectedProject?.memberNames, userLookup]
  );

  const openProjectDetails = (project) => {
    sessionStorage.setItem(`project_name_${project.id}`, project?.name || "");
    navigate(`/manager/projects/${project.id}`, { state: { projectName: project?.name || "" } });
  };

  if (projectId && loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
        Loading project details...
      </div>
    );
  }

  if (projectId && !selectedProject) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        Project details could not be found.
      </div>
    );
  }

  if (projectId && selectedProject) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                Project #{selectedProject.id}
              </p>
              <h1 className="mt-1 text-3xl font-bold text-gray-900">{selectedProject.name || "-"}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1.5">
                  <UserRound className="h-4 w-4" />
                  {resolveDisplayName(selectedProject.managerName)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  {formatDateTime(getProjectCreatedAt(selectedProject))}
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700">
              <FolderKanban className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <section className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-3xl font-semibold text-gray-900">Description</h2>
            <p className="mt-4 text-base leading-relaxed text-gray-700">
              {selectedProject.description || "No detailed description available for this project."}
            </p>
          </section>

          <section className="space-y-4">
            <InfoCard
              icon={ShieldCheck}
              title="Project Manager"
              value={resolveDisplayName(selectedProject.managerName)}
              tone="indigo"
            />
            <InfoCard icon={Wrench} title="Engineers" value={memberSplit.engineers.length || 0} tone="amber" />
            <InfoCard icon={UsersRound} title="Users" value={memberSplit.users.length || 0} tone="emerald" />
            <InfoCard
              icon={CalendarDays}
              title="Created At"
              value={formatDateTime(getProjectCreatedAt(selectedProject))}
              tone="indigo"
            />
          </section>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-base font-semibold text-gray-900">Engineer List</h3>
            <div className="mt-3 space-y-2">
              {memberSplit.engineers.length ? (
                memberSplit.engineers.map((name) => (
                  <div
                    key={name}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                  >
                    {name}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No engineers found in this project.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-base font-semibold text-gray-900">User List</h3>
            <div className="mt-3 space-y-2">
              {memberSplit.users.length ? (
                memberSplit.users.map((name) => (
                  <div
                    key={name}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                  >
                    {name}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No users found in this project.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h1 className="text-xl font-bold text-gray-900">Assigned Projects</h1>
        <p className="mt-1 text-sm text-gray-600">Projects where you are assigned as manager.</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by project, manager, member..."
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Project
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Manager
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Engineers
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Users
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Created
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td className="px-4 py-8 text-sm text-gray-600" colSpan={6}>
                  Loading projects...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-4 py-8 text-sm text-red-700" colSpan={6}>
                  Failed to load projects: {error}
                </td>
              </tr>
            ) : filteredProjects.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-sm text-gray-600" colSpan={6}>
                  No projects found.
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => {
                const split = splitMembersByRole(project.memberDetails, project.memberNames, userLookup);
                return (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-gray-900">{project.name || "-"}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-gray-600">{project.description || "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{resolveDisplayName(project.managerName)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{split.engineers.length}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{split.users.length}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4 text-gray-500" />
                        {formatDateTime(getProjectCreatedAt(project))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openProjectDetails(project)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
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
