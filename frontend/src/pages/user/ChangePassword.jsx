import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { changePassword } from "../../api/userApi";
import { showError, showSuccess } from "../../utils/toast";
import { useAuth } from "../../context/useAuth";

function getApiMessage(err) {
  const status = err?.response?.status;
  const apiMessage =
    err?.response?.data?.message ||
    err?.response?.data?.statusMessage ||
    "";

  // Normalize common backend auth failures into a clear UX message.
  if (
    status === 401 ||
    status === 403 ||
    /current password|incorrect password|invalid password|wrong password/i.test(
      apiMessage
    )
  ) {
    return "Incorrect current password";
  }

  return (
    apiMessage ||
    err?.message ||
    "Something went wrong"
  );
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const { updateAuth } = useAuth();
  const [loading, setLoading] = useState(false);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Password validation
  const hasNewPassword = (form.newPassword || "").length > 0;
  const hasConfirmPassword = (form.confirmPassword || "").length > 0;
  const isNewPasswordTooShort = hasNewPassword && (form.newPassword || "").length < 6;
  const passwordsMatch = form.newPassword === form.confirmPassword;
  const passwordsMismatch = hasNewPassword && hasConfirmPassword && !passwordsMatch;
  const passwordsMatchCorrect =
    hasNewPassword && hasConfirmPassword && passwordsMatch && !isNewPasswordTooShort;

  const passwordFieldClasses = isNewPasswordTooShort || passwordsMismatch
      ? "border-red-500 focus:ring-2 focus:ring-red-500"
      : passwordsMatchCorrect
        ? "border-green-500 focus:ring-2 focus:ring-green-500"
        : "border-gray-300 focus:ring-2 focus:ring-indigo-500";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!form.currentPassword.trim()) {
      showError("Current password is required");
      return;
    }

    if (!form.newPassword.trim()) {
      showError("New password is required");
      return;
    }

    if ((form.newPassword || "").length < 6) {
      showError("New password must be at least 6 characters");
      return;
    }

    if (!form.confirmPassword.trim()) {
      showError("Please confirm your new password");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    if (form.currentPassword === form.newPassword) {
      showError("Current password and new password cannot be the same");
      return;
    }

    setLoading(true);
    try {
      const res = await changePassword(form.currentPassword, form.newPassword);
      const data = res?.data;
      if (data?.token) {
        updateAuth?.(data.token);
      }
      showSuccess("Password changed successfully");
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      const msg = getApiMessage(err);
      if (/something went wrong|please try again later/i.test(msg || "")) {
        showError("Incorrect current password");
      } else {
        showError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-6">
      <div className="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
          <p className="mt-1 text-sm text-gray-600">
            Update your account password for security
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Current Password *
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                placeholder="Enter your current password"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
              >
                {showCurrentPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Enter your new password (at least 6 characters)"
                className={`w-full rounded-lg border ${passwordFieldClasses} px-4 py-2 text-sm outline-none`}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
              >
                {showNewPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Must be at least 6 characters long
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
                className={`w-full rounded-lg border ${passwordFieldClasses} px-4 py-2 text-sm outline-none`}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {passwordsMismatch && (
              <p className="mt-1 text-xs text-red-600">
                Passwords do not match
              </p>
            )}
            {passwordsMatchCorrect && (
              <p className="mt-1 text-xs text-green-600">
                Passwords match
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
            <p className="font-medium">Password Tips:</p>
            <ul className="mt-2 ml-4 list-disc space-y-1 text-xs">
              <li>Use a strong password with uppercase, lowercase, numbers, and symbols</li>
              <li>Avoid using personal information (name, birthdate, etc.)</li>
              <li>Do not reuse your previous passwords</li>
            </ul>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || !passwordsMatchCorrect || !form.currentPassword}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating..." : "Update Password"}
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
