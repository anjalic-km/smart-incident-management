import { Bell, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
  try {
    await logout(); // backend API (optional)
  } finally {
    localStorage.clear();
    sessionStorage.clear();

    navigate("/login", { replace: true });

    // 🔥 FORCE app reset (kills bfcache)
    window.location.href = "/login";
  }
};

  const initials = user?.email
    ? user.email.charAt(0).toUpperCase()
    : "?";

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      
      {/* LEFT */}
      <div className="text-lg font-semibold text-gray-700">
        ServicePulse
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-6">

        {/* Notifications */}
        <button className="relative text-gray-600 hover:text-indigo-600">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-1.5 rounded-full">
            2
          </span>
        </button>

        {/* Settings */}
        <button className="text-gray-600 hover:text-indigo-600">
          <Settings className="w-5 h-5" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium">
            {initials}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-gray-700">
              {user?.email}
            </p>
            <p className="text-xs text-gray-500">
              {user?.role}
            </p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-gray-600 hover:text-red-600"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>

      </div>
    </header>
  );
};

export default Header;
