import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { updatePassword, updateProfile } from 'firebase/auth';
import { useParams, useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, db } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const storage = getStorage();
  const firestore = getFirestore();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfilePicture = async () => {
      try {
        // First try to get from Firestore
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().photoURL) {
          setProfilePicture(userDoc.data().photoURL);
        } else if (user?.photoURL) {
          // If not in Firestore but exists in Auth, sync to Firestore
          setProfilePicture(user.photoURL);
          await setDoc(doc(firestore, 'users', user.uid), {
            photoURL: user.photoURL,
            email: user.email,
            displayName: user.displayName || ''
          }, { merge: true });
        }
      } catch (error) {
        console.error('Error loading profile picture:', error);
      }
    };

    if (user?.uid) {
      loadProfilePicture();
    }
  }, [user, firestore]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userRef = doc(db, 'users', userId || user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfileUser({ 
            id: userDoc.id, 
            ...userData,
            metadata: {
              creationTime: userData.createdAt?.toDate() || user.metadata?.creationTime,
              lastSignInTime: userData.lastSignIn?.toDate() || user.metadata?.lastSignInTime
            }
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [db, userId, user]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await updatePassword(user, newPassword);
      setSuccess('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await updateProfile(user, {
        displayName: displayName
      });

      const userDoc = doc(firestore, 'users', user.uid);
      await updateDoc(userDoc, {
        displayName: displayName
      });

      setSuccess('Profile updated successfully');
      setIsUpdatingProfile(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      const tempURL = URL.createObjectURL(file);
      setProfilePicture(tempURL);

      const storageRef = ref(storage, `profile-pictures/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update Auth Profile
      await updateProfile(user, {
        photoURL: downloadURL
      });

      // Update Firestore - ensure the document exists with merge
      const userDoc = doc(firestore, 'users', user.uid);
      await setDoc(userDoc, {
        photoURL: downloadURL,
        email: user.email,
        displayName: user.displayName || '',
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      // Update local state
      setProfilePicture(downloadURL);
      setSuccess('Profile picture updated successfully');

      // Clean up temporary URL
      URL.revokeObjectURL(tempURL);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError(error.message);
      // Reset profile picture to previous state if upload fails
      setProfilePicture(user?.photoURL || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = () => {
    navigate(`/chat/${profileUser.id}`);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!profileUser) {
    return <div>User not found</div>;
  }

  const isOwnProfile = profileUser.id === user.uid;

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fee2e2',
          color: '#dc2626',
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#dcfce7',
          color: '#16a34a',
          borderRadius: '6px',
          marginBottom: '1rem'
        }}>
          {success}
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '2rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          position: 'relative',
          width: '80px',
          height: '80px',
          marginRight: '1.5rem'
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            backgroundColor: profilePicture ? 'transparent' : '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: 'white',
            backgroundImage: profilePicture ? `url(${profilePicture})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: profilePicture ? '2px solid #e5e7eb' : 'none',
            transition: 'background-image 0.3s ease'
          }}>
            {!profilePicture && (user?.email?.[0]?.toUpperCase() || 'U')}
          </div>
          <label style={{
            position: 'absolute',
            bottom: '-10px',
            right: '-10px',
            backgroundColor: '#4f46e5',
            color: 'white',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'transform 0.2s ease',
            ':hover': {
              transform: 'scale(1.1)'
            }
          }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              disabled={isUploading}
            />
            {isUploading ? '...' : '📷'}
          </label>
        </div>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '1.875rem',
            fontWeight: 600,
            color: '#111827'
          }}>
            {profileUser.displayName || profileUser.email?.split('@')[0] || 'User'}
          </h1>
          <p style={{
            margin: '0.5rem 0 0',
            fontSize: '1rem',
            color: '#6b7280'
          }}>
            {profileUser.email}
          </p>
          {!isOwnProfile && (
            <button
              onClick={handleSendMessage}
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                ':hover': {
                  backgroundColor: '#4338ca'
                }
              }}
            >
              Send Message
            </button>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            margin: '0 0 1rem',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#111827'
          }}>
            Account Information
          </h2>
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#6b7280',
                marginBottom: '0.5rem'
              }}>
                Email Address
              </label>
              <div style={{
                padding: '0.75rem',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                color: '#111827'
              }}>
                {profileUser.email}
              </div>
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#6b7280',
                marginBottom: '0.5rem'
              }}>
                Account Created
              </label>
              <div style={{
                padding: '0.75rem',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                color: '#111827'
              }}>
                {profileUser.metadata?.creationTime ? new Date(profileUser.metadata.creationTime).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          padding: '1.5rem',
          backgroundColor: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{
            margin: '0 0 1rem',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#111827'
          }}>
            Security
          </h2>
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#6b7280',
                marginBottom: '0.5rem'
              }}>
                Last Sign In
              </label>
              <div style={{
                padding: '0.75rem',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                color: '#111827'
              }}>
                {profileUser.metadata?.lastSignInTime ? new Date(profileUser.metadata.lastSignInTime).toLocaleString() : 'N/A'}
              </div>
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#6b7280',
                marginBottom: '0.5rem'
              }}>
                Account Status
              </label>
              <div style={{
                padding: '0.75rem',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                color: '#111827'
              }}>
                Active
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        padding: '1.5rem',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{
          margin: '0 0 1rem',
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#111827'
        }}>
          Account Actions
        </h2>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {!isChangingPassword && !isUpdatingProfile && (
            <>
              <button
                onClick={() => setIsChangingPassword(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'background-color 0.2s'
                }}
              >
                Change Password
              </button>
              <button
                onClick={() => setIsUpdatingProfile(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f3f4f6',
                  color: '#4f46e5',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  transition: 'background-color 0.2s'
                }}
              >
                Update Profile
              </button>
            </>
          )}

          {isChangingPassword && (
            <form onSubmit={handlePasswordChange} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                  required
                />
              </div>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Update Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#4f46e5',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {isUpdatingProfile && (
            <form onSubmit={handleProfileUpdate} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#6b7280',
                  marginBottom: '0.5rem'
                }}>
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Update Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsUpdatingProfile(false);
                    setDisplayName(user?.displayName || '');
                    setError('');
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#f3f4f6',
                    color: '#4f46e5',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
} 