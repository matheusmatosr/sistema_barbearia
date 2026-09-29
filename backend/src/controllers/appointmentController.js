const { Appointment, Barber, Barbershop, Client } = require('../models');
const { Op } = require('sequelize');
const { schedule, findService, isValidSlot } = require('../config/services');
const { scopedShopId, canManageShop } = require('../services/authService');

const MIN_CHANGE_HOURS = 2;
const STATUSES = ['Agendado', 'Em atendimento', 'Concluído', 'Cancelado'];

// Valida serviço, barbeiro e horário de uma reserva; ignora o próprio agendamento ao remarcar.
const validateBooking = async ({ barberId, date, specialty }, excludeId) => {
  const appointmentDate = new Date(date);
  if (!date || Number.isNaN(appointmentDate.getTime()) || appointmentDate <= new Date()) {
    return { status: 400, error: 'Escolha uma data futura válida.' };
  }
  if (!isValidSlot(appointmentDate)) {
    return { status: 400, error: `Escolha um horário disponível entre ${schedule.openHour}h e ${schedule.closeHour}h.` };
  }

  const barber = await Barber.findByPk(barberId, { include: [{ model: Barbershop }] });
  if (!barber || !barber.Barbershop) {
    return { status: 404, error: 'Barbeiro não encontrado.' };
  }
  if (!barber.Barbershop.active) {
    return { status: 400, error: 'Esta barbearia não está recebendo agendamentos no momento.' };
  }
  const service = findService(barber.Barbershop, specialty);
  if (!service) {
    return { status: 400, error: 'Selecione um serviço do menu desta barbearia.' };
  }

  // Cada atendimento ocupa um slot inteiro: bloqueia qualquer horário que se sobreponha.
  const slotMs = schedule.slotMinutes * 60 * 1000;
  const existingAppointment = await Appointment.findOne({
    where: {
      barberId,
      status: { [Op.ne]: 'Cancelado' },
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
      date: {
        [Op.gt]: new Date(appointmentDate.getTime() - slotMs),
        [Op.lt]: new Date(appointmentDate.getTime() + slotMs),
      },
    },
  });
  if (existingAppointment) {
    return { status: 409, error: 'Este horário acabou de ser reservado. Escolha outro.' };
  }

  return { date: appointmentDate, service, barber };
};

const hoursUntil = (date) => (new Date(date) - new Date()) / (1000 * 60 * 60);

exports.createAppointment = async (req, res) => {
  try {
    const clientId = req.user.id;
    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    const booking = await validateBooking(req.body);
    if (booking.error) return res.status(booking.status).json({ error: booking.error });

    const appointment = await Appointment.create({
      barberId: booking.barber.id,
      barbershopId: booking.barber.barbershopId,
      clientId,
      date: booking.date,
      specialty: booking.service.name,
      price: booking.service.price,
      status: 'Agendado',
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Error creating appointment' });
  }
};

exports.rescheduleAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment || appointment.clientId !== req.user.id) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }
    if (appointment.status !== 'Agendado') {
      return res.status(400).json({ error: 'Só é possível alterar horários ainda agendados.' });
    }
    if (hoursUntil(appointment.date) < MIN_CHANGE_HOURS) {
      return res.status(400).json({ error: `Não é possível alterar o agendamento com menos de ${MIN_CHANGE_HOURS} horas de antecedência` });
    }

    const booking = await validateBooking(req.body, appointment.id);
    if (booking.error) return res.status(booking.status).json({ error: booking.error });
    if (booking.barber.barbershopId !== appointment.barbershopId) {
      return res.status(400).json({ error: 'Escolha um profissional da mesma barbearia.' });
    }

    await appointment.update({
      barberId: booking.barber.id,
      specialty: booking.service.name,
      price: booking.service.price,
      date: booking.date,
    });
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alterar o agendamento' });
  }
};

exports.getAvailability = async (req, res) => {
  try {
    const { barberId, start, end, exclude } = req.query;
    const from = new Date(start);
    const to = new Date(end);
    if (!barberId || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from || to - from > 2 * 24 * 60 * 60 * 1000) {
      return res.status(400).json({ error: 'Período inválido.' });
    }

    const appointments = await Appointment.findAll({
      where: {
        barberId,
        status: { [Op.ne]: 'Cancelado' },
        date: { [Op.gte]: from, [Op.lt]: to },
        ...(exclude ? { id: { [Op.ne]: exclude } } : {}),
      },
      attributes: ['date'],
    });
    res.status(200).json(appointments.map(appointment => appointment.date));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar horários disponíveis' });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const { role, id } = req.user;
    let where;
    if (role === 'client') where = { clientId: id };
    else if (role === 'barber') where = { barberId: id };
    else {
      const barbershopId = scopedShopId(req, req.query.barbershopId);
      where = barbershopId !== null ? { barbershopId } : {};
    }

    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: Barber, attributes: ['id', 'name'] },
        { model: Client, attributes: ['id', 'name', 'email'] },
        { model: Barbershop, attributes: ['id', 'name', 'slug'] },
      ],
      order: [['date', 'ASC']],
    });
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id);

    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    if (req.user.role !== 'client') {
      return res.status(403).json({ error: 'Use a atualização de status para gerenciar este agendamento.' });
    }
    if (appointment.clientId !== req.user.id) {
      return res.status(403).json({ error: 'Este agendamento não pertence à sua conta.' });
    }
    if (hoursUntil(appointment.date) < MIN_CHANGE_HOURS) {
      return res.status(400).json({ error: `Não é possível cancelar o agendamento com menos de ${MIN_CHANGE_HOURS} horas de antecedência` });
    }

    appointment.status = 'Cancelado';
    await appointment.save();

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cancelar o agendamento' });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['barber', 'manager', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Somente a equipe da barbearia pode atualizar o status.' });
    }

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Agendamento não encontrado' });
    }

    if (req.user.role === 'barber' && appointment.barberId !== req.user.id) {
      return res.status(403).json({ error: 'Este agendamento pertence a outro barbeiro.' });
    }
    if (req.user.role === 'manager' && !canManageShop(req, appointment.barbershopId)) {
      return res.status(403).json({ error: 'Este agendamento pertence a outra barbearia.' });
    }
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status inválido.' });
    }
    appointment.status = status;

    await appointment.save();
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar o agendamento' });
  }
};
