import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { getUserById, updateUser } from "../../api/userApi";
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

export default function EditProfile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    company: ""
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      if (!user?.userId) {
        const msg = "Unable to identify current user";
        showError(msg);
        setLoading(false);
        return;
      }
      try {
        const res = await getUserById(user.userId);
        const data = unwrapApiData(res);
        if (data) {
          setForm({
            fullName: data.fullName || "",
            email: data.email || "",
            company: data.company || ""
          });
        }
      } catch (err) {
        showError(getApiMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!user?.userId) {
      showError("Unable to identify current user");
      return;
    }

    if (!form.fullName.trim()) {
      showError("Full name is required");
      return;
    }

    if (!form.email.trim()) {
      showError("Email is required");
      return;
    }

    setSaving(true);
    try {
      await updateUser(user.userId, {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        company: form.company?.trim() || ""
      });
      showSuccess("Profile updated successfully");
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      showError(getApiMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-6">
        <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-600">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-6">
      <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update your profile information
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              required
              disabled
            />
            <p className="mt-1 text-xs text-gray-500">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Company
            </label>
            <input
              type="text"
              name="company"
              value={form.company}
              onChange={handleChange}
              placeholder="Enter your company name"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              disabled
            />
            <p className="mt-1 text-xs text-gray-500">
              Company cannot be changed
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
