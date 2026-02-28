import React, { useState, useEffect } from 'react';

const API_URL = 'https://async-task-processing-system.onrender.com/api/entries';

function App() {
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('LOW');
  const [loading, setLoading] = useState(false);

  const fetchEntries = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

  useEffect(() => {
    fetchEntries();
    const interval = setInterval(fetchEntries, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority }),
      });
      if (response.ok) {
        setTitle('');
        setPriority('LOW');
        fetchEntries();
      }
    } catch (error) {
      console.error('Error creating entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'PROCESSING': return 'badge-processing';
      case 'COMPLETED': return 'badge-completed';
      case 'FAILED': return 'badge-failed';
      default: return '';
    }
  };
  
  const getPriorityBadgeClass = (priorityStr) => {
    switch (priorityStr) {
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return 'priority-low';
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>Async Task Processing System</h1>
        <p>Robust Background Job Queuing with Priority Real-time Status Tracking</p>
      </header>

      <div className="card">
        <form onSubmit={handleSubmit} className="form-group">
          <input
            type="text"
            placeholder="Enter task name (e.g., Generate Report)..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
          <select 
            className="priority-select" 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)}
            disabled={loading}
          >
            <option value="LOW">Low Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="HIGH">High Priority</option>
          </select>
          <button type="submit" disabled={loading || !title.trim()}>
            {loading ? 'Submitting...' : 'Create Job'}
          </button>
        </form>
      </div>

      <div className="entry-list">
        {entries.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#737373' }}>No jobs enqueued. Create one to start.</p>
        ) : (
          entries.map((entry) => (
            <div key={entry._id} className="entry-item">
              <div className="entry-header">
                <div>
                  <span className="entry-title">{entry.title}</span>
                  <span className={`priority-badge ${getPriorityBadgeClass(entry.priority)}`}>
                    {entry.priority || 'LOW'} Priority
                  </span>
                </div>
                <span className={`badge ${getStatusBadgeClass(entry.status)}`}>
                  {entry.status}
                </span>
              </div>

              {entry.status === 'PROCESSING' || entry.status === 'COMPLETED' ? (
                <div className="progress-container">
                  <div 
                    className="progress-bar" 
                    style={{ width: `${entry.progress}%` }}
                  ></div>
                </div>
              ) : null}

              {entry.result && <div className="result">{entry.result}</div>}
              {entry.error && <div className="result" style={{ color: '#dc2626' }}>Error: {entry.error}</div>}

              <div className="timestamp">
                Enqueued: {new Date(entry.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default App;

