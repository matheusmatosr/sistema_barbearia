import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AppointmentForm from '../components/AppointmentForm';

const BookAppointment = () => {
  const [searchParams] = useSearchParams();
  const isEditing = searchParams.has('edit');

  return (
    <main className="container booking-page">
      <header className="page-heading">
        <span className="eyebrow">{isEditing ? 'AJUSTE SEU HORÁRIO' : 'RESERVE SEU MOMENTO'}</span>
        <h1>{isEditing ? 'Alterar agendamento.' : 'Marque seu horário.'}</h1>
        <p>{isEditing ? 'Troque o serviço, o profissional ou escolha um novo horário livre na agenda.' : 'Escolha o serviço, o profissional e um horário livre na agenda. A gente cuida do resto.'}</p>
      </header>
      <AppointmentForm />
    </main>
  );
};

export default BookAppointment;
