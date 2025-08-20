import React from 'react';
import { useNotifications } from "./NotificationContext";

const NotificationDropdown = ({ onClose }) => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="notification-dropdown">
      <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600">
        <h3 className="text-sm font-bold text-white flex justify-between items-center">
          <span>Notifications</span>
          <span className="bg-white text-blue-600 text-xs rounded-full px-2 py-0.5">
            {notifications.length}
          </span>
        </h3>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div 
              key={notification.id}
              className={`p-4 border-b ${
                notification.type === 'warning' ? 'bg-yellow-50' : 
                notification.type === 'danger' ? 'bg-red-50' : 'bg-green-50'
              }`}
            >
              <div className="flex justify-between">
                <h4 className={`font-medium text-sm ${
                  notification.type === 'warning' ? 'text-yellow-700' : 
                  notification.type === 'danger' ? 'text-red-700' : 'text-green-700'
                }`}>
                  {notification.title}
                </h4>
                <button 
                  onClick={() => removeNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
              <span className="text-xs text-gray-400 mt-2 block">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-gray-500">
            <p>No new notifications</p>
          </div>
        )}
      </div>

      <div className="px-4 py-2 bg-gray-50 border-t">
        <button
          className="w-full text-center text-xs text-blue-500 hover:text-blue-700"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;