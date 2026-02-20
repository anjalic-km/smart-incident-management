import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Plus, SquarePen, Trash2, X } from "lucide-react";
import {
  createSlaPolicy,
  deleteSlaPolicy,
  getAllSlaPolicies,
  updateSlaPolicy
} from "../../api/slaApi";
import { getAllProjects } from "../../api/projectApi";
import { showError, showSuccess } from "../../utils/toast";

const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

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

function buildProjectNameMap(projects) {
  const map = new Map();
  (Array.isArray(projects) ? projects : []).forEach((p) => {
    const name = p?.name || p?.projectName || "";
    if (p?.id !== undefined && p?.id !== null) {
      map.set(String(p.id), name);
    }
  });
  return map;
}

function resolveProjectName(policy, projectNameMap) {
  const projectId =
    policy?.projectId ??
    policy?.project?.id ??
    null;
  const fromProjects =
    projectId !== null && projectId !== undefined
      ? projectNameMap.get(String(projectId))
      : "";
  const fromPolicy = policy?.projectName || policy?.project?.name || "";
  return fromProjects || fromPolicy || (projectId ? `Project #${projectId}` : "-");
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

export default function AdminSlaConfiguration() {
  const [policies, setPolicies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pendingDeletePolicy, setPendingDeletePolicy] = useState(null);

  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [form, setForm] = useState({
    projectId: "",
    priorityLevel: "MEDIUM",
    resolutionTimeMinutes: "",
    description: ""
  });

  const usedPrioritiesByProject = useMemo(() => {
    const map = new Map();
    policies.forEach((p) => {
      const pid = String(p.projectId ?? "");
      const current = map.get(pid) || new Set();
      current.add(String(p.priorityLevel || "").toUpperCase());
      map.set(pid, current);
    });
    return map;
  }, [policies]);

  const projectNameById = useMemo(() => {
    const map = new Map();
    projects.forEach((p) => map.set(String(p.id), p.name));
    return map;
  }, [projects]);

  const displayPolicies = useMemo(() => {
    const q = search.trim().toLowerCase();
    return policies
      .filter((p) => {
        const pid = String(p.projectId ?? "");
        const matchesProject = projectFilter === "ALL" ? true : pid === projectFilter;
        const matchesPriority = priorityFilter === "ALL" ? true : p.priorityLevel === priorityFilter;
        const projectName = p.projectName || projectNameById.get(pid) || "";
        const hay = `${projectName} ${p.priorityLevel || ""} ${p.description || ""}`.toLowerCase();
        const matchesSearch = q ? hay.includes(q) : true;
        return matchesProject && matchesPriority && matchesSearch;
      })
      .sort((a, b) => {
        const an = (a.projectName || projectNameById.get(String(a.projectId)) || "").toLowerCase();
        const bn = (b.projectName || projectNameById.get(String(b.projectId)) || "").toLowerCase();
        if (an !== bn) return an.localeCompare(bn);
        return String(a.priorityLevel || "").localeCompare(String(b.priorityLevel || ""));
      });
  }, [policies, search, projectFilter, priorityFilter, projectNameById]);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [policyRes, projectRes] = await Promise.all([getAllSlaPolicies(), getAllProjects()]);
      const policyData = unwrapApiData(policyRes);
      const projectData = unwrapApiData(projectRes);
      const projectsList = Array.isArray(projectData) ? projectData : [];
      const projectMap = buildProjectNameMap(projectsList);
      const normalizedPolicies = (Array.isArray(policyData) ? policyData : []).map((p) => {
        const projectId = p?.projectId ?? p?.project?.id ?? null;
        return {
          ...p,
          projectId,
          projectName: resolveProjectName({ ...p, projectId }, projectMap)
        };
      });
      setProjects(projectsList);
      setPolicies(normalizedPolicies);
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openCreate = () => {
    if (!projects.length) {
      showError("Please create a project first");
      return;
    }

    const firstProjectId = String(projects[0]?.id || "");
    const used = usedPrioritiesByProject.get(firstProjectId) || new Set();
    const availablePriorities = PRIORITY_OPTIONS.filter((p) => !used.has(p));

    if (availablePriorities.length === 0) {
      showError("All SLA categories are already configured for this project");
      return;
    }

    setEditing(null);
    setForm({
      projectId: firstProjectId,
      priorityLevel: availablePriorities[0],
      resolutionTimeMinutes: "",
      description: ""
    });
    setModalOpen(true);
  };

  const openEdit = (policy) => {
    setEditing(policy);
    setForm({
      projectId: String(policy.projectId || ""),
      priorityLevel: String(policy.priorityLevel || "MEDIUM"),
      resolutionTimeMinutes: String(policy.resolutionTimeMinutes ?? ""),
      description: policy.description || ""
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;

    const projectId = Number(form.projectId);
    const resolution = Number(form.resolutionTimeMinutes);
    const priorityLevel = String(form.priorityLevel || "").toUpperCase().trim();

    if (!projectId) {
      showError("Please select a project");
      return;
    }
    if (!PRIORITY_OPTIONS.includes(priorityLevel)) {
      showError("Please select a valid priority");
      return;
    }
    if (!Number.isFinite(resolution) || resolution <= 0) {
      showError("Resolution time must be greater than 0");
      return;
    }

    const payload = {
      resolutionTimeMinutes: resolution,
      description: form.description?.trim() || ""
    };
    const selectedProjectName =
      editing?.projectName ||
      projects.find((p) => Number(p.id) === projectId)?.name ||
      "-";

    setSaving(true);
    try {
      if (editing) {
        await updateSlaPolicy(projectId, priorityLevel, payload);
        showSuccess(`SLA updated · Project: ${selectedProjectName} · Priority: ${priorityLevel}`);
      } else {
        await createSlaPolicy({
          projectId,
          priorityLevel,
          resolutionTimeMinutes: resolution,
          description: form.description?.trim() || ""
        });
        showSuccess(`SLA created · Project: ${selectedProjectName} · Priority: ${priorityLevel}`);
      }
      setModalOpen(false);
      await fetchAll();
    } catch (err) {
      showError(getApiMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const availablePriorityOptions = useMemo(() => {
    if (editing) return PRIORITY_OPTIONS;
    const selectedProjectId = String(form.projectId || "");
    const used = usedPrioritiesByProject.get(selectedProjectId) || new Set();
    return PRIORITY_OPTIONS.filter((p) => !used.has(p));
  }, [editing, form.projectId, usedPrioritiesByProject]);

  const openDeleteConfirm = (policy) => {
    setPendingDeletePolicy(policy);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    if (deleteLoading) return;
    setDeleteConfirmOpen(false);
    setPendingDeletePolicy(null);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeletePolicy) return;
    setDeleteLoading(true);
    try {
      await deleteSlaPolicy(pendingDeletePolicy.projectId, pendingDeletePolicy.priorityLevel);
      const projectName =
        pendingDeletePolicy.projectName ||
        projectNameById.get(String(pendingDeletePolicy.projectId || "")) ||
        "-";
      showSuccess(
        `SLA deleted · Project: ${projectName} · Priority: ${pendingDeletePolicy.priorityLevel || "-"}`
      );
      await fetchAll();
      setDeleteConfirmOpen(false);
      setPendingDeletePolicy(null);
    } catch (err) {
      showError(getApiMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admin · SLA Configuration</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage SLA policies per project and priority.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add SLA
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search project, priority, description..."
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 lg:col-span-2"
        />
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All priorities</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Project
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Resolution (min)
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Description
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
                  Loading SLA policies...
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
            ) : displayPolicies.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-gray-600" colSpan={5}>
                  No SLA policies found.
                </td>
              </tr>
            ) : (
              displayPolicies.map((p) => (
                <tr key={p.id || `${p.projectId}-${p.priorityLevel}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {resolveProjectName(p, projectNameById)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-700">{p.priorityLevel}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.resolutionTimeMinutes}</td>
                  <td className="max-w-md px-4 py-3 text-sm text-gray-700">
                    <div className="line-clamp-2">{p.description || "-"}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        title="Edit SLA policy"
                      >
                        <SquarePen className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => openDeleteConfirm(p)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        title="Delete SLA policy"
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
        title={editing ? "Edit SLA policy" : "Add SLA policy"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              {editing ? (
                <>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Project Name</label>
                  <input
                    value={resolveProjectName(editing, projectNameById)}
                    readOnly
                    className="w-full rounded-xl border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700 outline-none"
                  />
                </>
              ) : (
                <>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Project</label>
                  <select
                    value={form.projectId}
                    onChange={(e) => {
                      const nextProjectId = e.target.value;
                      const used = usedPrioritiesByProject.get(String(nextProjectId)) || new Set();
                      const available = PRIORITY_OPTIONS.filter((p) => !used.has(p));
                      setForm((prev) => ({
                        ...prev,
                        projectId: nextProjectId,
                        priorityLevel: available[0] || ""
                      }));
                    }}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select project...</option>
                    {projects.map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Priority</label>
              <select
                value={form.priorityLevel}
                onChange={(e) => setForm((prev) => ({ ...prev, priorityLevel: e.target.value }))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                disabled={Boolean(editing) || availablePriorityOptions.length === 0}
              >
                {availablePriorityOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Only one SLA policy can be added per priority for a project.
              </p>
              {!editing && availablePriorityOptions.length === 0 && (
                <p className="mt-1 text-xs text-red-600">
                  All categories are already configured for this project.
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Resolution time (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={form.resolutionTimeMinutes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, resolutionTimeMinutes: e.target.value }))
                }
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. 240"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-600">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="min-h-[90px] w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Describe the SLA policy for this priority."
              />
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
              disabled={saving || (!editing && availablePriorityOptions.length === 0)}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Create SLA"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete SLA policy?"
        message="This action cannot be undone."
        details={`Project: ${
          resolveProjectName(pendingDeletePolicy, projectNameById)
        } | Priority: ${pendingDeletePolicy?.priorityLevel || "-"}`}
        loading={deleteLoading}
        onCancel={closeDeleteConfirm}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
