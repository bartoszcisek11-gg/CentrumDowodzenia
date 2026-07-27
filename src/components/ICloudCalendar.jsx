import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import ICAL from 'ical.js';
import 'react-calendar/dist/Calendar.css';

export default function ICloudCalendar() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const [customEvents, setCustomEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('icloud_custom_events');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newIsAllDay, setNewIsAllDay] = useState(false);
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('10:00');
  const [newDescription, setNewDescription] = useState('');

  const [icalUrl, setIcalUrl] = useState(() => {
    return localStorage.getItem('icloud_ical_url') || '';
  });
  const [tempUrl, setTekpUrl] = useState(icalUrl);

  const fetchCalendar = async (url) => {
    if (!url) return;
    setLoading(true);
    try {
      const cleanUrl = url.replace(/^webcal:\/\//i, 'https://');
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`;

      const response = await fetch(proxyUrl);
      const data = await response.text();

      const jcalData = ICAL.parse(data);
      const comp = new ICAL.Component(jcalData);
      const vevents = comp.getAllSubcomponents('vevent');

      const parsedEvents = vevents.map(vevent => {
        const event = new ICAL.Event(vevent);
        return {
          id: 'ical-' + Math.random().toString(36).substr(2, 9),
          title: event.summary,
          startDate: event.startDate.toJSDate(),
          endDate: event.endDate.toJSDate(),
          isAllDay: event.startDate.isDate,
          isCustom: false
        };
      });

      setEvents(parsedEvents);
    } catch (err) {
      console.error('Błąd pobierania kalendarza iCloud:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (icalUrl) {
      fetchCalendar(icalUrl);
    }
  }, [icalUrl]);

  useEffect(() => {
    const handleKeyDownEsc = (e) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && isAddOpen) {
        e.stopPropagation();
        setIsAddOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDownEsc, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDownEsc, true);
    };
  }, [isAddOpen]);

  const saveUrl = () => {
    localStorage.setItem('icloud_ical_url', tempUrl);
    setIcalUrl(tempUrl);
  };

  const saveCustomEventsToStorage = (updated) => {
    setCustomEvents(updated);
    localStorage.setItem('icloud_custom_events', JSON.stringify(updated));
  };

  const formatLocalDate = (dateObj) => {
    const pad = n => String(n).padStart(2, '0');
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;
  };

  const openAddModal = () => {
    setNewDate(formatLocalDate(selectedDate));
    setNewTitle('');
    setNewIsAllDay(false);
    setNewStartTime('09:00');
    setNewEndTime('10:00');
    setNewDescription('');
    setIsAddOpen(true);
  };

  const downloadIcsFile = (event) => {
    const pad = num => String(num).padStart(2, '0');
    const startDateObj = new Date(event.startDate);
    const endDateObj = new Date(event.endDate);

    const formatDateToIcs = (dateObj, isTimeIncluded = true) => {
      const year = dateObj.getFullYear();
      const month = pad(dateObj.getMonth() + 1);
      const day = pad(dateObj.getDate());
      if (!isTimeIncluded) {
        return `${year}${month}${day}`;
      }
      const hours = pad(dateObj.getHours());
      const mins = pad(dateObj.getMinutes());
      const secs = pad(dateObj.getSeconds());
      return `${year}${month}${day}T${hours}${mins}${secs}`;
    };

    const startStr = formatDateToIcs(startDateObj, !event.isAllDay);
    let endStr = '';
    if (event.isAllDay) {
      const nextDay = new Date(startDateObj);
      nextDay.setDate(nextDay.getDate() + 1);
      endStr = formatDateToIcs(nextDay, false);
    } else {
      endStr = formatDateToIcs(endDateObj, true);
    }

    const dtStartLine = event.isAllDay
      ? `DTSTART;VALUE=DATE:${startStr}`
      : `DTSTART:${startStr}`;
    const dtEndLine = event.isAllDay
      ? `DTEND;VALUE=DATE:${endStr}`
      : `DTEND:${endStr}`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Centrum Dowodzenia//Kalendarz//PL',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id || Date.now()}@centrum-dowodzenia`,
      `DTSTAMP:${formatDateToIcs(new Date(), true)}`,
      dtStartLine,
      dtEndLine,
      `SUMMARY:${event.title || 'Nowe wydarzenie'}`,
      event.description ? `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${(event.title || 'wydarzenie').toLowerCase().replace(/[^a-z0-9]/gi, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddEventSubmit = (exportIcs = false) => {
    if (!newTitle.trim()) {
      alert('Wprowadź tytuł wydarzenia!');
      return;
    }
    if (!newDate) {
      alert('Wybierz datę wydarzenia!');
      return;
    }

    const [year, month, day] = newDate.split('-').map(Number);
    let startD, endD;

    if (newIsAllDay) {
      startD = new Date(year, month - 1, day, 0, 0, 0);
      endD = new Date(year, month - 1, day, 23, 59, 59);
    } else {
      const [sH, sM] = newStartTime.split(':').map(Number);
      const [eH, eM] = newEndTime.split(':').map(Number);
      startD = new Date(year, month - 1, day, sH || 0, sM || 0, 0);
      endD = new Date(year, month - 1, day, eH || 0, eM || 0, 0);
    }

    const newEv = {
      id: 'custom-' + Date.now(),
      title: newTitle.trim(),
      startDate: startD.toISOString(),
      endDate: endD.toISOString(),
      isAllDay: newIsAllDay,
      description: newDescription.trim(),
      isCustom: true
    };

    const updated = [...customEvents, newEv];
    saveCustomEventsToStorage(updated);

    if (exportIcs) {
      downloadIcsFile({
        ...newEv,
        startDate: startD,
        endDate: endD
      });
    }

    setIsAddOpen(false);
  };

  const deleteCustomEvent = (idToDelete) => {
    if (window.confirm('Czy na pewno chcesz usunąć to wydarzenie?')) {
      const updated = customEvents.filter(ev => ev.id !== idToDelete);
      saveCustomEventsToStorage(updated);
    }
  };

  // Łączymy wydarzenia z subskrypcji i wydarzenia własne
  const parsedCustomEvents = customEvents.map(ev => ({
    ...ev,
    startDate: new Date(ev.startDate),
    endDate: new Date(ev.endDate)
  }));

  const allCombinedEvents = [...events, ...parsedCustomEvents];

  // Pomocnicza funkcja sprawdzająca czy dany dzień wpada w zakres wydarzenia
  const isDateInEvent = (targetDate, event) => {
    const day = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const start = new Date(event.startDate.getFullYear(), event.startDate.getMonth(), event.startDate.getDate());
    let end = new Date(event.endDate.getFullYear(), event.endDate.getMonth(), event.endDate.getDate());

    if (event.endDate > event.startDate && event.endDate.getHours() === 0 && event.endDate.getMinutes() === 0) {
      end.setDate(end.getDate() - 1);
    }

    return day >= start && day <= end;
  };

  // Wydarzenia dla wybranego dnia
  const selectedDayEvents = allCombinedEvents.filter(ev => isDateInEvent(selectedDate, ev));

  // Kropka w kalendarzu dla każdego dnia w zakresie wydarzenia
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const hasEvent = allCombinedEvents.some(ev => isDateInEvent(date, ev));
      return hasEvent ? <div className="calendar-event-dot"></div> : null;
    }
  };

  return (
    <div className="card icloud-calendar-card" style={{ marginTop: 0, height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          📅 Kalendarz iCloud {loading && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Synchronizacja...)</span>}
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={openAddModal} className="btn-save">
            ➕ Dodaj wydarzenie
          </button>
          {icalUrl && (
            <button onClick={() => fetchCalendar(icalUrl)} className="btn-global-io">
              🔄 Odśwież
            </button>
          )}
        </div>
      </div>

      {isAddOpen && (
        <div style={{
          background: 'var(--bg-color)',
          border: '1px solid var(--primary)',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: 'var(--primary)' }}>➕ Nowe wydarzenie do kalendarza</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tytuł wydarzenia *</label>
              <input 
                type="text" 
                placeholder="np. Dyżur / Wizyta / Spotkanie" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Data *</label>
              <input 
                type="date" 
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <input 
              type="checkbox" 
              id="cb-allday" 
              checked={newIsAllDay} 
              onChange={e => setNewIsAllDay(e.target.checked)} 
            />
            <label htmlFor="cb-allday" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Cały dzień</label>
          </div>

          {!newIsAllDay && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Godzina od</label>
                <input 
                  type="time" 
                  value={newStartTime} 
                  onChange={e => setNewStartTime(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Godzina do</label>
                <input 
                  type="time" 
                  value={newEndTime} 
                  onChange={e => setNewEndTime(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)' }}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Opis / Uwagi (opcjonalnie)</label>
            <textarea 
              rows="2" 
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Dodatkowe informacje..."
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={() => setIsAddOpen(false)} 
              className="btn-global-io"
            >
              Anuluj
            </button>
            <button 
              type="button" 
              onClick={() => handleAddEventSubmit(false)} 
              className="btn-save"
            >
              💾 Zapisz w aplikacji
            </button>
            <button 
              type="button" 
              onClick={() => handleAddEventSubmit(true)} 
              className="btn-save"
              style={{ background: '#34c759' }}
              title="Zapisuje wydarzenie oraz pobiera plik .ics, który po stuknięciu na iPad/iPhone od razu dodaje wydarzenie do Kalendarza Apple iCloud"
            >
              📲 Dodaj do Kalendarza Apple (.ics)
            </button>
          </div>
        </div>
      )}

      {!icalUrl && (
        <div style={{ padding: '12px', background: 'var(--bg-color)', borderRadius: '8px', marginBottom: '12px' }}>
          <p style={{ fontSize: '0.85rem', marginBottom: '8px', color: 'var(--text-muted)' }}>
            💡 Opcjonalnie wklej publiczny link URL kalendarza iCloud (zaczynający się od <code>https://...</code> lub <code>webcal://...</code>), aby pobierać synchronizowane wydarzenia z chmury:
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="https://pX-caldav.icloud.com/published/2/..." 
              value={tempUrl} 
              onChange={(e) => setTekpUrl(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text)', fontSize: '0.85rem' }}
            />
            <button onClick={saveUrl} className="btn-save" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>Zapisz link</button>
          </div>
        </div>
      )}

      <div className="calendar-grid-wrapper">
        <div className="calendar-container">
          <Calendar 
            onChange={setSelectedDate} 
            value={selectedDate} 
            tileContent={tileContent}
            locale="pl-PL"
          />
        </div>

        <div className="calendar-events-list">
          <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Wydarzenia na dzień: {selectedDate.toLocaleDateString('pl-PL')}</span>
          </h4>
          {selectedDayEvents.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Brak zaplanowanych wydarzeń.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {selectedDayEvents.map((ev) => (
                <li key={ev.id} className="history-item" style={{ marginBottom: '8px', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong>{ev.title}</strong>
                      {ev.isCustom && (
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#0a84ff33', color: '#0a84ff', borderRadius: '4px', border: '1px solid #0a84ff66' }}>
                          ✏️ Własne
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button 
                        type="button"
                        onClick={() => downloadIcsFile(ev)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                        title="Eksportuj / Pobierz plik .ics do Apple Calendar"
                      >
                        📲
                      </button>
                      {ev.isCustom && (
                        <button 
                          type="button"
                          onClick={() => deleteCustomEvent(ev.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--danger)' }}
                          title="Usuń wydarzenie"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {ev.isAllDay 
                      ? 'Cały dzień' 
                      : `${ev.startDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })} - ${ev.endDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`}
                  </span>

                  {ev.description && (
                    <span style={{ fontSize: '0.8rem', color: '#a0aec0', fontStyle: 'italic', marginTop: '2px' }}>
                      {ev.description}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {icalUrl && (
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button 
                onClick={() => { setIcalUrl(''); localStorage.removeItem('icloud_ical_url'); }} 
                style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Zmień URL kalendarza
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
