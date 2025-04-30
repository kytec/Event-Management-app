import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <header style={{
      background: '#4f46e5',
      color: 'white',
      padding: '1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <h1 style={{ margin: 0 }}>Event Manager</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <>
            <span>Welcome, {user.email}</span>
            <button
              onClick={() => navigate('/profile')}
              style={{
                background: 'white',
                color: '#4f46e5',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: 'white',
                color: '#4f46e5',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'white',
              color: '#4f46e5',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
} 