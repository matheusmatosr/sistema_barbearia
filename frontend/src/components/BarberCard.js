import React from 'react';
import { Link } from 'react-router-dom';
import BarberAvatar from './BarberAvatar';

const BarberCard = ({ barber, to }) => {
  const since = barber.hireDate ? new Date(barber.hireDate).getFullYear() : null;
  const content = (
    <>
      <div className="barber-photo">
        {barber.photo ? <img src={barber.photo} alt={barber.name} /> : <BarberAvatar barber={barber} size={96} />}
      </div>
      <div className="barber-card-body">
        <h3>{barber.name}</h3>
        <p>{since ? `Na casa desde ${since}` : 'Barbeiro'}</p>
        {to && <span className="barber-card-cta">Agendar com {barber.name.split(' ')[0]} <span aria-hidden="true">→</span></span>}
      </div>
    </>
  );

  return to
    ? <Link to={to} className="barber-card is-link">{content}</Link>
    : <article className="barber-card">{content}</article>;
};

export default BarberCard;
