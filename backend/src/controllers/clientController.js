const { Client, Appointment } = require('../models');
const bcrypt = require('bcrypt');
const { emailInUse } = require('../services/validation');
const { scopedShopId } = require('../services/authService');

exports.registerClient = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Informe nome, e-mail e senha com pelo menos 6 caracteres.' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (await emailInUse(normalizedEmail)) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await Client.create({ name: name.trim(), email: normalizedEmail, password: hashedPassword });
    res.status(201).json({ id: client.id, name: client.name, email: client.email });
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível criar a conta.' });
  }
};

exports.getClients = async (req, res) => {
  try {
    // Gerente vê apenas quem já agendou na barbearia dele.
    const barbershopId = scopedShopId(req, req.query.barbershopId);
    const where = { role: 'client' };
    if (barbershopId !== null) {
      const appointments = await Appointment.findAll({ where: { barbershopId }, attributes: ['clientId'], group: ['clientId'] });
      where.id = appointments.map(appointment => appointment.clientId);
    }
    const clients = await Client.findAll({ where, attributes: { exclude: ['password', 'barbershopId'] }, order: [['name', 'ASC']] });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching clients' });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;

    const client = await Client.findByPk(id, { attributes: { exclude: ['password'] } });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    client.name = name || client.name;
    client.email = email || client.email;
    if (password) {
      client.password = await bcrypt.hash(password, 10);
    }

    await client.save();
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ error: 'Error updating client' });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const client = await Client.findOne({ where: { id, role: 'client' } });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await client.destroy();
    res.status(204).json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting client' });
  }
};