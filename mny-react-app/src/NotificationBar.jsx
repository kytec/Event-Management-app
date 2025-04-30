import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

// Add keyframes for animations
const styles = `
  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-5px);
    }
  }

  @keyframes glow {
    0%, 100% {
      box-shadow: 0 0 5px rgba(79, 70, 229, 0.5);
    }
    50% {
      box-shadow: 0 0 20px rgba(79, 70, 229, 0.8);
    }
  }
`;

const NotificationBar = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const notificationSound = useRef(new Audio('/notification.mp3'));
  const panelRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'events'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        read: false
      }));

      // Play sound for new notifications
      if (newNotifications.length > 0 && notifications.length > 0) {
        const latestNotification = newNotifications[0];
        const isNew = !notifications.some(n => n.id === latestNotification.id);
        if (isNew) {
          notificationSound.current.play().catch(err => console.log('Error playing sound:', err));
        }
      }

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'events', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      for (const notification of unreadNotifications) {
        const notificationRef = doc(db, 'events', notification.id);
        await updateDoc(notificationRef, { read: true });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    setIsOpen(false);
    navigate(`/events/${notification.id}`);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-xl overflow-hidden transform transition-all duration-200 ease-in-out"
          style={{
            maxHeight: 'calc(100vh - 100px)',
            zIndex: 9999
          }}
        >
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Recent Events</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-500 hover:text-blue-600"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No new events
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-colors duration-200 ${
                    !notification.read ? 'bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{notification.name}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {notification.creatorEmail}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          📍 {notification.location}
                        </span>
                        <span className="text-xs text-gray-500">
                          📞 {notification.contactPhone}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBar; 