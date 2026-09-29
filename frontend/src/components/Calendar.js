import React, { useEffect, useState } from 'react';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const sameDay = (a, b) => !!a && !!b && a.toDateString() === b.toDateString();

const Calendar = ({ value, onChange, minDate, maxDate, isDisabled = () => false }) => {
  const [month, setMonth] = useState(() => startOfMonth(value || minDate));
  const selectedTime = value?.getTime();

  // Mostra o mês do dia selecionado quando ele é definido de fora (ex.: ao editar um agendamento).
  useEffect(() => {
    if (selectedTime) setMonth(startOfMonth(new Date(selectedTime)));
  }, [selectedTime]);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [
    ...Array(month.getDay()).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)),
  ];
  const canGoBack = month > startOfMonth(minDate);
  const canGoForward = startOfMonth(maxDate) > month;
  const changeMonth = (offset) => setMonth(new Date(month.getFullYear(), month.getMonth() + offset, 1));

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button type="button" onClick={() => changeMonth(-1)} disabled={!canGoBack} aria-label="Mês anterior">‹</button>
        <strong>{month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong>
        <button type="button" onClick={() => changeMonth(1)} disabled={!canGoForward} aria-label="Próximo mês">›</button>
      </div>
      <div className="calendar-grid">
        {WEEKDAYS.map(day => <span key={day} className="calendar-weekday">{day}</span>)}
        {cells.map((day, index) => {
          if (!day) return <span key={`empty-${index}`} />;
          const disabled = day < startOfDay(minDate) || day > maxDate || isDisabled(day);
          return (
            <button
              key={day.toISOString()}
              type="button"
              className={`calendar-day${sameDay(day, value) ? ' is-selected' : ''}${sameDay(day, new Date()) ? ' is-today' : ''}`}
              disabled={disabled}
              onClick={() => onChange(day)}
              aria-pressed={sameDay(day, value)}
              aria-label={day.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
