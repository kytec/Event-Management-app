import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import CommentSection from './CommentSection';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({ name: '', date: '', contact: '', createdBy: '' });
  const { db, user } = useAuth();

  // Load events from Firestore
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'events'));
        const eventsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, [db]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.name || !formData.date || !formData.contact || !formData.createdBy) {
      alert("Please fill out all fields!");
      return;
    }

    try {
      const eventToUpdate = events[editIndex];
      if (eventToUpdate.creatorId !== user.uid) {
        alert("You can only edit events you created!");
        return;
      }
      const updateData = {
        ...formData,
        creatorId: eventToUpdate.creatorId,
        creatorEmail: eventToUpdate.creatorEmail
      };
      await updateDoc(doc(db, 'events', eventToUpdate.id), updateData);
      const updatedEvents = [...events];
      updatedEvents[editIndex] = { ...eventToUpdate, ...updateData };
      setEvents(updatedEvents);
      setEditIndex(null);
      setFormData({ name: '', date: '', contact: '', createdBy: '' });
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event. Please try again.');
    }
  }

  async function handleDelete(indexToDelete) {
    try {
      const eventToDelete = events[indexToDelete];
      if (eventToDelete.creatorId !== user.uid) {
        alert("You can only delete events you created!");
        return;
      }
      await deleteDoc(doc(db, 'events', eventToDelete.id));
      setEvents(prevEvents => prevEvents.filter((_, index) => index !== indexToDelete));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  }

  function handleEdit(indexToEdit) {
    const eventToEdit = events[indexToEdit];
    if (eventToEdit.creatorId !== user.uid) {
      alert("You can only edit events you created!");
      return;
    }
    setFormData({
      name: eventToEdit.name,
      date: eventToEdit.date,
      contact: eventToEdit.contact,
      createdBy: eventToEdit.createdBy
    });
    setEditIndex(indexToEdit);
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>All Events</h1>
      
      {editIndex !== null && (
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2>Edit Event</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Event Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Contact Email</label>
              <input
                type="email"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Created By</label>
              <input
                type="text"
                name="createdBy"
                value={formData.createdBy}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Update Event
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditIndex(null);
                  setFormData({ name: '', date: '', contact: '', createdBy: '' });
                }}
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#e53e3e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  flex: 1
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: '1rem' }}>
        {events.length === 0 ? (
          <p>No events found.</p>
        ) : (
          events.map((event, index) => (
            <div key={event.id} style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              position: 'relative'
            }}>
              <h3 style={{ margin: '0 0 1rem 0' }}>{event.name}</h3>
              {event.description && (
                <p style={{ margin: '0 0 1rem 0', color: '#444' }}><strong>Description:</strong> {event.description}</p>
              )}
              <p><strong>Date:</strong> {event.date}</p>
              <p><strong>Contact:</strong> <a href={`mailto:${event.contact}`}>{event.contact}</a></p>
              <p><strong>Created by:</strong> {event.createdBy}</p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                Added by: {event.creatorEmail}
              </p>

              {event.creatorId === user.uid && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handleEdit(index)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#e53e3e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}

              {/* Comment Section */}
              <CommentSection eventId={event.id} />
            </div>
          ))
        )}
      </div>
    </div>
  );
} 