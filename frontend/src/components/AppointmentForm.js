import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchAvailability, fetchAppointments, createAppointment, rescheduleAppointment } from '../services/api';
import { useShop } from '../context/ShopContext';
import ServiceCard, { formatPrice } from './ServiceCard';
import BarberAvatar from './BarberAvatar';
import Calendar, { startOfDay } from './Calendar';

const BOOKING_WINDOW_DAYS = 60;

const buildSlots = (day, schedule) => {
  const slots = [];
  for (let minutes = schedule.openHour * 60; minutes + schedule.slotMinutes <= schedule.closeHour * 60; minutes += schedule.slotMinutes) {
    const slot = new Date(day);
    slot.setHours(0, minutes, 0, 0);
    slots.push(slot);
  }
  return slots;
};

const formatTime = (date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const AppointmentForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { routeShop: shop } = useShop();
  const catalog = { services: shop.services, schedule: shop.schedule };
  const { barbers } = shop;
  const [service, setService] = useState(null);
  const [barber, setBarber] = useState(null);
  const [day, setDay] = useState(null);
  const [slot, setSlot] = useState(null);
  const [booked, setBooked] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [editing, setEditing] = useState(null);

  const today = useMemo(() => startOfDay(new Date()), []);
  const maxDate = useMemo(() => new Date(today.getFullYear(), today.getMonth(), today.getDate() + BOOKING_WINDOW_DAYS), [today]);
  const { schedule } = catalog;

  useEffect(() => {
    const editId = searchParams.get('edit');
    Promise.resolve(editId ? fetchAppointments() : [])
      .then(appointments => {
        const current = appointments.find(item => String(item.id) === editId && item.status === 'Agendado' && item.barbershopId === shop.id);
        if (editId && !current) {
          setMessage({ type: 'danger', text: 'Este agendamento não pode mais ser alterado.' });
          return;
        }
        if (current) {
          setEditing(current);
          setService(shop.services.find(item => item.name === current.specialty) || null);
          setBarber(shop.barbers.find(item => item.id === current.barberId) || null);
          setDay(startOfDay(new Date(current.date)));
          return;
        }
        setEditing(null);
        setDay(null);
        setService(shop.services.find(item => item.id === searchParams.get('service')) || null);
        setBarber(shop.barbers.find(item => String(item.id) === searchParams.get('barber')) || null);
      })
      .catch(() => setMessage({ type: 'danger', text: 'Não foi possível carregar o agendamento. Tente novamente.' }));
  }, [searchParams, shop]);

  const loadAvailability = useCallback(async () => {
    if (!barber || !day) return;
    setLoadingSlots(true);
    try {
      const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
      const dates = await fetchAvailability({ barberId: barber.id, start: day.toISOString(), end: end.toISOString(), exclude: editing?.id });
      setBooked(dates.map(date => new Date(date).getTime()));
    } catch (error) {
      setMessage({ type: 'danger', text: 'Não foi possível consultar os horários deste dia.' });
    } finally {
      setLoadingSlots(false);
    }
  }, [barber, day, editing]);

  useEffect(() => {
    setSlot(null);
    loadAvailability();
  }, [loadAvailability]);

  const slots = useMemo(() => {
    if (!day || !schedule) return [];
    const now = Date.now();
    const slotMs = schedule.slotMinutes * 60 * 1000;
    return buildSlots(day, schedule).map(date => ({
      date,
      available: date.getTime() > now && !booked.some(time => Math.abs(time - date.getTime()) < slotMs),
    }));
  }, [day, schedule, booked]);

  const isClosedDay = useCallback((date) => (schedule?.closedWeekdays || []).includes(date.getDay()), [schedule]);
  const freeSlots = slots.filter(item => item.available).length;

  const handleSubmit = async () => {
    setMessage({ type: '', text: '' });
    setSubmitting(true);
    try {
      const payload = { barberId: barber.id, specialty: service.name, date: slot.toISOString() };
      if (editing) await rescheduleAppointment(editing.id, payload);
      else await createAppointment(payload);
      setMessage({ type: 'success', text: `${editing ? 'Horário alterado' : 'Agendamento confirmado'}! Redirecionando para seus horários…` });
      setTimeout(() => navigate('/view-appointments'), 1100);
    } catch (error) {
      setMessage({ type: 'danger', text: error.response?.data?.error || 'Não foi possível criar o agendamento.' });
      setSlot(null);
      loadAvailability();
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-layout">
      <div className="booking-steps">
        <section className="booking-step">
          <div className="step-heading"><span>01</span><div><h2>Escolha o serviço</h2><p>Todos os profissionais realizam o menu completo.</p></div></div>
          <div className="service-grid is-compact">
            {catalog.services.map(item => (
              <ServiceCard key={item.id} service={item} duration={schedule?.slotMinutes} selected={service?.id === item.id} onSelect={setService} />
            ))}
          </div>
        </section>

        <section className="booking-step">
          <div className="step-heading"><span>02</span><div><h2>Escolha o profissional</h2><p>Veja quem vai cuidar do seu visual.</p></div></div>
          <div className="barber-options">
            {barbers.map(item => (
              <button key={item.id} type="button" className={`barber-option${barber?.id === item.id ? ' is-selected' : ''}`} onClick={() => setBarber(item)} aria-pressed={barber?.id === item.id}>
                <BarberAvatar barber={item} size={64} />
                <strong>{item.name}</strong>
              </button>
            ))}
            {!barbers.length && <p className="table-empty">Nenhum profissional disponível no momento.</p>}
          </div>
        </section>

        <section className="booking-step">
          <div className="step-heading"><span>03</span><div><h2>Data e horário</h2><p>Atendimentos de {schedule?.slotMinutes || 30} minutos, das {String(schedule?.openHour ?? 8).padStart(2, '0')}h às {schedule?.closeHour ?? 18}h.</p></div></div>
          <div className="schedule-picker">
            <Calendar value={day} onChange={setDay} minDate={today} maxDate={maxDate} isDisabled={isClosedDay} />
            <div className="slot-panel">
              {!barber || !day ? (
                <p className="slot-hint">{!barber ? 'Selecione um profissional para ver os horários.' : 'Selecione um dia no calendário.'}</p>
              ) : loadingSlots ? (
                <div className="slot-hint"><Spinner animation="border" size="sm" /> Consultando agenda…</div>
              ) : (
                <>
                  <p className="slot-title">{day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} · {freeSlots} {freeSlots === 1 ? 'horário livre' : 'horários livres'}</p>
                  <div className="slot-grid">
                    {slots.map(item => (
                      <button
                        key={item.date.getTime()}
                        type="button"
                        className={`slot${slot?.getTime() === item.date.getTime() ? ' is-selected' : ''}`}
                        disabled={!item.available}
                        onClick={() => setSlot(item.date)}
                      >
                        {formatTime(item.date)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      <aside className="booking-summary">
        <span className="eyebrow">RESUMO</span>
        <h2>{editing ? 'Alterar horário' : 'Seu horário'}</h2>
        {editing && <p className="summary-current">Horário atual: <strong>{new Date(editing.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</strong> · {editing.specialty}</p>}
        <dl>
          <div><dt>Serviço</dt><dd>{service?.name || '—'}</dd></div>
          <div><dt>Profissional</dt><dd>{barber?.name || '—'}</dd></div>
          <div><dt>Data</dt><dd>{day ? day.toLocaleDateString('pt-BR') : '—'}</dd></div>
          <div><dt>Horário</dt><dd>{slot ? `${formatTime(slot)} – ${formatTime(new Date(slot.getTime() + (schedule?.slotMinutes || 30) * 60000))}` : '—'}</dd></div>
        </dl>
        <div className="summary-total"><span>Total</span><strong>{service ? formatPrice(service.price) : '—'}</strong></div>
        {message.text && <Alert variant={message.type}>{message.text}</Alert>}
        <Button className="w-100" onClick={handleSubmit} disabled={!service || !barber || !slot || submitting}>
          {submitting ? 'Salvando…' : editing ? 'Salvar novo horário' : 'Confirmar agendamento'}
        </Button>
        <small>Alterações e cancelamentos com até 2 horas de antecedência.</small>
      </aside>
    </div>
  );
};

export default AppointmentForm;
