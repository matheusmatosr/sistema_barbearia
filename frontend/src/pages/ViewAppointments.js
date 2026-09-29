import React, { useState, useEffect } from 'react';
import { Alert, Button, Form, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { fetchAppointments, deleteAppointment, updateAppointment } from '../services/api';
import { getCurrentUser } from '../services/authService';

const MIN_CHANGE_HOURS = 2;
const canChange = (appointment) => appointment.status === 'Agendado' && new Date(appointment.date) - Date.now() >= MIN_CHANGE_HOURS * 60 * 60 * 1000;

const ViewAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const user = getCurrentUser();
  const isBarber = user?.role === 'barber';

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const appointmentsData = await fetchAppointments();
        setAppointments(appointmentsData);
      } catch (requestError) {
        setError('Não foi possível carregar os agendamentos.');
      }
    };
    loadAppointments();
  }, []);

  const cancel = async (appointment) => {
    if (!window.confirm('Deseja cancelar este horário?')) return;
    try {
      await deleteAppointment(appointment.id);
      setAppointments(items => items.map(item => item.id === appointment.id ? { ...item, status: 'Cancelado' } : item));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível cancelar este horário.');
    }
  };

  const changeStatus = async (appointment, status) => {
    try {
      await updateAppointment(appointment.id, { status });
      setAppointments(items => items.map(item => item.id === appointment.id ? { ...item, status } : item));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível atualizar o status.');
    }
  };

  const clientActions = (appointment) => {
    if (appointment.status !== 'Agendado') return '—';
    if (!canChange(appointment)) return <small className="text-muted">Alterações até {MIN_CHANGE_HOURS}h antes</small>;
    return (
      <div className="table-actions">
        {appointment.Barbershop && <Button as={Link} to={`/b/${appointment.Barbershop.slug}/agendar?edit=${appointment.id}`} size="sm" variant="outline-dark">Editar</Button>}
        <Button size="sm" variant="outline-danger" onClick={() => cancel(appointment)}>Cancelar</Button>
      </div>
    );
  };

  return (
    <div className="container appointments-page">
      <header className="page-heading"><span className="eyebrow">{isBarber ? 'PAINEL DO PROFISSIONAL' : 'SUA CONTA'}</span><h1>{isBarber ? 'Minha agenda' : 'Meus horários'}</h1><p>{isBarber ? 'Acompanhe os clientes e atualize o andamento dos atendimentos.' : 'Seus próximos momentos na cadeira, organizados em um só lugar.'}</p></header>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      <div className="table-wrap">
        <Table responsive hover className="data-table">
          <thead>
            <tr>
              <th>Data</th>
              {!isBarber && <th>Barbearia</th>}
              <th>Barbeiro</th>
              <th>Serviço</th>
              {isBarber && <th>Cliente</th>}
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td><strong>{new Date(appointment.date).toLocaleDateString('pt-BR')}</strong><small>{new Date(appointment.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small></td>
                {!isBarber && <td>{appointment.Barbershop ? <Link to={`/b/${appointment.Barbershop.slug}`} className="table-link">{appointment.Barbershop.name}</Link> : '—'}</td>}
                <td>{appointment.Barber ? appointment.Barber.name : 'N/A'}</td>
                <td>{appointment.specialty || 'Serviço'}</td>
                {isBarber && <td>{appointment.Client?.name || 'Cliente'}</td>}
                <td><span className={`status-pill status-${appointment.status.toLowerCase().replaceAll(' ', '-')}`}>{appointment.status}</span></td>
                <td>{isBarber ? (
                  <Form.Select size="sm" aria-label="Atualizar status" value={appointment.status} onChange={event => changeStatus(appointment, event.target.value)} disabled={appointment.status === 'Cancelado'}>
                    <option>Agendado</option><option>Em atendimento</option><option>Concluído</option><option>Cancelado</option>
                  </Form.Select>
                ) : clientActions(appointment)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        {!appointments.length && !error && <div className="empty-state"><h2>Nenhum horário por aqui</h2><p>Quando houver um agendamento, ele aparecerá nesta lista.</p></div>}
      </div>
    </div>
  );
};

export default ViewAppointments;
