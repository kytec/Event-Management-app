import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './AuthContext';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        } else {
          setError('User not found');
        }
      } catch (err) {
        setError('Error fetching user profile');
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-6">
          <div className="w-32 h-32 rounded-full overflow-hidden">
            {userProfile?.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-4xl text-gray-400">
                  {userProfile?.displayName?.[0] || '?'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800">
              {userProfile?.displayName || 'Anonymous User'}
            </h1>
            <p className="text-gray-600 mt-2">{userProfile?.email}</p>
            {userProfile?.bio && (
              <p className="text-gray-700 mt-4">{userProfile.bio}</p>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userProfile?.phone && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Phone</p>
                <p className="text-gray-800">{userProfile.phone}</p>
              </div>
            )}
            {userProfile?.location && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Location</p>
                <p className="text-gray-800">{userProfile.location}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Events</h2>
          {/* We can add a list of events created by this user here */}
          <p className="text-gray-500">No events found.</p>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile; 