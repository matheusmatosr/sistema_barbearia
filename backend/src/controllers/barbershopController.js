const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { Barbershop, Barber, Client, Appointment } = require('../models');
const { DEFAULT_SERVICES, DEFAULT_COMMISSION_RATE, publicSchedule } = require('../config/services');
const { parseImage, slugify, emailInUse } = require('../services/validation');
const { canManageShop } = require('../services/authService');

const CONTACT_FIELDS = ['address', 'city', 'phone', 'whatsapp', 'instagram', 'email'];
const MAX_SERVICES = 24;

const findByKey = (key) => (/^\d+$/.test(key)
  ? Barbershop.findByPk(key)
  : Barbershop.findOne({ where: { slug: key } }));

const sanitizeServices = (services) => {
  if (!Array.isArray(services) || !services.length) return { error: 'Cadastre pelo menos um serviço.' };
  if (services.length > MAX_SERVICES) return { error: `Cadastre no máximo ${MAX_SERVICES} serviços.` };
  const result = [];
  for (const service of services) {
    const name = String(service?.name || '').trim().slice(0, 60);
    const price = Number(service?.price);
    if (!name) return { error: 'Todo serviço precisa de um nome.' };
    if (!Number.isFinite(price) || price < 0 || price > 10000) return { error: `Preço inválido em "${name}".` };
    if (result.some(item => item.name.toLowerCase() === name.toLowerCase())) return { error: `O serviço "${name}" está repetido.` };
    const image = parseImage(service.image, { maxBytes: 0.6 * 1024 * 1024, label: `A imagem de "${name}"` });
    if (image.error) return { error: image.error };
    result.push({
      id: slugify(name) || `servico-${result.length + 1}`,
      name,
      description: String(service.description || '').trim().slice(0, 200),
      price: Math.round(price * 100) / 100,
      image: image.value || null,
    });
  }
  return { value: result };
};

const sanitizeContact = (contact = {}) => Object.fromEntries(
  CONTACT_FIELDS.map(field => [field, String(contact[field] || '').trim().slice(0, 200)]),
);

const publicShop = (shop) => ({
  id: shop.id,
  name: shop.name,
  slug: shop.slug,
  tagline: shop.tagline,
  logo: shop.logo,
  services: shop.services,
  contact: shop.contact,
  active: shop.active,
});

exports.listShops = async (req, res) => {
  try {
    const shops = await Barbershop.findAll({ where: { active: true }, order: [['name', 'ASC']] });
    res.status(200).json(shops.map(shop => ({
      id: shop.id, name: shop.name, slug: shop.slug, tagline: shop.tagline, logo: shop.logo, city: shop.contact?.city || '',
    })));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar barbearias' });
  }
};

exports.getShop = async (req, res) => {
  try {
    const shop = await findByKey(req.params.key);
    if (!shop) return res.status(404).json({ error: 'Barbearia não encontrada.' });
    const barbers = await Barber.findAll({
      where: { barbershopId: shop.id },
      attributes: ['id', 'name', 'photo', 'hireDate'],
      order: [['name', 'ASC']],
    });
    res.status(200).json({ ...publicShop(shop), schedule: publicSchedule(), barbers });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar a barbearia' });
  }
};

exports.listManagedShops = async (req, res) => {
  try {
    const where = req.user.role === 'admin' ? {} : { id: req.user.barbershopId || 0 };
    const shops = await Barbershop.findAll({
      where,
      order: [['name', 'ASC']],
      include: [{ model: Client, as: 'managers', attributes: ['id', 'name', 'email'] }],
    });
    const counts = await Barber.count({ where: { barbershopId: shops.map(shop => shop.id) }, group: ['barbershopId'] });
    const barberCount = Object.fromEntries(counts.map(item => [item.barbershopId, Number(item.count)]));
    res.status(200).json(shops.map(shop => ({
      ...publicShop(shop),
      commissionRate: Number(shop.commissionRate),
      managers: shop.managers,
      barberCount: barberCount[shop.id] || 0,
    })));
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar barbearias' });
  }
};

exports.createShop = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const slug = slugify(req.body.slug || name);
    if (!name || !slug) return res.status(400).json({ error: 'Informe o nome da barbearia.' });
    if (await Barbershop.findOne({ where: { slug } })) return res.status(409).json({ error: 'Já existe uma barbearia com este endereço.' });

    const shop = await Barbershop.create({
      name,
      slug,
      tagline: String(req.body.tagline || '').trim().slice(0, 120),
      services: DEFAULT_SERVICES,
      contact: sanitizeContact(),
      commissionRate: DEFAULT_COMMISSION_RATE,
    });
    res.status(201).json({ ...publicShop(shop), commissionRate: Number(shop.commissionRate), managers: [], barberCount: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar a barbearia' });
  }
};

exports.updateShop = async (req, res) => {
  try {
    const shop = await Barbershop.findByPk(req.params.id);
    if (!shop) return res.status(404).json({ error: 'Barbearia não encontrada.' });
    if (!canManageShop(req, shop.id)) return res.status(403).json({ error: 'Você não tem permissão para esta barbearia.' });

    const { name, slug, tagline, contact, services, commissionRate, active } = req.body;
    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ error: 'Informe o nome da barbearia.' });
      shop.name = String(name).trim().slice(0, 80);
    }
    if (slug !== undefined) {
      const nextSlug = slugify(slug);
      if (!nextSlug) return res.status(400).json({ error: 'Endereço inválido.' });
      if (await Barbershop.findOne({ where: { slug: nextSlug, id: { [Op.ne]: shop.id } } })) {
        return res.status(409).json({ error: 'Já existe uma barbearia com este endereço.' });
      }
      shop.slug = nextSlug;
    }
    if (tagline !== undefined) shop.tagline = String(tagline || '').trim().slice(0, 120);
    if (contact !== undefined) shop.contact = sanitizeContact(contact);
    const logo = parseImage(req.body.logo, { maxBytes: 0.8 * 1024 * 1024, label: 'O logo' });
    if (logo.error) return res.status(400).json({ error: logo.error });
    if (logo.value !== undefined) shop.logo = logo.value;
    if (services !== undefined) {
      const parsed = sanitizeServices(services);
      if (parsed.error) return res.status(400).json({ error: parsed.error });
      shop.services = parsed.value;
    }
    if (commissionRate !== undefined) {
      const rate = Number(commissionRate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 1) return res.status(400).json({ error: 'A comissão deve ficar entre 0% e 100%.' });
      shop.commissionRate = rate;
    }
    if (active !== undefined && req.user.role === 'admin') shop.active = !!active;

    await shop.save();
    res.status(200).json({ ...publicShop(shop), commissionRate: Number(shop.commissionRate) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar a barbearia' });
  }
};

exports.deleteShop = async (req, res) => {
  try {
    const shop = await Barbershop.findByPk(req.params.id);
    if (!shop) return res.status(404).json({ error: 'Barbearia não encontrada.' });
    const [barbers, appointments] = await Promise.all([
      Barber.count({ where: { barbershopId: shop.id } }),
      Appointment.count({ where: { barbershopId: shop.id } }),
    ]);
    if (barbers || appointments) {
      return res.status(400).json({ error: 'Esta barbearia tem barbeiros ou histórico de atendimentos. Desative-a em vez de excluir.' });
    }
    await Client.destroy({ where: { role: 'manager', barbershopId: shop.id } });
    await shop.destroy();
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir a barbearia' });
  }
};

exports.createManager = async (req, res) => {
  try {
    const shop = await Barbershop.findByPk(req.params.id);
    if (!shop) return res.status(404).json({ error: 'Barbearia não encontrada.' });
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({ error: 'Informe nome, e-mail e senha com pelo menos 6 caracteres.' });
    }
    if (await emailInUse(email)) return res.status(409).json({ error: 'Este e-mail já está em uso.' });

    const manager = await Client.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: await bcrypt.hash(password, 10),
      role: 'manager',
      barbershopId: shop.id,
    });
    res.status(201).json({ id: manager.id, name: manager.name, email: manager.email });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar o gerente' });
  }
};

exports.deleteManager = async (req, res) => {
  try {
    const removed = await Client.destroy({ where: { id: req.params.managerId, role: 'manager', barbershopId: req.params.id } });
    if (!removed) return res.status(404).json({ error: 'Gerente não encontrado.' });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover o gerente' });
  }
};
