import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Plus, Trash2, X, SquarePen } from "lucide-react";
import { getAllProjects, createProject, updateProject, deleteProject } from "../../api/projectApi";
import { getAllUsers } from "../../api/userApi";
import { showError, showSuccess } from "../../utils/toast";

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

function Modal({ title, open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Badge({ tone = "gray", children }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    green: "bg-green-50 text-green-700 border-green-200"
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        tones[tone] || tones.gray
      }`}
    >
      {children}
    </span>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  details,
  loading,
  onCancel,
  onConfirm
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="px-6 pt-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-base font-semibold text-gray-900">{title}</h2>
          <p className="mt-1 text-sm text-gray-600">{message}</p>
        </div>

        <div className="px-6 pb-2 pt-4">
          <div className="rounded-xl bg-gray-50 px-4 py-3 text-left">
            <p className="text-sm text-gray-700">{details}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-6 pb-6 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProjects() {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // project or null
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pendingDeleteProject, setPendingDeleteProject] = useState(null);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const [form, setForm] = useState({
    name: "",
    description: "",
    managerId: "",
    memberIds: []
  });

  const managerOptions = useMemo(
    () => users.filter((u) => String(u.role) === "MANAGER"),
    [users]
  );

  const memberEngineers = useMemo(() => {
    return [...users]
      .filter((u) => String(u.role) === "ENGINEER")
      .sort((a, b) => {
        const av = (a.fullName || a.email || "").toString().toLowerCase();
        const bv = (b.fullName || b.email || "").toString().toLowerCase();
        return av.localeCompare(bv);
      });
  }, [users]);

  const memberUsers = useMemo(() => {
    return [...users]
      .filter((u) => String(u.role) === "USER")
      .sort((a, b) => {
        const av = (a.fullName || a.email || "").toString().toLowerCase();
        const bv = (b.fullName || b.email || "").toString().toLowerCase();
        return av.localeCompare(bv);
      });
  }, [users]);

  const displayProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = projects.filter((p) => {
      const hay = `${p.name || ""} ${p.description || ""} ${p.managerName || ""}`.toLowerCase();
      return q ? hay.includes(q) : true;
    });

    const dir = sortDir === "desc" ? -1 : 1;
    const sorted = [...filtered].sort((a, b) => {
      const av = (a?.[sortBy] ?? "").toString();
      const bv = (b?.[sortBy] ?? "").toString();
      return dir * av.localeCompare(bv, undefined, { sensitivity: "base" });
    });
    return sorted;
  }, [projects, search, sortBy, sortDir]);

  const toggleSort = (key) => {
    setSortBy((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return key;
    });
  };

  const SortHeader = ({ label, sortKey }) => {
    const active = sortBy === sortKey;
    const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
    return (
      <button
        type="button"
        onClick={() => toggleSort(sortKey)}
        className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-gray-100"
        title={`Sort by ${label}`}
      >
        <span>{label}</span>
        <Icon className={`h-3.5 w-3.5 ${active ? "text-gray-900" : "text-gray-400"}`} />
      </button>
    );
  };

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      managerId: "",
      memberIds: []
    });
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditing(project);

    // Map stored emails back to user IDs for manager and members
    const managerUser = users.find((u) => u.email === project.managerName);
    const managerId = managerUser ? String(managerUser.id) : "";

    const memberIds =
      Array.isArray(project.memberNames) && project.memberNames.length > 0
        ? users
            .filter((u) => project.memberNames.includes(u.email))
            .map((u) => String(u.id))
        : [];

    setForm({
      name: project?.name || "",
      description: project?.description || "",
      managerId,
      memberIds
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [projRes, userRes] = await Promise.all([getAllProjects(), getAllUsers()]);
      const projData = unwrapApiData(projRes);
      const userData = unwrapApiData(userRes);
      setProjects(Array.isArray(projData) ? projData : []);
      setUsers(Array.isArray(userData) ? userData : []);
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!form.name.trim()) {
      showError("Project name is required");
      return;
    }
    if (!form.managerId) {
      showError("Please select a project manager");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description?.trim() || "",
      managerId: Number(form.managerId),
      memberIds: form.memberIds.map((id) => Number(id))
    };

    setSaving(true);
    try {
      if (editing) {
        await updateProject(editing.id, payload);
        showSuccess("Project updated");
      } else {
        await createProject(payload);
        showSuccess("Project created");
      }
      setModalOpen(false);
      await fetchAll();
    } catch (err) {
      showError(getApiMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (project) => {
    setPendingDeleteProject(project);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    if (deleteLoading) return;
    setDeleteConfirmOpen(false);
    setPendingDeleteProject(null);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteProject) return;
    setDeleteLoading(true);
    try {
      await deleteProject(pendingDeleteProject.id);
      setProjects((prev) => prev.filter((p) => p.id !== pendingDeleteProject.id));
      showSuccess("Project deleted");
      setDeleteConfirmOpen(false);
      setPendingDeleteProject(null);
    } catch (err) {
      showError(getApiMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleMemberToggle = (userId) => {
    setForm((prev) => {
      const idStr = String(userId);
      const exists = prev.memberIds.includes(idStr);
      return {
        ...prev,
        memberIds: exists
          ? prev.memberIds.filter((id) => id !== idStr)
          : [...prev.memberIds, idStr]
      };
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admin · Projects</h1>
          <p className="mt-1 text-sm text-gray-600">
            Create projects, assign a manager, and manage engineers/users for each project.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, description, or manager..."
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 sm:max-w-md"
        />
        <div className="text-sm text-gray-600">
          {displayProjects.length} project{displayProjects.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                <SortHeader label="Name" sortKey="name" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                <SortHeader label="Manager" sortKey="managerName" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Members
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-600" colSpan={5}>
                  Loading projects...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-700" colSpan={5}>
                  <div className="flex flex-col gap-2">
                    <div>
                      <span className="font-semibold">Failed to load:</span> {error}
                    </div>
                    <div>
                      <button
                        onClick={fetchAll}
                        className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ) : displayProjects.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-gray-600" colSpan={5}>
                  No projects found.
                </td>
              </tr>
            ) : (
              displayProjects.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                    <div className="line-clamp-2">{p.description || "-"}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {p.managerName ? <Badge tone="green">{p.managerName}</Badge> : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {p.memberNames && p.memberNames.length > 0 ? (
                      <div className="flex max-w-xs flex-wrap gap-1">
                        {p.memberNames.slice(0, 3).map((m) => (
                          <Badge key={m}>{m}</Badge>
                        ))}
                        {p.memberNames.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{p.memberNames.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">No members</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="flex items-center justify-end gap-3">
                      {/* Edit */}
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        title="Edit project"
                      >
                        <SquarePen className="h-5 w-5" />
                      </button>
                      {/* Delete */}
                      <button
                        onClick={() => openDeleteConfirm(p)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        title="Delete project"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Edit project" : "Create project"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Project name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Mobile App Revamp"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="min-h-[80px] w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe the project scope, goals, etc."
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Project manager
              </label>
              <select
                value={form.managerId}
                onChange={(e) => setForm((p) => ({ ...p, managerId: e.target.value }))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select manager...</option>
                {managerOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName || u.email} ({u.email})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Exactly one manager is required for each project.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Project members (engineers &amp; users)
              </label>
              <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-200 px-3 py-3">
                {memberEngineers.length === 0 && memberUsers.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    No engineers or users available. Create them in Admin · Users first.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Engineers
                      </p>
                      {memberEngineers.length === 0 ? (
                        <p className="text-[11px] text-gray-400">No engineers available.</p>
                      ) : (
                        <div className="space-y-1">
                          {memberEngineers.map((u) => {
                            const idStr = String(u.id);
                            const checked = form.memberIds.includes(idStr);
                            return (
                              <label
                                key={u.id}
                                className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-gray-50"
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={checked}
                                    onChange={() => handleMemberToggle(idStr)}
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-xs font-medium text-gray-900">
                                      {u.fullName || u.email}
                                    </span>
                                    <span className="text-[11px] text-gray-500">{u.email}</span>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Users
                      </p>
                      {memberUsers.length === 0 ? (
                        <p className="text-[11px] text-gray-400">No users available.</p>
                      ) : (
                        <div className="space-y-1">
                          {memberUsers.map((u) => {
                            const idStr = String(u.id);
                            const checked = form.memberIds.includes(idStr);
                            return (
                              <label
                                key={u.id}
                                className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-gray-50"
                              >
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={checked}
                                    onChange={() => handleMemberToggle(idStr)}
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-xs font-medium text-gray-900">
                                      {u.fullName || u.email}
                                    </span>
                                    <span className="text-[11px] text-gray-500">{u.email}</span>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Members can create and work on issues in this project.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create project"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete project?"
        message="This action cannot be undone."
        details={`Project: ${pendingDeleteProject?.name || "-"}`}
        loading={deleteLoading}
        onCancel={closeDeleteConfirm}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
