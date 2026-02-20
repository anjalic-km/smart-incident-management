import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthCard from "../../components/auth/AuthCard";
import { register } from "../../api/authApi";
import { showError, showSuccess } from "../../utils/toast";
import VerifyOtpModal from "../../components/auth/VerifyOtpModal";
import bgImage from "../../assets/background.png";
import LoadingButton from "../../components/common/LoadingButton";

export default function Register() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "USER",
  });

  const hasPwInput = (form.password || "").length > 0 || (form.confirmPassword || "").length > 0;
  const pwMatches = (form.password || "").length > 0 && form.password === form.confirmPassword;
  const pwMismatch = hasPwInput && form.password !== form.confirmPassword;

  const passwordFieldClasses = pwMatches
    ? "border-green-500 focus:ring-2 focus:ring-green-500"
    : pwMismatch
      ? "border-red-500 focus:ring-2 focus:ring-red-500"
      : "border-gray-300 focus:ring-2 focus:ring-blue-500";

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (form.password !== form.confirmPassword) {
      showError("Passwords do not match");
      return;
    }

    if ((form.password || "").length < 6) {
      showError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: form.role,
      });

      showSuccess("OTP sent to your email");

      setOtpEmail(form.email);
      setShowOtp(true);
    } catch (err) {
      showError(
        err?.response?.data?.message || "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center flex items-center justify-center px-4"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      
      {/* Card */}
      <div className="relative z-10">
        <AuthCard
          title="Create your account"
          subtitle="Start managing incidents with ServicePlus"
          footer={
            <>
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 font-medium">
                Login
              </Link>
            </>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="fullName"
              placeholder="Full Name"
              required
              value={form.fullName}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 bg-white/40 backdrop-blur px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              name="email"
              type="email"
              placeholder="Email Address"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 bg-white/40 backdrop-blur px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                value={form.password}
                onChange={handleChange}
                className={`w-full rounded-xl border-2 px-4 py-2.5 pr-11 text-sm outline-none transition-colors ${
                  hasPwInput ? passwordFieldClasses : "border-gray-300 focus:ring-2 focus:ring-blue-500"
                } bg-white/60 backdrop-blur`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <div className="relative">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                className={`w-full rounded-xl border-2 px-4 py-2.5 pr-11 text-sm outline-none transition-colors ${
                  hasPwInput ? passwordFieldClasses : "border-gray-300 focus:ring-2 focus:ring-blue-500"
                } bg-white/60 backdrop-blur`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-600"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {pwMatches && (
              <p className="text-xs font-medium text-green-700">
                Passwords match
              </p>
            )}
            {pwMismatch && (
              <p className="text-xs font-medium text-red-700">
                Passwords do not match
              </p>
            )}

            <LoadingButton
              loading={loading}
              text="Register"
              loadingText="Creating account..."
            />
          </form>
        </AuthCard>
      </div>

      {/* OTP Modal */}
      {showOtp && (
        <VerifyOtpModal
          email={otpEmail}
          purpose="REGISTER"
          onClose={(success) => {
            setShowOtp(false);
            if (success) navigate("/login");
          }}
        />
      )}
    </div>
  );
}
