import React from 'react';

const initials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();

const BarberAvatar = ({ barber, size = 48, className = '' }) => (
  <span className={`barber-avatar ${className}`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
    {barber?.photo ? <img src={barber.photo} alt={barber.name} /> : initials(barber?.name)}
  </span>
);

export default BarberAvatar;
