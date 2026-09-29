const jwt = require('jsonwebtoken');
const { Barber, Client } = require('../models');

exports.verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
  }

  try {
    // Barbeiro e gerente: a barbearia vem sempre do banco, para refletir transferências e remoções.
    if (payload.role === 'barber' || payload.role === 'manager') {
      const account = payload.role === 'barber'
        ? await Barber.findByPk(payload.id, { attributes: ['id', 'barbershopId'] })
        : await Client.findOne({ where: { id: payload.id, role: 'manager' }, attributes: ['id', 'barbershopId'] });
      if (!account) return res.status(401).json({ error: 'Sessão inválida ou expirada.' });
      payload.barbershopId = account.barbershopId;
    }
    req.user = payload;
    req.userId = payload.id;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao validar a sessão.' });
  }
};

exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Você não tem permissão para esta ação.' });
  }
  next();
};

// Barbearia que o usuário pode gerenciar: o supremo escolhe (ou null = todas); gerente e barbeiro, só a própria.
exports.scopedShopId = (req, requested) => {
  if (req.user.role === 'admin') return requested ? Number(requested) : null;
  // 0 nunca corresponde a uma barbearia: conta sem vínculo não enxerga nada.
  return req.user.barbershopId || 0;
};

exports.canManageShop = (req, shopId) => req.user.role === 'admin'
  || (req.user.role === 'manager' && Number(req.user.barbershopId) === Number(shopId));
