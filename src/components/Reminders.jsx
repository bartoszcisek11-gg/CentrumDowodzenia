import React, { useState, useEffect } from 'react';

export default function Reminders() {
  const [reminders, setReminders] = useState(() => {
    return JSON.parse(localStorage.getItem('dashboard_reminders')) || [];
  });
  const [text, setText] = useState('');

  useEffect(() => {
    localStorage.setItem('dashboard_reminders', JSON.stringify(reminders));
  }, [reminders]);

  const addReminder = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setReminders(prev => [...prev, { id: Date.now(), text: text.trim(), completed: false }]);
    setText('');
  };

  const toggleReminder = (id) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const deleteReminder = (id) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="reminders-container">
      <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
        📌 Przypomnienia
      </h3>

      <form onSubmit={addReminder} style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Dodaj nowe przypomnienie..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            background: 'var(--bg-color)',
            color: 'var(--text)',
            outline: 'none',
            fontSize: '0.9rem'
          }}
        />
        <button type="submit" className="btn-save" style={{ padding: '8px 14px' }}>+</button>
      </form>

      <div className="reminders-list" style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {reminders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Brak aktywnych przypomnień.</p>
        ) : (
          reminders.map(r => (
            <div key={r.id} className="history-item" style={{ padding: '8px 10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1 }}>
                <input
                  type="checkbox"
                  checked={r.completed}
                  onChange={() => toggleReminder(r.id)}
                  className="home-checkbox"
                />
                <span style={{ textDecoration: r.completed ? 'line-through' : 'none', opacity: r.completed ? 0.5 : 1, fontSize: '0.9rem' }}>
                  {r.text}
                </span>
              </label>
              <button
                onClick={() => deleteReminder(r.id)}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
                title="Usuń"
              >
                &times;
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}