import { LogOut } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import NotificationsDropdown from "./NotificationsDropdown";
import SettingsDropdown from "./SettingsDropdown";

function getInitialsFromName(name) {
  const cleaned = String(name || "").trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getDisplayName(user) {
  if (user?.fullName) return user.fullName;
  // fallback to email prefix if backend doesn't provide fullName
  if (user?.sub && String(user.sub).includes("@")) return String(user.sub).split("@")[0];
  if (user?.email && String(user.email).includes("@")) return String(user.email).split("@")[0];
  return user?.sub || user?.email || "User";
}

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout(); // This already clears localStorage and updates auth state
    } catch {
      // Silently handle errors - logout will proceed anyway
    }
    
    // Clear sessionStorage and force full page reload to clear any cached state
    sessionStorage.clear();
    window.location.href = "/login";
  };

  const displayName = getDisplayName(user);
  const displayEmail =
    user?.sub || user?.email || "";
  const initials = getInitialsFromName(displayName);

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        {/* <div className="text-base font-semibold text-gray-800">
          Dashboard
        </div> */}
        <div className="hidden h-5 w-px bg-gray-200 sm:block" />
        <div className="hidden text-sm text-gray-500 sm:block">
          Welcome, {displayName}
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-6">

        {/* Notifications */}
        <NotificationsDropdown />

        {/* Settings */}
        <SettingsDropdown />

        {/* Profile */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-medium">
            {initials}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-medium text-gray-700">
              {displayName}
            </p>
            {!!displayEmail && (
              <p className="text-xs text-gray-500">
                {displayEmail}
              </p>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>

      </div>
      </div>
    </header>
  );
};

export default Header;
