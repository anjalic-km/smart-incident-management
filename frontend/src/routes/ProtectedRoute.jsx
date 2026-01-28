import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Not logged in
  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but role not allowed
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  // Allowed
  return children;
}
