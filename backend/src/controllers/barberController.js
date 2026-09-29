const { Barber, Barbershop } = require('../models');
const bcrypt = require('bcrypt');
const { parseImage, emailInUse } = require('../services/validation');
const { scopedShopId, canManageShop } = require('../services/authService');

const withoutPassword = (barber) => {
  const result = barber.toJSON();
  delete result.password;
  return result;
};

// Gerente só acessa barbeiros da própria barbearia; o supremo acessa todos.
const findManagedBarber = async (req) => {
  const barber = await Barber.findByPk(req.params.id);
  if (!barber) return { status: 404, error: 'Barbeiro não encontrado.' };
  if (!canManageShop(req, barber.barbershopId)) return { status: 403, error: 'Este barbeiro pertence a outra barbearia.' };
  return { barber };
};

exports.createBarber = async (req, res) => {
  try {
    const { name, age, hireDate, email, password } = req.body;
    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Informe nome, e-mail e senha com pelo menos 6 caracteres.' });
    }
    const barbershopId = req.user.role === 'admin' ? Number(req.body.barbershopId) : req.user.barbershopId;
    if (!barbershopId || !(await Barbershop.findByPk(barbershopId))) {
      return res.status(400).json({ error: 'Selecione a barbearia do profissional.' });
    }
    if (await emailInUse(email)) return res.status(409).json({ error: 'Este e-mail já está em uso.' });
    const photo = parseImage(req.body.photo, { label: 'A foto' });
    if (photo.error) return res.status(400).json({ error: photo.error });

    const barber = await Barber.create({
      name,
      age,
      hireDate,
      email: email.trim().toLowerCase(),
      password: await bcrypt.hash(password, 10),
      photo: photo.value || null,
      barbershopId,
    });
    res.status(201).json(withoutPassword(barber));
  } catch (error) {
    res.status(500).json({ error: 'Error creating barber' });
  }
};

exports.getBarbers = async (req, res) => {
  try {
    const barbershopId = scopedShopId(req, req.query.barbershopId);
    const barbers = await Barber.findAll({
      where: barbershopId ? { barbershopId } : {},
      attributes: { exclude: ['password'] },
      order: [['name', 'ASC']],
    });
    res.status(200).json(barbers);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching barbers' });
  }
};

exports.updateBarber = async (req, res) => {
  try {
    const { barber, status, error } = await findManagedBarber(req);
    if (error) return res.status(status).json({ error });
    const { name, age, hireDate, email, password } = req.body;

    const photo = parseImage(req.body.photo, { label: 'A foto' });
    if (photo.error) return res.status(400).json({ error: photo.error });
    if (email && await emailInUse(email, { exceptBarberId: barber.id })) {
      return res.status(409).json({ error: 'Este e-mail já está em uso.' });
    }

    barber.name = name || barber.name;
    barber.age = age || barber.age;
    barber.hireDate = hireDate || barber.hireDate;
    barber.email = email ? email.trim().toLowerCase() : barber.email;
    if (photo.value !== undefined) barber.photo = photo.value;
    if (password) {
      if (password.length < 6) return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
      barber.password = await bcrypt.hash(password, 10);
    }

    await barber.save();
    res.status(200).json(withoutPassword(barber));
  } catch (error) {
    res.status(500).json({ error: 'Error updating barber' });
  }
};

exports.deleteBarber = async (req, res) => {
  try {
    const { barber, status, error } = await findManagedBarber(req);
    if (error) return res.status(status).json({ error });

    await barber.destroy();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Error deleting barber' });
  }
};
