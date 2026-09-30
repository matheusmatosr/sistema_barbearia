const { Client, Barber } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const client = await Client.findOne({ where: { email: normalizedEmail } });
    const barber = client ? null : await Barber.findOne({ where: { email: normalizedEmail } });
    const account = client || barber;

    if (!account || !password) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const validPassword = await bcrypt.compare(password, account.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const role = barber ? 'barber' : client.role;
    const user = { id: account.id, name: account.name, email: account.email, role };
    if (role === 'barber' || role === 'manager') user.barbershopId = account.barbershopId;
    const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '12h' });
    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
};
