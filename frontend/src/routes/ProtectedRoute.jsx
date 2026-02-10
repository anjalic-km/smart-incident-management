// import { Navigate } from "react-router-dom";
// import { useAuth } from "../context/useAuth";

// const ProtectedRoute = ({ children, allowedRoles }) => {
//   const auth = useAuth();

//   // SAFETY: auth not ready yet
//   if (!auth) {
//     return null;
//   }

//   const { user, token, loading } = auth;

//   // Wait for auth to initialize
//   if (loading) {
//     return <div style={{ padding: 40 }}>Loading...</div>;
//   }

//   // Not logged in
//   if (!token) {
//     return <Navigate to="/login" replace />;
//   }

//   // Role not allowed
//   if (
//     allowedRoles &&
//     user &&
//     !allowedRoles.includes(user.role)
//   ) {
//     return <Navigate to="/unauthorized" replace />;
//   }

//   // Allowed
//   return children;
// };

// export default ProtectedRoute;

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user } = useAuth();
  const location = useLocation();

  // 🔥 HARD BLOCK: no token = no render
  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Role protection
  if (
    allowedRoles &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
