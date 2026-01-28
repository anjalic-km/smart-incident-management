import { useState } from "react";
import { Link } from "react-router-dom";
import AuthCard from "../../components/auth/AuthCard";
import { showSuccess, showError } from "../../utils/toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Backend will be added later
      showSuccess(
        "If an account exists, a password reset link has been sent."
      );
      setEmail("");
    } catch {
      showError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email to receive a reset link"
      footer={
        <Link
          to="/login"
          className="text-blue-600 font-medium hover:underline"
        >
          Back to login
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
          className="w-full rounded-lg border px-3 py-2 text-sm
                     focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg
                     text-sm font-medium hover:bg-blue-700 transition"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
    </AuthCard>
  );
}
