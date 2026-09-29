import axios from 'axios';

const api = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const data = (request) => request.then(response => response.data);

// Barbearias
export const fetchShops = () => data(api.get('/barbershops'));
export const fetchShop = (key) => data(api.get(`/barbershops/${key}`));
export const fetchManagedShops = () => data(api.get('/barbershops/manage'));
export const createShop = (shopData) => data(api.post('/barbershops', shopData));
export const updateShop = (id, shopData) => data(api.put(`/barbershops/${id}`, shopData));
export const deleteShop = (id) => data(api.delete(`/barbershops/${id}`));
export const createManager = (shopId, managerData) => data(api.post(`/barbershops/${shopId}/managers`, managerData));
export const deleteManager = (shopId, managerId) => data(api.delete(`/barbershops/${shopId}/managers/${managerId}`));

// Equipe (painel)
export const fetchBarbers = (params) => data(api.get('/barbers', { params }));
export const createBarber = (barberData) => data(api.post('/barbers', barberData));
export const updateBarber = (id, barberData) => data(api.put(`/barbers/${id}`, barberData));
export const deleteBarber = (id) => data(api.delete(`/barbers/${id}`));

// Clientes
export const registerClient = (clientData) => data(api.post('/clients/register', clientData));
export const fetchClients = (params) => data(api.get('/clients', { params }));
export const deleteClient = (id) => data(api.delete(`/clients/${id}`));

// Agendamentos
export const fetchAppointments = (params) => data(api.get('/appointments', { params }));
export const fetchAvailability = (params) => data(api.get('/appointments/availability', { params }));
export const createAppointment = (appointmentData) => data(api.post('/appointments', appointmentData));
export const updateAppointment = (id, appointmentData) => data(api.put(`/appointments/${id}`, appointmentData));
export const rescheduleAppointment = (id, appointmentData) => data(api.put(`/appointments/${id}/reschedule`, appointmentData));
export const deleteAppointment = (id) => data(api.delete(`/appointments/${id}`));

// Relatórios
export const fetchFinancialReport = (params) => data(api.get('/reports/financial', { params }));
