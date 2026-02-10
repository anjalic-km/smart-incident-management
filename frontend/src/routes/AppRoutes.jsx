import { Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Index from "../pages/public/Index";
import ForgotPassword from "../pages/auth/ForgotPassword";
import AuthLayout from "../layouts/AuthLayout";


import Unauthorized from "../pages/errors/Unauthorized";
import NotFound from "../pages/errors/NotFound";
import Maintenance from "../pages/errors/Maintenance";

import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";

import AdminDashboard from "../pages/admin/AdminDashboard";
import ManagerDashboard from "../pages/manager/ManagerDashboard";
import EngineerDashboard from "../pages/engineer/EngineerDashboard";
import UserDashboard from "../pages/user/UserDashboard";

export default function AppRoutes() {
  return (
    <Routes>

      <Route path="/" element={
          <PublicRoute>
            <Index />
          </PublicRoute>
        }
      />

      <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route path="/authentication/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      <Route path="/forgot-password" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />

      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/maintenance" element={<Maintenance />} />


      {/* ALL AUTHENTICATED PAGES */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={["ADMIN", "MANAGER", "ENGINEER", "USER"]}
          >
            <AuthLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        <Route path="/engineer/dashboard" element={<EngineerDashboard />} />
        <Route path="/user/dashboard" element={<UserDashboard />} />
      </Route>
      {/* Admin */}
      {/* <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      /> */}

      {/* Manager */}
      {/* <Route
        path="/manager/dashboard"
        element={
          <ProtectedRoute allowedRoles={["MANAGER"]}>
            <ManagerDashboard />
          </ProtectedRoute>
        }
      /> */}

      {/* Engineer */}
      {/* <Route
        path="/engineer/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ENGINEER"]}>
            <EngineerDashboard />
          </ProtectedRoute>
        }
      /> */}

      {/* User */}
      {/* <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute allowedRoles={["USER"]}>
            <UserDashboard />
          </ProtectedRoute>
        }
      /> */}

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
