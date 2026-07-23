import React, { useState } from 'react';
import ICloudCalendar from './ICloudCalendar';
import Reminders from './Reminders';

const DEFAULT_TILES = [
  { id: 'app-1', title: 'OrtoBaza', icon: '🦴' },
  { id: 'app-2', title: 'Kalkulator Stażu Podyplomowego', icon: '🩺' },
  { id: 'app-3', title: 'Finanse', icon: '💳' },
  { id: 'app-4', title: 'Praca - COM Jarosław', icon: '🏥' }
];

export default function MainDashboard({ onOpenApp }) {
  const [tiles, setTiles] = useState(() => {
    const savedOrder = JSON.parse(localStorage.getItem('dashboard_tiles_order'));
    if (savedOrder && savedOrder.length > 0) {
      const map = {};
      DEFAULT_TILES.forEach(t => { map[t.id] = t; });
      const ordered = savedOrder.map(id => map[id]).filter(Boolean);
      DEFAULT_TILES.forEach(t => {
        if (!ordered.find(o => o.id === t.id)) ordered.push(t);
      });
      return ordered;
    }
    return DEFAULT_TILES;
  });

  const [draggedIdx, setDraggedIdx] = useState(null);

  const saveOrder = (newTiles) => {
    setTiles(newTiles);
    localStorage.setItem('dashboard_tiles_order', JSON.stringify(newTiles.map(t => t.id)));
  };

  const handleDragStart = (idx) => setDraggedIdx(idx);

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    const updated = [...tiles];
    const [draggedItem] = updated.splice(draggedIdx, 1);
    updated.splice(idx, 0, draggedItem);
    setDraggedIdx(idx);
    saveOrder(updated);
  };

  return (
    <div>
      <div className="dashboard-grid" id="main-menu">
        {tiles.map((tile, idx) => (
          <div
            key={tile.id}
            className={`tile ${draggedIdx === idx ? 'dragging' : ''}`}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={() => setDraggedIdx(null)}
            onClick={() => onOpenApp(tile.id, tile.title)}
          >
            <div className="tile-icon">{tile.icon}</div>
            <div className="tile-title">{tile.title}</div>
          </div>
        ))}
      </div>

      {/* DOLNY PANEL: KALENDARZ (3/4) + PRZYPOMNIENIA (1/4) */}
      <div className="dashboard-bottom-section">
        <div className="calendar-wrapper">
          <ICloudCalendar />
        </div>
        <div className="card reminders-wrapper">
          <Reminders />
        </div>
      </div>
    </div>
  );
}