import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../../components/auth/AuthCard";
import { login } from "../../api/authApi";
import { showError, showSuccess } from "../../utils/toast";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login(email, password);
      const data = res?.data?.data;

      if (!data?.token || !data?.role) {
        showError("Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      showSuccess("Welcome to ServicePlus 👋");

      navigate(
        data.role === "ADMIN" ? "/admin" :
        data.role === "MANAGER" ? "/manager" :
        data.role === "ENGINEER" ? "/engineer" : "/user"
      );
    } catch {
      showError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
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
          className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </AuthCard>
  );
}
