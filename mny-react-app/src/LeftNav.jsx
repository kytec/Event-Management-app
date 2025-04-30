import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function LeftNav({ isOpen, onToggle }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/events', label: 'Events', icon: '��' },
    { path: '/chat', label: 'Chat', icon: '💬' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <>
      <button
        onClick={onToggle}
        style={{
          position: 'fixed',
          top: '1rem',
          left: isOpen ? '250px' : '1rem',
          zIndex: 1000,
          background: 'white',
          border: 'none',
          padding: '0.5rem',
          borderRadius: '4px',
          cursor: 'pointer',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          transition: 'left 0.3s ease'
        }}
      >
        {isOpen ? '✕' : '☰'}
      </button>
      <nav
        style={{
          width: isOpen ? '250px' : '0',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          backgroundColor: '#1a1a1a',
          color: 'white',
          padding: '2rem 0',
          transition: 'width 0.3s ease',
          overflow: 'hidden',
          zIndex: 999
        }}
      >
        <div style={{ 
          width: '250px',
          padding: '0 1.5rem',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease',
          transitionDelay: isOpen ? '0.2s' : '0s'
        }}>
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Event Manager</h2>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: '#888' }}>
              {user?.email}
            </p>
          </div>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map((item) => (
              <li key={item.path} style={{ marginBottom: '0.5rem' }}>
                <Link
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    color: location.pathname === item.path ? '#4f46e5' : 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    transition: 'background-color 0.2s',
                    backgroundColor: location.pathname === item.path ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                  }}
                >
                  <span style={{ marginRight: '0.75rem', fontSize: '1.2rem' }}>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <button
              onClick={logout}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#e53e3e',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <span>🚪</span>
              Logout
            </button>
          </div>
        </div>
      </nav>
    </>
  );
} 