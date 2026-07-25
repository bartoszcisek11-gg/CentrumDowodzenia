import React, { useState, useRef } from 'react';
import ICloudCalendar from './ICloudCalendar';
import Reminders from './Reminders';

const GoogleDriveLogo = (
  <svg width="40" height="40" viewBox="-10 -10 120 107" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path fill="#00AC47" d="M0 57.74 L33.33 0 L50 28.87 L16.67 86.6 Z" />
    <path fill="#FFBA00" d="M33.33 0 L66.67 0 L100 57.74 L66.67 57.74 Z" />
    <path fill="#2684FC" d="M16.67 86.6 L83.33 86.6 L100 57.74 L33.33 57.74 Z" />
  </svg>
);

const GmailLogo = (
  <svg width="40" height="40" viewBox="0 0 512 512" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M34.9 448h81.5V250.2L0 163v250.2C0 432.5 15.7 448 34.9 448" fill="#4285f4"/>
    <path d="M395.6 448h81.5c19.3 0 34.9-15.7 34.9-34.9V163l-116.4 87.3" fill="#34a853"/>
    <path d="M395.6 99v151.3L512 163v-46.5c0-43.2-49.3-67.8-83.8-41.9" fill="#fbbc04"/>
    <path d="M116.4 250.2V99L256 203.7 395.6 99v151.3L256 355" fill="#ea4335"/>
    <path d="M0 116.4V163l116.4 87.3V99L83.8 74.5C49.2 48.6 0 73.2 0 116.4" fill="#c5221f"/>
  </svg>
);

const DEFAULT_TILES = [
  { id: 'app-1', title: 'OrtoBaza', icon: '🦴' },
  { id: 'app-2', title: 'Kalkulator Stażu Podyplomowego', icon: '🩺' },
  { id: 'app-3', title: 'Finanse', icon: '💳' },
  { id: 'app-4', title: 'Praca - COM Jarosław', icon: '🏥' },
  { id: 'app-5', title: 'Google Drive', icon: GoogleDriveLogo, url: 'https://drive.google.com/drive/my-drive' },
  { id: 'app-6', title: 'Gmail', icon: GmailLogo, url: 'https://gmail.com/' }
];

function ResizableWidget({
  id,
  title,
  icon,
  children,
  onSectionDragStart,
  onSectionDragOver,
  onSectionDragLeave,
  onSectionDrop,
  onSectionDragEnd,
  isSectionDragging,
  isSectionDragOver,
  defaultWidth = '100%',
  defaultHeight = 'auto',
  minWidth = 280,
  minHeight = 200,
  storageKey,
  allowResize = true
}) {
  const [size, setSize] = useState(() => {
    if (!storageKey) return { width: defaultWidth, height: defaultHeight };
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { width: defaultWidth, height: defaultHeight };
  });

  const widgetRef = useRef(null);

  const saveSize = (newSize) => {
    setSize(newSize);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(newSize));
    }
  };

  const handleResizeStart = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX || (e.touches && e.touches[0].clientX);
    const startY = e.clientY || (e.touches && e.touches[0].clientY);
    const startWidth = widgetRef.current ? widgetRef.current.offsetWidth : 350;
    const startHeight = widgetRef.current ? widgetRef.current.offsetHeight : 350;

    const onMove = (moveEvent) => {
      const currentX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0].clientX);
      const currentY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0].clientY);

      let newWidth = size.width;
      let newHeight = size.height;

      if (direction === 'right' || direction === 'corner') {
        const parentWidth = widgetRef.current?.parentElement?.offsetWidth || window.innerWidth;
        const calcWidth = startWidth + (currentX - startX);
        newWidth = Math.max(minWidth, Math.min(parentWidth, calcWidth));
      }

      if (direction === 'bottom' || direction === 'corner') {
        const calcHeight = startHeight + (currentY - startY);
        newHeight = Math.max(minHeight, calcHeight);
      }

      setSize({ width: newWidth, height: newHeight });
    };

    const onEnd = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);

      if (widgetRef.current) {
        saveSize({
          width: widgetRef.current.offsetWidth,
          height: widgetRef.current.offsetHeight
        });
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

  const resetSize = () => {
    const def = { width: defaultWidth, height: defaultHeight };
    setSize(def);
    if (storageKey) localStorage.removeItem(storageKey);
  };

  const isCustomized = typeof size.width === 'number' || typeof size.height === 'number';

  const style = {
    width: typeof size.width === 'number' ? `${size.width}px` : size.width,
    height: typeof size.height === 'number' ? `${size.height}px` : size.height,
    flex: typeof size.width === 'number' ? `0 0 ${size.width}px` : (defaultWidth === '100%' ? '1 1 100%' : '1 1 320px'),
    maxWidth: '100%',
  };

  return (
    <div
      ref={widgetRef}
      className={`dashboard-widget-card ${isSectionDragging ? 'section-dragging' : ''} ${isSectionDragOver ? 'drag-over' : ''}`}
      style={style}
      onDragOver={(e) => onSectionDragOver(e, id)}
      onDragLeave={(e) => onSectionDragLeave(e, id)}
      onDrop={(e) => onSectionDrop(e, id)}
    >
      <div className="widget-header-bar">
        <div
          className="widget-drag-handle"
          draggable
          onDragStart={(e) => onSectionDragStart(e, id)}
          onDragEnd={onSectionDragEnd}
          title="Przeciągnij uchwyt, aby zmienić kolejność tej sekcji"
        >
          <span className="drag-dots">⋮⋮</span>
          <span className="widget-icon">{icon}</span>
          <span className="widget-title-text">{title}</span>
        </div>

        {isCustomized && allowResize && (
          <button
            type="button"
            className="btn-reset-size"
            onClick={resetSize}
            title="Przywróć domyślny rozmiar sekcji"
          >
            ↺ Reset rozmiaru
          </button>
        )}
      </div>

      <div className="widget-content-body">
        {children}
      </div>

      {allowResize && (
        <>
          <div
            className="resize-handle resize-handle-right"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
            onTouchStart={(e) => handleResizeStart(e, 'right')}
            title="Przeciągnij krawędź, aby zmienić szerokość"
          />
          <div
            className="resize-handle resize-handle-bottom"
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
            onTouchStart={(e) => handleResizeStart(e, 'bottom')}
            title="Przeciągnij krawędź, aby zmienić wysokość"
          />
          <div
            className="resize-handle resize-handle-corner"
            onMouseDown={(e) => handleResizeStart(e, 'corner')}
            onTouchStart={(e) => handleResizeStart(e, 'corner')}
            title="Przeciągnij narożnik, aby zmienić szerokość i wysokość"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M10 2L2 10M10 6L6 10M10 10L10 10" stroke="#00f2ff" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </>
      )}
    </div>
  );
}

export default function MainDashboard({ onOpenApp }) {
  // Przechowywanie kolejności głównych sekcji (Kafelki, Kalendarz, Przypomnienia)
  const [sectionsOrder, setSectionsOrder] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('dashboard_sections_order'));
    if (saved && Array.isArray(saved) && saved.length > 0) {
      const allowed = ['tiles', 'calendar', 'reminders'];
      const filtered = saved.filter(s => allowed.includes(s));
      allowed.forEach(s => { if (!filtered.includes(s)) filtered.push(s); });
      return filtered;
    }
    return ['tiles', 'calendar', 'reminders'];
  });

  const [draggedSection, setDraggedSection] = useState(null);
  const [dragOverSection, setDragOverSection] = useState(null);

  const handleSectionDragStart = (e, sectionId) => {
    e.stopPropagation();
    setDraggedSection(sectionId);
    e.dataTransfer.setData('text/section-id', sectionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSectionDragOver = (e, sectionId) => {
    e.preventDefault();
    if (draggedSection && draggedSection !== sectionId) {
      setDragOverSection(sectionId);
    }
  };

  const handleSectionDragLeave = (e, sectionId) => {
    e.preventDefault();
    if (dragOverSection === sectionId) {
      setDragOverSection(null);
    }
  };

  const handleSectionDrop = (e, targetSectionId) => {
    e.preventDefault();
    const sourceSectionId = e.dataTransfer.getData('text/section-id') || draggedSection;

    if (!sourceSectionId || sourceSectionId === targetSectionId) {
      setDraggedSection(null);
      setDragOverSection(null);
      return;
    }

    const updated = [...sectionsOrder];
    const sourceIdx = updated.indexOf(sourceSectionId);
    const targetIdx = updated.indexOf(targetSectionId);

    if (sourceIdx !== -1 && targetIdx !== -1) {
      updated.splice(sourceIdx, 1);
      updated.splice(targetIdx, 0, sourceSectionId);
      setSectionsOrder(updated);
      localStorage.setItem('dashboard_sections_order', JSON.stringify(updated));
    }

    setDraggedSection(null);
    setDragOverSection(null);
  };

  const handleSectionDragEnd = () => {
    setDraggedSection(null);
    setDragOverSection(null);
  };

  // STAN I OBSŁUGA KAFELKÓW (TILES GRID)
  const [slotMap, setSlotMap] = useState(() => {
    const savedSlots = JSON.parse(localStorage.getItem('dashboard_slots_map'));
    const tileMap = {};
    DEFAULT_TILES.forEach(t => { tileMap[t.id] = t; });

    if (savedSlots && typeof savedSlots === 'object' && !Array.isArray(savedSlots)) {
      const map = {};
      const presentTileIds = new Set();
      Object.keys(savedSlots).forEach(slotIdxStr => {
        const slotIdx = parseInt(slotIdxStr, 10);
        const tileId = savedSlots[slotIdxStr];
        if (tileMap[tileId]) {
          map[slotIdx] = tileMap[tileId];
          presentTileIds.add(tileId);
        }
      });
      DEFAULT_TILES.forEach(t => {
        if (!presentTileIds.has(t.id)) {
          let freeIdx = 0;
          while (map[freeIdx]) freeIdx++;
          map[freeIdx] = t;
        }
      });
      return map;
    }

    const savedOrder = JSON.parse(localStorage.getItem('dashboard_tiles_order'));
    if (savedOrder && Array.isArray(savedOrder) && savedOrder.length > 0) {
      const map = {};
      let idx = 0;
      savedOrder.forEach(id => {
        if (tileMap[id]) {
          map[idx] = tileMap[id];
          idx++;
        }
      });
      DEFAULT_TILES.forEach(t => {
        if (!Object.values(map).find(m => m.id === t.id)) {
          map[idx] = t;
          idx++;
        }
      });
      return map;
    }

    const map = {};
    DEFAULT_TILES.forEach((t, i) => {
      map[i] = t;
    });
    return map;
  });

  const [draggedSlot, setDraggedSlot] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);

  const saveSlotsMap = (newMap) => {
    setSlotMap(newMap);
    const plainMap = {};
    Object.keys(newMap).forEach(k => {
      if (newMap[k]) {
        plainMap[k] = newMap[k].id;
      }
    });
    localStorage.setItem('dashboard_slots_map', JSON.stringify(plainMap));
  };

  const handleTileDragStart = (e, slotIdx) => {
    e.stopPropagation();
    setDraggedSlot(slotIdx);
    e.dataTransfer.setData('text/tile-slot', String(slotIdx));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTileDragOver = (e, slotIdx) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlot !== slotIdx) {
      setDragOverSlot(slotIdx);
    }
  };

  const handleTileDragLeave = (e, slotIdx) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverSlot === slotIdx) {
      setDragOverSlot(null);
    }
  };

  const handleTileDrop = (e, targetSlotIdx) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceSlotIdxStr = e.dataTransfer.getData('text/tile-slot');
    const sourceSlotIdx = sourceSlotIdxStr !== '' ? parseInt(sourceSlotIdxStr, 10) : draggedSlot;

    if (sourceSlotIdx === null || isNaN(sourceSlotIdx) || sourceSlotIdx === targetSlotIdx) {
      setDraggedSlot(null);
      setDragOverSlot(null);
      return;
    }

    const updated = { ...slotMap };
    const sourceTile = updated[sourceSlotIdx];
    const targetTile = updated[targetSlotIdx];

    if (sourceTile) {
      updated[targetSlotIdx] = sourceTile;
      if (targetTile) {
        updated[sourceSlotIdx] = targetTile;
      } else {
        delete updated[sourceSlotIdx];
      }
      saveSlotsMap(updated);
    }

    setDraggedSlot(null);
    setDragOverSlot(null);
  };

  const handleTileDragEnd = () => {
    setDraggedSlot(null);
    setDragOverSlot(null);
  };

  const occupiedIndices = Object.keys(slotMap).map(Number);
  const maxOccupiedSlot = occupiedIndices.length > 0 ? Math.max(...occupiedIndices) : -1;
  const isTileDragging = draggedSlot !== null;

  const totalSlotsCount = isTileDragging
    ? Math.max(12, Math.ceil((maxOccupiedSlot + 5) / 4) * 4)
    : (maxOccupiedSlot >= 0 ? maxOccupiedSlot + 1 : 0);

  const slots = Array.from({ length: totalSlotsCount }, (_, i) => i);

  // Render poszczególnych sekcji
  const renderSection = (sectionId) => {
    if (sectionId === 'tiles') {
      return (
        <ResizableWidget
          key="section-tiles"
          id="tiles"
          title="Aplikacje"
          icon="📱"
          onSectionDragStart={handleSectionDragStart}
          onSectionDragOver={handleSectionDragOver}
          onSectionDragLeave={handleSectionDragLeave}
          onSectionDrop={handleSectionDrop}
          onSectionDragEnd={handleSectionDragEnd}
          isSectionDragging={draggedSection === 'tiles'}
          isSectionDragOver={dragOverSection === 'tiles'}
          defaultWidth="100%"
          defaultHeight="auto"
          allowResize={false}
        >
          <div className={`dashboard-grid ${isTileDragging ? 'is-dragging' : ''}`} id="main-menu">
            {slots.map((slotIdx) => {
              const tile = slotMap[slotIdx];
              const isDraggingThis = draggedSlot === slotIdx;
              const isDragOverThis = dragOverSlot === slotIdx;

              if (tile) {
                return (
                  <div
                    key={`slot-tile-${slotIdx}-${tile.id}`}
                    className={`tile ${isDraggingThis ? 'dragging' : ''} ${isDragOverThis ? 'drag-over' : ''}`}
                    draggable
                    onDragStart={(e) => handleTileDragStart(e, slotIdx)}
                    onDragOver={(e) => handleTileDragOver(e, slotIdx)}
                    onDragLeave={(e) => handleTileDragLeave(e, slotIdx)}
                    onDrop={(e) => handleTileDrop(e, slotIdx)}
                    onDragEnd={handleTileDragEnd}
                    onClick={() => {
                      if (tile.id === 'app-5' || tile.url?.includes('drive.google.com')) {
                        window.open('https://drive.google.com/drive/my-drive', '_blank', 'noopener,noreferrer');
                      } else if (tile.id === 'app-6' || tile.url?.includes('gmail.com')) {
                        window.open('https://gmail.com/', '_blank', 'noopener,noreferrer');
                      } else if (tile.url) {
                        window.open(tile.url, '_blank', 'noopener,noreferrer');
                      } else {
                        onOpenApp(tile.id, tile.title);
                      }
                    }}
                  >
                    <div className="tile-icon">{tile.icon}</div>
                    <div className="tile-title">{tile.title}</div>
                  </div>
                );
              }

              return (
                <div
                  key={`slot-empty-${slotIdx}`}
                  className={`tile-slot-empty ${isTileDragging ? 'drag-active' : 'idle-empty'} ${isDragOverThis ? 'drag-over' : ''}`}
                  onDragOver={(e) => handleTileDragOver(e, slotIdx)}
                  onDragLeave={(e) => handleTileDragLeave(e, slotIdx)}
                  onDrop={(e) => handleTileDrop(e, slotIdx)}
                >
                  {isTileDragging && <span className="empty-slot-plus">+</span>}
                </div>
              );
            })}
          </div>
        </ResizableWidget>
      );
    }

    if (sectionId === 'calendar') {
      return (
        <ResizableWidget
          key="section-calendar"
          id="calendar"
          title="Kalendarz iCloud"
          icon="📅"
          onSectionDragStart={handleSectionDragStart}
          onSectionDragOver={handleSectionDragOver}
          onSectionDragLeave={handleSectionDragLeave}
          onSectionDrop={handleSectionDrop}
          onSectionDragEnd={handleSectionDragEnd}
          isSectionDragging={draggedSection === 'calendar'}
          isSectionDragOver={dragOverSection === 'calendar'}
          defaultWidth="calc(66% - 0.75rem)"
          defaultHeight="480px"
          minWidth={300}
          minHeight={300}
          storageKey="dashboard_calendar_size"
          allowResize={true}
        >
          <ICloudCalendar />
        </ResizableWidget>
      );
    }

    if (sectionId === 'reminders') {
      return (
        <ResizableWidget
          key="section-reminders"
          id="reminders"
          title="Przypomnienia"
          icon="📌"
          onSectionDragStart={handleSectionDragStart}
          onSectionDragOver={handleSectionDragOver}
          onSectionDragLeave={handleSectionDragLeave}
          onSectionDrop={handleSectionDrop}
          onSectionDragEnd={handleSectionDragEnd}
          isSectionDragging={draggedSection === 'reminders'}
          isSectionDragOver={dragOverSection === 'reminders'}
          defaultWidth="calc(34% - 0.75rem)"
          defaultHeight="480px"
          minWidth={260}
          minHeight={250}
          storageKey="dashboard_reminders_size"
          allowResize={true}
        >
          <Reminders />
        </ResizableWidget>
      );
    }

    return null;
  };

  return (
    <div className="dashboard-sections-container">
      {sectionsOrder.map(sectionId => renderSection(sectionId))}
    </div>
  );
}
