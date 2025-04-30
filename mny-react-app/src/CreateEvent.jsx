import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function CreateEvent() {
  const [formData, setFormData] = useState({ name: '', date: '', contact: '', createdBy: '', description: '' });
  const { db, user } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.date || !formData.contact || !formData.createdBy || !formData.description) {
      alert("Please fill out all fields!");
      return;
    }

    try {
      const eventData = {
        name: formData.name,
        description: formData.description,
        date: formData.date,
        location: '',
        contactPhone: formData.contact,
        creatorId: user.uid,
        creatorEmail: user.email,
        createdAt: serverTimestamp(),
        read: false
      };
      await addDoc(collection(db, 'events'), eventData);
      setSuccess('Event created successfully!');
      setFormData({ name: '', date: '', contact: '', createdBy: '', description: '' });
    } catch (err) {
      setError('Error creating event: ' + err.message);
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Create New Event</h1>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        maxWidth: '600px'
      }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Event Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter event name"
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
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Contact Phone</label>
            <input
              type="tel"
              name="contact"
              placeholder="Enter contact phone number"
              value={formData.contact}
              onChange={handleChange}
              pattern="[0-9]{10}"
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Created By</label>
            <input
              type="text"
              name="createdBy"
              placeholder="Enter creator name"
              value={formData.createdBy}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Event Description</label>
            <textarea
              name="description"
              placeholder="Enter event description"
              value={formData.description}
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', minHeight: '80px' }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '0.75rem',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Create Event
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
      </div>
    </div>
  );
} 