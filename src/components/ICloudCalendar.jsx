import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import ICAL from 'ical.js';
import 'react-calendar/dist/Calendar.css';

export default function ICloudCalendar() {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  
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
          title: event.summary,
          startDate: event.startDate.toJSDate(),
          endDate: event.endDate.toJSDate(),
          isAllDay: event.startDate.isDate
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

  const saveUrl = () => {
    localStorage.setItem('icloud_ical_url', tempUrl);
    setIcalUrl(tempUrl);
  };

  // Pomocnicza funkcja sprawdzająca czy dany dzień wpada w zakres wydarzenia
  const isDateInEvent = (targetDate, event) => {
    const day = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    const start = new Date(event.startDate.getFullYear(), event.startDate.getMonth(), event.startDate.getDate());
    
    let end = new Date(event.endDate.getFullYear(), event.endDate.getMonth(), event.endDate.getDate());

    // W plikach iCal wydarzenia całodniowe/wielodniowe kończą się o godzinie 00:00 kolejnego dnia.
    // Jeśli endDate ma czas 00:00:00 i trwa dłużej niż 1 dzień, odejmujemy 1 dzień do celów porównania.
    if (event.endDate > event.startDate && event.endDate.getHours() === 0 && event.endDate.getMinutes() === 0) {
      end.setDate(end.getDate() - 1);
    }

    return day >= start && day <= end;
  };

  // Wydarzenia dla wybranego dnia
  const selectedDayEvents = events.filter(ev => isDateInEvent(selectedDate, ev));

  // Zielona kropka w kalendarzu dla każdego dnia w zakresie wydarzenia
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const hasEvent = events.some(ev => isDateInEvent(date, ev));
      return hasEvent ? <div className="calendar-event-dot"></div> : null;
    }
  };

  return (
    <div className="card icloud-calendar-card" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          📅 Kalendarz iCloud {loading && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>(Synchronizacja...)</span>}
        </h3>
        {icalUrl && (
          <button onClick={() => fetchCalendar(icalUrl)} className="btn-global-io">
            🔄 Odśwież
          </button>
        )}
      </div>

      {!icalUrl ? (
        <div style={{ padding: '15px', background: 'var(--bg-color)', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
            Wklej publiczny link URL kalendarza iCloud (zaczynający się od <code>https://...</code> lub <code>webcal://...</code>):
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="https://pX-caldav.icloud.com/published/2/..." 
              value={tempUrl} 
              onChange={(e) => setTekpUrl(e.target.value)}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-color)', color: 'var(--text)' }}
            />
            <button onClick={saveUrl} className="btn-save">Zapisz link</button>
          </div>
        </div>
      ) : (
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
            <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
              Wydarzenia na dzień: {selectedDate.toLocaleDateString('pl-PL')}
            </h4>
            {selectedDayEvents.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Brak zaplanowanych wydarzeń.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {selectedDayEvents.map((ev, idx) => (
                  <li key={idx} className="history-item" style={{ marginBottom: '8px', cursor: 'default' }}>
                    <strong>{ev.title}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {ev.isAllDay 
                        ? 'Cały dzień' 
                        : `${ev.startDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })} - ${ev.endDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button 
                onClick={() => { setIcalUrl(''); localStorage.removeItem('icloud_ical_url'); }} 
                style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Zmień URL kalendarza
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}