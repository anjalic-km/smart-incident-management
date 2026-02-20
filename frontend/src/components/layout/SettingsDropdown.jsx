import { useState, useRef, useEffect } from "react";
import { Settings, User, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-600 hover:text-indigo-600"
        title="Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-xl z-50">
          <div className="py-2">
            <button
              onClick={() => handleNavigate("/profile/edit")}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User className="w-4 h-4" />
              Edit Profile
            </button>

            <button
              onClick={() => handleNavigate("/profile/change-password")}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-t border-gray-100"
            >
              <Lock className="w-4 h-4" />
              Change Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
