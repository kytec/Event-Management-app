import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function Chat() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const { db, user } = useAuth();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const storage = getStorage();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all users except current user
  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userList = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.id !== user.uid);
      setUsers(userList);
    });

    return () => unsubscribe();
  }, [db, user]);

  // Handle direct chat link
  useEffect(() => {
    const fetchUser = async () => {
      if (userId && userId !== user.uid) {
        try {
          const userRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setSelectedUser({ id: userDoc.id, ...userDoc.data() });
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }
      }
    };

    fetchUser();
  }, [db, userId, user.uid]);

  // Handle typing status
  useEffect(() => {
    if (!selectedUser) return;

    const chatId = [user.uid, selectedUser.id].sort().join('_');
    const typingRef = doc(db, 'chats', chatId, 'typing', user.uid);

    const updateTypingStatus = async () => {
      if (isTyping) {
        await updateDoc(typingRef, {
          isTyping: true,
          timestamp: serverTimestamp()
        });
      } else {
        await updateDoc(typingRef, {
          isTyping: false,
          timestamp: serverTimestamp()
        });
      }
    };

    updateTypingStatus();
  }, [db, user.uid, selectedUser, isTyping]);

  // Listen for typing status
  useEffect(() => {
    if (!selectedUser) return;

    const chatId = [user.uid, selectedUser.id].sort().join('_');
    const typingRef = collection(db, 'chats', chatId, 'typing');
    const q = query(typingRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const typingStatus = {};
      snapshot.docs.forEach(doc => {
        if (doc.id !== user.uid) {
          typingStatus[doc.id] = doc.data().isTyping;
        }
      });
      setTypingUsers(typingStatus);
    });

    return () => unsubscribe();
  }, [db, user.uid, selectedUser]);

  // Fetch messages when a user is selected
  useEffect(() => {
    if (!selectedUser) return;

    const chatId = [user.uid, selectedUser.id].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(newMessages);
      scrollToBottom();
      markMessagesAsRead();
    });

    return () => unsubscribe();
  }, [db, user, selectedUser]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const markMessagesAsRead = async () => {
    if (!selectedUser) return;

    const chatId = [user.uid, selectedUser.id].sort().join('_');
    const unreadMessages = messages.filter(
      msg => msg.senderId === selectedUser.id && !msg.read
    );

    for (const message of unreadMessages) {
      const messageRef = doc(db, 'chats', chatId, 'messages', message.id);
      await updateDoc(messageRef, { read: true });
    }
  };

  const handleTyping = () => {
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    const chatId = [user.uid, selectedUser.id].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    try {
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: user.uid,
        receiverId: selectedUser.id,
        timestamp: serverTimestamp(),
        read: false
      });
      setNewMessage('');
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const chatId = [user.uid, selectedUser.id].sort().join('_');
      const storageRef = ref(storage, `chats/${chatId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        type: 'file',
        fileURL: downloadURL,
        fileName: file.name,
        fileType: file.type,
        senderId: user.uid,
        receiverId: selectedUser.id,
        timestamp: serverTimestamp(),
        read: false
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleUserSelect = (selectedUser) => {
    setSelectedUser(selectedUser);
    navigate(`/chat/${selectedUser.id}`);
  };

  // Filter users based on search query
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 100px)',
      backgroundColor: '#f9fafb',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      {/* Users List */}
      <div style={{
        width: '250px',
        borderRight: '1px solid #e5e7eb',
        backgroundColor: 'white',
        overflowY: 'auto'
      }}>
        <div style={{
          padding: '1rem',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: '#4f46e5',
          color: 'white'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Chat</h2>
        </div>
        {/* Search Bar */}
        <div style={{ padding: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #e5e7eb',
              borderRadius: '4px',
              outline: 'none',
              ':focus': {
                borderColor: '#4f46e5'
              }
            }}
          />
        </div>
        <div style={{ padding: '0.5rem' }}>
          {filteredUsers.map(u => (
            <div
              key={u.id}
              onClick={() => handleUserSelect(u)}
              style={{
                padding: '0.75rem',
                cursor: 'pointer',
                borderRadius: '4px',
                marginBottom: '0.5rem',
                backgroundColor: selectedUser?.id === u.id ? '#f0f9ff' : 'white',
                transition: 'all 0.2s ease',
                ':hover': {
                  backgroundColor: '#f9fafb'
                }
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div 
                  style={{ 
                    fontWeight: 500,
                    color: '#4f46e5',
                    cursor: 'pointer',
                    ':hover': {
                      textDecoration: 'underline'
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/profile/${u.id}`);
                  }}
                >
                  {u.email}
                </div>
                {typingUsers[u.id] && (
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>
                    typing...
                  </span>
                )}
              </div>
              {u.displayName && (
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  {u.displayName}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white'
      }}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 500 }}>{selectedUser.email}</div>
                {selectedUser.displayName && (
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {selectedUser.displayName}
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate(`/profile/${selectedUser.id}`)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#f3f4f6',
                  color: '#4f46e5',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  ':hover': {
                    backgroundColor: '#e5e7eb'
                  }
                }}
              >
                View Profile
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              {messages.map(message => (
                <div
                  key={message.id}
                  style={{
                    alignSelf: message.senderId === user.uid ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    backgroundColor: message.senderId === user.uid ? '#4f46e5' : '#f3f4f6',
                    color: message.senderId === user.uid ? 'white' : 'black'
                  }}
                >
                  {message.type === 'file' ? (
                    <div>
                      <a
                        href={message.fileURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: message.senderId === user.uid ? 'white' : '#4f46e5',
                          textDecoration: 'underline'
                        }}
                      >
                        📎 {message.fileName}
                      </a>
                    </div>
                  ) : (
                    message.text
                  )}
                  <div style={{
                    fontSize: '0.75rem',
                    marginTop: '0.25rem',
                    opacity: 0.8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    {formatTimestamp(message.timestamp)}
                    {message.senderId === user.uid && (
                      <span>
                        {message.read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} style={{
              padding: '1rem',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: 'white'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '0.75rem',
                    backgroundColor: '#f3f4f6',
                    color: '#4f46e5',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    ':hover': {
                      backgroundColor: '#e5e7eb'
                    }
                  }}
                >
                  📎
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type a message..."
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    outline: 'none',
                    ':focus': {
                      borderColor: '#4f46e5'
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={isUploading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isUploading ? 0.7 : 1,
                    ':hover': {
                      backgroundColor: '#4338ca'
                    }
                  }}
                >
                  {isUploading ? 'Uploading...' : 'Send'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280'
          }}>
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
} 