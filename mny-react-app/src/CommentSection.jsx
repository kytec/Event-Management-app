import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

export default function CommentSection({ eventId }) {
  const { db, user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  // Fetch comments and their replies
  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      const commentsRef = collection(db, 'events', eventId, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);
      const commentsData = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const comment = { id: docSnap.id, ...docSnap.data(), replies: [] };
        // Fetch replies for each comment
        const repliesRef = collection(db, 'events', eventId, 'comments', docSnap.id, 'replies');
        const repliesSnap = await getDocs(query(repliesRef, orderBy('createdAt', 'asc')));
        comment.replies = repliesSnap.docs.map(r => ({ id: r.id, ...r.data() }));
        return comment;
      }));
      setComments(commentsData);
      setCommentCount(commentsData.reduce((total, comment) => total + 1 + comment.replies.length, 0));
      setLoading(false);
    };
    if (eventId) fetchComments();
  }, [db, eventId]);

  // Add a new comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const commentsRef = collection(db, 'events', eventId, 'comments');
    await addDoc(commentsRef, {
      text: newComment,
      userId: user.uid,
      userEmail: user.email,
      createdAt: serverTimestamp(),
    });
    setNewComment('');
    // Refresh comments
    setTimeout(() => window.location.reload(), 500); // quick refresh for now
  };

  // Add a reply to a comment
  const handleAddReply = async (commentId) => {
    if (!replyText.trim()) return;
    const repliesRef = collection(db, 'events', eventId, 'comments', commentId, 'replies');
    await addDoc(repliesRef, {
      text: replyText,
      userId: user.uid,
      userEmail: user.email,
      createdAt: serverTimestamp(),
    });
    setReplyText('');
    setReplyingTo(null);
    setTimeout(() => window.location.reload(), 500); // quick refresh for now
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  return (
    <div style={{ marginTop: '1.5rem', background: '#f9fafb', borderRadius: '8px', padding: '1rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h4 style={{ margin: 0 }}>Comments ({commentCount})</h4>
        <button
          onClick={toggleComments}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: showComments ? '#e5e7eb' : '#4f46e5',
            color: showComments ? '#374151' : 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            transition: 'all 0.2s'
          }}
        >
          {showComments ? 'Hide Comments' : 'View Comments'}
        </button>
      </div>

      {showComments && (
        <>
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
            <button 
              type="submit" 
              style={{ 
                padding: '0.5rem 1rem', 
                background: '#4f46e5', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Post
            </button>
          </form>

          {loading ? <p>Loading comments...</p> : (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1rem',
              maxHeight: '400px',
              overflowY: 'auto',
              paddingRight: '0.5rem'
            }}>
              {comments.length === 0 && <p>No comments yet.</p>}
              {comments.map(comment => (
                <div key={comment.id} style={{ 
                  background: 'white', 
                  borderRadius: '6px', 
                  padding: '0.75rem', 
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                }}>
                  <div style={{ fontWeight: 500 }}>{comment.userEmail}</div>
                  <div style={{ margin: '0.5rem 0' }}>{comment.text}</div>
                  <button 
                    onClick={() => setReplyingTo(comment.id)} 
                    style={{ 
                      fontSize: '0.9rem', 
                      color: '#4f46e5', 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer' 
                    }}
                  >
                    Reply
                  </button>
                  
                  {replyingTo === comment.id && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <input
                        type="text"
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        style={{ width: '80%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      <button 
                        onClick={() => handleAddReply(comment.id)} 
                        style={{ 
                          marginLeft: '0.5rem', 
                          padding: '0.4rem 1rem', 
                          background: '#4f46e5', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px' 
                        }}
                      >
                        Send
                      </button>
                      <button 
                        onClick={() => setReplyingTo(null)} 
                        style={{ 
                          marginLeft: '0.5rem', 
                          padding: '0.4rem 1rem', 
                          background: '#e5e7eb', 
                          color: '#333', 
                          border: 'none', 
                          borderRadius: '4px' 
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div style={{ 
                      marginTop: '0.75rem', 
                      marginLeft: '1.5rem', 
                      borderLeft: '2px solid #e5e7eb', 
                      paddingLeft: '1rem' 
                    }}>
                      {comment.replies.map(reply => (
                        <div key={reply.id} style={{ marginBottom: '0.5rem' }}>
                          <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>{reply.userEmail}</div>
                          <div style={{ fontSize: '0.95rem' }}>{reply.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 