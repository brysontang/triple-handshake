import React from 'react';

const Notification = ({ notification }) => {
  if (!notification) return null;

  const bgColorClass =
    {
      error: 'bg-red-600',
      warning: 'bg-yellow-600',
      info: 'bg-blue-600',
      success: 'bg-green-600',
    }[notification.type] || 'bg-green-600';

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg transition-all transform translate-y-0 z-50 ${bgColorClass}`}
    >
      <p className="text-white">{notification.message}</p>
    </div>
  );
};

export default Notification;
