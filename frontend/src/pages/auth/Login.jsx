import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../../components/auth/AuthCard";
import LoadingButton from "../../components/common/LoadingButton";
import { login } from "../../api/authApi";
import { showSuccess, showError } from "../../utils/toast";
import bgImage from "../../assets/background.png";
import { useEffect } from "react";
import { useAuth } from "../../context/useAuth";

export default function Login() {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔐 BLOCK BACK/FORWARD TO LOGIN WHEN LOGGED IN
  useEffect(() => {
    if (token && user) {
      navigate(`/${user.role.toLowerCase()}/dashboard`, {
        replace: true
      });
    }
  }, [token, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const res = await login(email, password);
      const data = res?.data?.data;

      if (!data?.token || !data?.role) {
        showError("Login failed. Please try again.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      showSuccess("Welcome to ServicePulse");

      navigate(
        data.role === "ADMIN" ? "/admin/dashboard" :
        data.role === "MANAGER" ? "/manager/dashboard" :
        data.role === "ENGINEER" ? "/engineer/dashboard" :
        "/user/dashboard",
        { replace: true } // 🔥 CRITICAL
      );
    } catch (err) {
      showError(
        err?.response?.data?.message || "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-white/20" />

      <div className="relative z-10">
        <AuthCard
          title="Welcome back"
          subtitle="Sign in to your ServicePlus account"
          footer={
            <Link
              to="/forgot-password"
              className="text-blue-600 font-medium hover:underline"
            >
              Forgot password?
            </Link>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white/40 backdrop-blur px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white/40 backdrop-blur px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />

            <LoadingButton
              loading={loading}
              text="Login"
              loadingText="Logging in..."
            />
          </form>
        </AuthCard>
      </div>
    </div>
  );
}
