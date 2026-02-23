import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Upload } from "lucide-react";
import { createIssue, uploadIssueAttachment } from "../../api/issuesApi";
import { getAllProjects } from "../../api/projectApi";
import { showError, showSuccess } from "../../utils/toast";

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

function unwrapData(res) {
  if (!res) return null;
  if (res?.data !== undefined) return res.data;
  return res;
}

export default function UserCreateIssue() {
  const fileInputRef = useRef(null);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [form, setForm] = useState({
    projectId: "",
    title: "",
    description: ""
  });

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await getAllProjects();
      const list = unwrapArrayData(res);
      setProjects(list);
      if (!form.projectId && list.length > 0) {
        setForm((prev) => ({ ...prev, projectId: String(list[0].id) }));
      }
    } catch (err) {
      showError(getApiMessage(err));
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const selectedProjectName = useMemo(
    () => projects.find((p) => String(p.id) === String(form.projectId))?.name || "-",
    [projects, form.projectId]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    const projectId = Number(form.projectId);
    const title = form.title.trim();
    const description = form.description.trim();

    if (!projectId) {
      showError("Please select a project");
      return;
    }
    if (!title) {
      showError("Please enter an issue title");
      return;
    }
    if (!description) {
      showError("Please enter issue description");
      return;
    }

    setSaving(true);
    try {
      const createRes = await createIssue({
        projectId,
        title,
        description
      });
      const createdIssue = unwrapData(createRes);
      const issueId = Number(createdIssue?.id);

      if (issueId && attachments.length > 0) {
        let successCount = 0;
        for (const file of attachments) {
          try {
            await uploadIssueAttachment(issueId, file);
            successCount += 1;
          } catch {
            // Continue uploading other files even if one fails.
          }
        }
        if (successCount === attachments.length) {
          showSuccess(`Issue created in ${selectedProjectName} with ${successCount} attachment(s)`);
        } else if (successCount > 0) {
          showError(
            `Issue created, but only ${successCount}/${attachments.length} attachment(s) were uploaded`
          );
        } else {
          showError("Issue created, but attachment upload failed");
        }
      } else {
        showSuccess(`Issue created in ${selectedProjectName}`);
      }

      setForm((prev) => ({
        ...prev,
        title: "",
        description: ""
      }));
      setAttachments([]);
    } catch (err) {
      showError(getApiMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleFiles = (files) => {
    setAttachments(Array.from(files || []));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (saving) return;
    setDragActive(false);
    handleFiles(e.dataTransfer?.files);
  };

  return (
    <div className="flex min-h-[72vh] items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h1 className="text-xl font-bold text-gray-900">Create Issue</h1>
          <p className="mt-1 text-sm text-gray-600">Raise a new issue under one of your projects.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
              Project
            </label>
            <select
              value={form.projectId}
              onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
              disabled={loadingProjects || saving}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            >
              {!projects.length && <option value="">No project available</option>}
              {projects.map((project) => (
                <option key={project.id} value={String(project.id)}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
              Title
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter issue title"
              disabled={saving}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the issue details"
              disabled={saving}
              className="min-h-[130px] w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-600">
              Attachments
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!saving) setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
                dragActive ? "border-indigo-400 bg-indigo-50" : "border-gray-300 bg-gray-50"
              }`}
            >
              <Upload className="mx-auto h-10 w-10 text-gray-500" />
              <p className="mt-4 text-lg font-medium text-gray-900">Drag and drop files here</p>
              <p className="mt-1 text-sm text-gray-500">or</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="mt-4 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-100 disabled:opacity-60"
              >
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                disabled={saving}
                className="hidden"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Manager will set severity and priority after issue is created.
            </p>
            {attachments.length > 0 && (
              <p className="mt-1 text-xs text-gray-600">{attachments.length} file(s) selected</p>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setForm((prev) => ({
                ...prev,
                title: "",
                description: ""
              }));
              setAttachments([]);
            }}
            disabled={saving}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving || !projects.length}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {saving ? "Submitting..." : "Submit Issue"}
          </button>
        </div>
      </form>
    </div>
  );
}
