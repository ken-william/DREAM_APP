// frontend_dream_synthesizer/src/components/pages/NotificationsPage.jsx
import React, { useEffect } from 'react';

const NotificationsPage = ({
  setCurrentPage,
  notifications, notificationsLoading, notificationsError, fetchNotifications,
  onMarkAsRead, onMarkAllAsRead
}) => {
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-64px)] bg-gray-50 p-4 w-full">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">Notifications</h2>
        {notificationsLoading && <p className="text-center text-gray-600">Chargement des notifications...</p>}
        {notificationsError && <p className="text-center text-red-600">{notificationsError}</p>}

        {Array.isArray(notifications) && notifications.length === 0 && !notificationsLoading && !notificationsError ? (
          <p className="text-center text-gray-600">Vous n'avez pas de notifications.</p>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={onMarkAllAsRead}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg text-sm"
              >
                Marquer tout comme lu
              </button>
            </div>
            <div className="space-y-4">
              {Array.isArray(notifications) && notifications.map(notification => (
                <div key={notification.id} className={`p-4 rounded-lg shadow-sm flex items-center justify-between ${notification.is_read ? 'bg-gray-100' : 'bg-blue-50 border border-blue-200'}`}>
                  <div>
                    <p className={`font-medium ${notification.is_read ? 'text-gray-700' : 'text-blue-800'}`}>
                      {notification.content || `Nouvelle notification de type: ${notification.notification_type}`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <button
                      onClick={() => onMarkAsRead(notification.id)}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      Marquer comme lu
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        
        <button onClick={() => setCurrentPage('dashboard')} className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200">
          Retour au Tableau de Bord
        </button>
      </div>
    </div>
  );
};

export default NotificationsPage;