const { Appointment, Barber, Barbershop } = require('../models');
const { Op } = require('sequelize');
const { priceOf, monthKeyOf } = require('../config/services');
const { scopedShopId } = require('../services/authService');

const MIN_MONTHS = 6;
const MAX_MONTHS = 24;
const OPEN_STATUSES = ['Agendado', 'Em atendimento'];

const round = (value) => Math.round(value * 100) / 100;

// Meses (AAAA-MM) do mais antigo ao atual.
const lastMonths = (count) => {
  const [year, month] = monthKeyOf(new Date()).split('-').map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (count - 1 - index), 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
  });
};

// Quantos meses exibir: desde o início da atividade, entre 6 e 24.
const monthsSince = (date) => {
  const [startYear, startMonth] = monthKeyOf(date).split('-').map(Number);
  const [year, month] = monthKeyOf(new Date()).split('-').map(Number);
  const count = (year - startYear) * 12 + (month - startMonth) + 1;
  return Math.min(Math.max(count, MIN_MONTHS), MAX_MONTHS);
};

const emptyTotals = () => ({ revenue: 0, barberShare: 0, houseShare: 0, completed: 0, openCount: 0, openRevenue: 0 });

const addTo = (totals, appointment, price, rate) => {
  if (appointment.status === 'Concluído') {
    const barberShare = price * rate;
    totals.revenue += price;
    totals.barberShare += barberShare;
    totals.houseShare += price - barberShare;
    totals.completed += 1;
  } else if (OPEN_STATUSES.includes(appointment.status)) {
    totals.openCount += 1;
    totals.openRevenue += price;
  }
};

const finish = (totals) => ({
  ...totals,
  revenue: round(totals.revenue),
  barberShare: round(totals.barberShare),
  houseShare: round(totals.houseShare),
  openRevenue: round(totals.openRevenue),
  averageTicket: totals.completed ? round(totals.revenue / totals.completed) : 0,
});

exports.getFinancialReport = async (req, res) => {
  try {
    const isBarber = req.user.role === 'barber';
    const barbershopId = scopedShopId(req, req.query.barbershopId);
    const scope = isBarber ? { barberId: req.user.id } : barbershopId !== null ? { barbershopId } : {};

    const shops = await Barbershop.findAll({
      where: barbershopId !== null ? { id: barbershopId } : {},
      attributes: ['id', 'name', 'services', 'commissionRate', 'createdAt'],
    });
    const shopById = Object.fromEntries(shops.map(shop => [shop.id, shop]));

    const firstAppointment = await Appointment.findOne({ where: scope, order: [['date', 'ASC']], attributes: ['date'] });
    const origins = shops.map(shop => shop.createdAt);
    if (isBarber) {
      const barber = await Barber.findByPk(req.user.id, { attributes: ['createdAt'] });
      if (barber) origins.push(barber.createdAt);
    }
    if (firstAppointment) origins.push(firstAppointment.date);
    const start = origins.length ? new Date(Math.min(...origins.map(date => new Date(date).getTime()))) : new Date();
    const months = lastMonths(monthsSince(start));

    // Margem de um dia para cobrir a diferença de fuso; o filtro exato é feito pela chave do mês.
    const since = new Date(`${months[0]}-01T00:00:00Z`);
    since.setUTCDate(since.getUTCDate() - 1);

    const appointments = await Appointment.findAll({
      where: { ...scope, date: { [Op.gte]: since }, status: { [Op.ne]: 'Cancelado' } },
      include: [{ model: Barber, attributes: ['id', 'name'] }],
    });

    const byMonth = Object.fromEntries(months.map(month => [month, { totals: emptyTotals(), barbers: {}, services: {} }]));

    appointments.forEach(appointment => {
      const bucket = byMonth[monthKeyOf(appointment.date)];
      const shop = shopById[appointment.barbershopId];
      if (!bucket) return;
      const price = priceOf(appointment, shop);
      const rate = Number(shop?.commissionRate ?? 0.5);
      addTo(bucket.totals, appointment, price, rate);

      const barberId = appointment.barberId;
      bucket.barbers[barberId] = bucket.barbers[barberId] || {
        id: barberId,
        name: appointment.Barber?.name || 'Barbeiro removido',
        shopName: shop?.name || '',
        ...emptyTotals(),
      };
      addTo(bucket.barbers[barberId], appointment, price, rate);

      if (appointment.status === 'Concluído') {
        const service = bucket.services[appointment.specialty] || { name: appointment.specialty, count: 0, revenue: 0 };
        service.count += 1;
        service.revenue += price;
        bucket.services[appointment.specialty] = service;
      }
    });

    // Com várias barbearias de comissões diferentes, não existe uma taxa única.
    const rates = [...new Set(shops.map(shop => Number(shop.commissionRate)))];
    const scopedRate = isBarber
      ? Number(shopById[req.user.barbershopId]?.commissionRate ?? rates[0] ?? 0.5)
      : rates.length === 1 ? rates[0] : null;

    res.status(200).json({
      commissionRate: scopedRate,
      months: months.map(month => ({
        month,
        ...finish(byMonth[month].totals),
        barbers: isBarber ? [] : Object.values(byMonth[month].barbers).map(finish).sort((a, b) => b.revenue - a.revenue),
        services: Object.values(byMonth[month].services)
          .map(service => ({ ...service, revenue: round(service.revenue) }))
          .sort((a, b) => b.revenue - a.revenue),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar o relatório financeiro' });
  }
};
