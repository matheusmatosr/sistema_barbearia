import React from 'react';
import { Link } from 'react-router-dom';

export const formatPrice = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ServiceCard = ({ service, duration, selected, onSelect, to }) => {
  const content = (
    <>
      {service.image ? (
        <div className="service-image" style={{ backgroundImage: `url(${service.image})` }} role="img" aria-label={service.name} />
      ) : (
        <div className="service-image is-empty" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="34" height="34"><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M8.1 8.1 20 20M8.1 15.9 20 4" /></g></svg>
        </div>
      )}
      <div className="service-body">
        <div className="service-title">
          <h3>{service.name}</h3>
          <strong>{formatPrice(service.price)}</strong>
        </div>
        <p>{service.description}</p>
        <div className="service-meta">
          <span className="service-duration">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            {duration} min
          </span>
          {onSelect && <span className="service-check">{selected ? '✓ Selecionado' : 'Selecionar'}</span>}
        </div>
        {to && (
          <Link to={to} className="service-cta">
            Agendar este serviço
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Link>
        )}
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button type="button" className={`service-card is-selectable${selected ? ' is-selected' : ''}`} onClick={() => onSelect(service)} aria-pressed={selected}>
        {content}
      </button>
    );
  }
  return <article className="service-card">{content}</article>;
};

export default ServiceCard;
