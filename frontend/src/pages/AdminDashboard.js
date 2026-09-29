import React, { useEffect, useState } from 'react';
import { Alert, Button, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { fetchAppointments, fetchClients, fetchBarbers, fetchManagedShops, deleteBarber, deleteClient, updateAppointment } from '../services/api';
import { getCurrentUser } from '../services/authService';
import BarberModal from '../components/BarberModal';
import BarberAvatar from '../components/BarberAvatar';
import ShopSelect from '../components/ShopSelect';

const AdminDashboard = () => {
  const isAdmin = getCurrentUser()?.role === 'admin';
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [show, setShow] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [error, setError] = useState('');
  const shop = shops.find(item => item.id === shopId);

  useEffect(() => {
    fetchManagedShops()
      .then(data => {
        setShops(data);
        setShopId(data[0]?.id || null);
      })
      .catch(() => setError('Não foi possível carregar as barbearias.'));
  }, []);

  useEffect(() => {
    if (!shopId) return;
    const params = { barbershopId: shopId };
    Promise.all([fetchAppointments(params), fetchClients(params), fetchBarbers(params)])
      .then(([appointmentData, clientData, barberData]) => {
        setAppointments(appointmentData);
        setClients(clientData);
        setBarbers(barberData);
      })
      .catch(() => setError('Não foi possível carregar os dados. Verifique sua conexão e tente novamente.'));
  }, [shopId]);

  const handleCancel = async (id) => {
    try {
      await updateAppointment(id, { status: 'Cancelado' });
      setAppointments(items => items.map(item => item.id === id ? { ...item, status: 'Cancelado' } : item));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível cancelar o horário.');
    }
  };

  const handleDeleteBarber = async (barber) => {
    if (!window.confirm(`Remover ${barber.name} da equipe?`)) return;
    try {
      await deleteBarber(barber.id);
      setBarbers(items => items.filter(item => item.id !== barber.id));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível remover o barbeiro.');
    }
  };

  const handleDeleteClient = async (client) => {
    if (!window.confirm(`Excluir a conta de ${client.name}?`)) return;
    try {
      await deleteClient(client.id);
      setClients(items => items.filter(item => item.id !== client.id));
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Não foi possível remover o cliente.');
    }
  };

  const handleShow = (barber = null) => {
    setEditMode(!!barber);
    setSelectedBarber(barber);
    setShow(true);
  };

  return (
    <main className="container admin-page">
      <header className="page-heading admin-heading panel-heading">
        <div><span className="eyebrow">CENTRAL DE OPERAÇÕES</span><h1>Gestão da barbearia</h1><p>{shop ? <>Equipe, clientes e agenda de <strong>{shop.name}</strong>.</> : 'Equipe, clientes e agenda em uma visão só.'}</p></div>
        {isAdmin && <ShopSelect shops={shops} value={shopId} onChange={setShopId} />}
      </header>
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {!shops.length && !error && <div className="empty-state"><h2>Nenhuma barbearia</h2><p>{isAdmin ? <>Cadastre a primeira em <Link to="/admin/barbearias">Barbearias</Link>.</> : 'Sua conta ainda não está vinculada a uma barbearia.'}</p></div>}
      {shop && (
        <>
          <section className="admin-metrics" aria-label="Resumo"><div><span>Profissionais</span><strong>{barbers.length.toString().padStart(2, '0')}</strong></div><div><span>Clientes</span><strong>{clients.length.toString().padStart(2, '0')}</strong></div><div><span>Horários marcados</span><strong>{appointments.filter(item => item.status === 'Agendado').length.toString().padStart(2, '0')}</strong></div></section>
          <BarberModal show={show} handleClose={() => setShow(false)} editMode={editMode} selectedBarber={selectedBarber} barbers={barbers} setBarbers={setBarbers} barbershopId={shopId} />

          <section className="admin-section"><div className="section-heading"><div><span className="eyebrow">TIME</span><h2>Barbeiros</h2></div><Button onClick={() => handleShow()}>Adicionar barbeiro <span aria-hidden="true">+</span></Button></div><div className="table-wrap"><Table responsive hover className="data-table"><thead><tr><th>Profissional</th><th>Acesso</th><th>Admissão</th><th>Ações</th></tr></thead><tbody>{barbers.map(barber => <tr key={barber.id}><td><div className="table-person"><BarberAvatar barber={barber} size={40} /><div><strong>{barber.name}</strong><small>{barber.age ? `${barber.age} anos` : 'Profissional'}</small></div></div></td><td>{barber.email || '—'}</td><td>{barber.hireDate ? new Date(barber.hireDate).toLocaleDateString('pt-BR') : '—'}</td><td className="table-actions"><Button size="sm" variant="outline-dark" onClick={() => handleShow(barber)}>Editar</Button><Button size="sm" variant="outline-danger" onClick={() => handleDeleteBarber(barber)}>Remover</Button></td></tr>)}</tbody></Table>{!barbers.length && <p className="table-empty">Cadastre o primeiro profissional da equipe.</p>}</div></section>

          <section className="admin-section"><div className="section-heading"><div><span className="eyebrow">ATENDIMENTO</span><h2>Agenda</h2></div><span className="section-count">{appointments.length} registros</span></div><div className="table-wrap"><Table responsive hover className="data-table"><thead><tr><th>Data</th><th>Barbeiro</th><th>Serviço</th><th>Cliente</th><th>Status</th><th>Ação</th></tr></thead><tbody>{appointments.map(appointment => <tr key={appointment.id}><td><strong>{new Date(appointment.date).toLocaleDateString('pt-BR')}</strong><small>{new Date(appointment.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</small></td><td>{appointment.Barber?.name || '—'}</td><td>{appointment.specialty || 'Serviço'}</td><td>{appointment.Client?.name || '—'}</td><td><span className={`status-pill status-${appointment.status.toLowerCase().replaceAll(' ', '-')}`}>{appointment.status}</span></td><td>{appointment.status !== 'Cancelado' && appointment.status !== 'Concluído' && <Button size="sm" variant="outline-danger" onClick={() => handleCancel(appointment.id)}>Cancelar</Button>}</td></tr>)}</tbody></Table>{!appointments.length && <p className="table-empty">Os novos agendamentos aparecerão aqui.</p>}</div></section>

          <section className="admin-section"><div className="section-heading"><div><span className="eyebrow">COMUNIDADE</span><h2>Clientes</h2></div><span className="section-count">{clients.length} com agendamentos nesta barbearia</span></div><div className="table-wrap"><Table responsive hover className="data-table"><thead><tr><th>Nome</th><th>E-mail</th>{isAdmin && <th>Ação</th>}</tr></thead><tbody>{clients.map(client => <tr key={client.id}><td><strong>{client.name}</strong></td><td>{client.email}</td>{isAdmin && <td><Button size="sm" variant="outline-danger" onClick={() => handleDeleteClient(client)}>Excluir conta</Button></td>}</tr>)}</tbody></Table>{!clients.length && <p className="table-empty">Os clientes aparecerão aqui após o primeiro agendamento.</p>}</div></section>
        </>
      )}
    </main>
  );
};

export default AdminDashboard;
