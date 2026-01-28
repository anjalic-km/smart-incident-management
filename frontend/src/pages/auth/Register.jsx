import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../../components/auth/AuthCard";
import { register } from "../../api/authApi";
import { showError, showSuccess } from "../../utils/toast";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "USER",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await register(form);
      showSuccess("Account created successfully 🎉");
      navigate("/login");
    } catch {
      showError("Registration failed");
    }
  };

  return (
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
          onChange={handleChange}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <input
          name="email"
          type="email"
          placeholder="Email Address"
          required
          onChange={handleChange}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          onChange={handleChange}
          className="w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <button
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Register
        </button>
      </form>
    </AuthCard>
  );
}
