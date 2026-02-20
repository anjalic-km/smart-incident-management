import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import AppBreadcrumb from "../components/layout/AppBreadcrumb";

const AuthLayout = () => {
  const location = useLocation();
  const blurShell = location.pathname === "/force-change-password";
  const blurClass = blurShell ? "blur-sm opacity-70 pointer-events-none select-none" : "";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <div className={blurClass}>
        <Sidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className={blurClass}>
          <Header />
        </div>
        <main className="flex-1 overflow-y-auto p-6">
          <AppBreadcrumb />
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AuthLayout;
