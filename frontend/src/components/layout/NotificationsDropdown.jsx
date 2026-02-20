import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, CheckCircle2 } from "lucide-react";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadNotificationsCount } from "../../api/notificationApi";
import { showError } from "../../utils/toast";

function getApiMessage(err) {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.statusMessage ||
    err?.message ||
    "Something went wrong"
  );
}

export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await getNotifications(0, 10);
      const data = response?.data || response;
      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (data?.content && Array.isArray(data.content)) {
        // Handle paginated response
        setNotifications(data.content);
      }
    } catch (err) {
      console.log("Error fetching notifications:", getApiMessage(err));
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadNotificationsCount();
      const count = response?.data ? response.data : 0;
      setUnreadCount(typeof count === 'number' ? count : 0);
    } catch (err) {
      console.log("Error fetching unread count:", getApiMessage(err));
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      // Refetch unread count to keep badge in sync
      await fetchUnreadCount();
    } catch (err) {
      showError(getApiMessage(err));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        await markAllNotificationsAsRead();
      await fetchUnreadCount();
    } catch (err) {
      showError(getApiMessage(err));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-600 hover:text-indigo-600"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-1.5 rounded-full font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl z-50">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                title="Mark all as read"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-gray-600">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-600">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-b border-gray-100 px-4 py-3 hover:bg-gray-50 cursor-pointer transition ${
                    !notification.read ? "bg-blue-50" : ""
                  }`}
                  onClick={(e) => !notification.read && handleMarkAsRead(notification.id, e)}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title || "Notification"}
                      </p>
                      <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                        {notification.message || notification.description}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(notification.receivedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="mt-1 flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-indigo-600" />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
