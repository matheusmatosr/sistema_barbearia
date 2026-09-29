const { Barber, Client } = require('../models');
const { Op } = require('sequelize');

const MB = 1024 * 1024;

// Imagem enviada pelo painel (data URL) ou link https. String vazia/null remove.
exports.parseImage = (value, { maxBytes = 1.5 * MB, label = 'A imagem' } = {}) => {
  if (value === undefined) return { value: undefined };
  if (value === null || value === '') return { value: null };
  if (typeof value !== 'string' || value.length > maxBytes) return { error: `${label} deve ter no máximo ${Math.round(maxBytes / MB * 10) / 10} MB.` };
  if (!/^data:image\/(png|jpe?g|webp);base64,/.test(value) && !/^https:\/\//.test(value)) {
    return { error: `${label} tem um formato inválido.` };
  }
  return { value };
};

exports.slugify = (text) => {
  const slug = String(text || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 60);
  // Slug só numérico conflitaria com a busca por id.
  return /^\d+$/.test(slug) ? `b-${slug}` : slug;
};

// Barbeiros e contas de cliente/gerente/admin compartilham o login por e-mail.
exports.emailInUse = async (email, { exceptBarberId, exceptClientId } = {}) => {
  const normalized = String(email).trim().toLowerCase();
  const client = await Client.findOne({ where: { email: normalized, ...(exceptClientId ? { id: { [Op.ne]: exceptClientId } } : {}) } });
  if (client) return true;
  const barber = await Barber.findOne({ where: { email: normalized, ...(exceptBarberId ? { id: { [Op.ne]: exceptBarberId } } : {}) } });
  return !!barber;
};
