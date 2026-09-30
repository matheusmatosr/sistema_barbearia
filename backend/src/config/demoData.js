// Dados fictícios para a vitrine não ficar vazia. Idempotente: só preenche o que falta.
// Desligue com SEED_DEMO=false no .env.
const { Barbershop, Barber, Client, Appointment } = require('../models');
const { DEFAULT_SERVICES, DEFAULT_COMMISSION_RATE, schedule } = require('./services');

const image = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;
const portrait = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=400&h=400&q=80`;

const EXTRA_SERVICES = [
  { id: 'combo', name: 'Combo corte + barba', description: 'O ritual completo: corte, barba e toalha quente.', price: 75, image: image('1621605815971-fbc98d665033') },
  { id: 'sobrancelha', name: 'Sobrancelha', description: 'Limpeza e alinhamento na navalha ou pinça.', price: 15, image: image('1519500528352-2d1460418d41') },
  { id: 'pigmentacao', name: 'Pigmentação de barba', description: 'Preenche falhas e realça o desenho da barba.', price: 40, image: image('1512690459411-b9245aed614b') },
  { id: 'infantil', name: 'Corte infantil', description: 'Para os pequenos até 12 anos, com paciência e capricho.', price: 35, image: image('1596728325488-58c87691e9af') },
  { id: 'platinado', name: 'Platinado', description: 'Descoloração global com matização e hidratação.', price: 150, image: image('1560869713-7d0a29430803') },
  { id: 'hidratacao', name: 'Hidratação capilar', description: 'Tratamento para cabelo e barba ressecados.', price: 35, image: image('1634449571010-02389ed0f9b0') },
];

const DEMO_SHOPS = [
  { name: 'Navalha de Ouro', slug: 'navalha-de-ouro', tagline: 'Tradição desde 1998', contact: { city: 'São Paulo · Pinheiros', address: 'Rua dos Pinheiros, 870', phone: '(11) 3456-7788', instagram: '@navalhadeouro' } },
  { name: 'Corte & Cia', slug: 'corte-e-cia', tagline: 'Estilo sem pressa', contact: { city: 'Belo Horizonte · Savassi', address: 'Av. Getúlio Vargas, 1200', phone: '(31) 3222-1144', instagram: '@corteecia' } },
  { name: 'Barba Negra Club', slug: 'barba-negra-club', tagline: 'Cerveja gelada e corte afiado', contact: { city: 'Curitiba · Batel', address: 'Rua Bispo Dom José, 2100', phone: '(41) 3021-5566', instagram: '@barbanegraclub' } },
];

const BARBER_NAMES = [
  'Rafael Andrade', 'Diego Martins', 'Lucas Ferreira', 'Thiago Rocha', 'Bruno Carvalho', 'Gabriel Lima',
  'Felipe Souza', 'André Barbosa', 'Marcos Vieira', 'Caio Mendes', 'Pedro Nogueira', 'Vinícius Costa',
];
const BARBER_PHOTOS = [
  '1506794778202-cad84cf45f1d', '1500648767791-00dcc994a43e', '1507003211169-0a1dd7228f2d', '1519085360753-af0119f7cbe7',
  '1492562080023-ab3db95bfbce', '1504257432389-52343af06ae3', '1531427186611-ecfd6d936c79', '1463453091185-61582044d556',
  '1522075469751-3a6694fb2f61', '1539571696357-5a69c17a67c6', '1488161628813-04466f872be2', '1472099645785-5658abf4ff4e',
];
const CLIENT_NAMES = [
  'João Pereira', 'Mateus Alves', 'Gustavo Ribeiro', 'Leonardo Dias', 'Henrique Castro', 'Rodrigo Pinto',
  'Samuel Teixeira', 'Daniel Moreira', 'Eduardo Freitas', 'Arthur Cardoso', 'Otávio Ramos', 'Ricardo Melo',
];

const BARBERS_PER_SHOP = 4;
const PAST_DAYS = 60;
const FUTURE_DAYS = 7;

// Gerador determinístico: o mesmo banco sempre recebe os mesmos dados.
const random = (seed) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

// Converte um horário local da barbearia (UTC-3, sem horário de verão) em Date.
const slotDate = (dayOffset, minutes) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + dayOffset);
  date.setUTCHours(Math.floor(minutes / 60) + 3, minutes % 60, 0, 0);
  return date;
};

const ensureServices = async (shop) => {
  const defaultIds = DEFAULT_SERVICES.map(service => service.id);
  const services = shop.services || [];
  // Só completa menus que ainda não foram personalizados pela barbearia.
  if (!services.every(service => defaultIds.includes(service.id))) return;
  const missing = EXTRA_SERVICES.filter(extra => !services.some(service => service.id === extra.id));
  if (missing.length) await shop.update({ services: [...services, ...missing] });
};

const ensureBarbers = async (shop, offset) => {
  const existing = await Barber.findAll({ where: { barbershopId: shop.id } });
  if (existing.length) return existing;
  const barbers = [];
  for (let i = 0; i < BARBERS_PER_SHOP; i += 1) {
    const index = (offset * BARBERS_PER_SHOP + i) % BARBER_NAMES.length;
    barbers.push(await Barber.create({
      name: BARBER_NAMES[index],
      photo: portrait(BARBER_PHOTOS[index]),
      hireDate: new Date(2016 + ((index * 3) % 9), index % 12, 10),
      age: 24 + ((index * 7) % 18),
      specialties: [],
      barbershopId: shop.id,
    }));
  }
  return barbers;
};

const ensureClients = async () => {
  const clients = [];
  for (const name of CLIENT_NAMES) {
    const email = `${name.toLowerCase().normalize('NFD').replace(/[^a-z ]/g, '').replace(' ', '.')}@demo.barbearia`;
    // Sem senha: são clientes fictícios, ninguém entra com eles.
    const [client] = await Client.findOrCreate({ where: { email }, defaults: { name, email, role: 'client' } });
    clients.push(client);
  }
  return clients;
};

const ensureAppointments = async (shop, barbers, clients) => {
  if (await Appointment.count({ where: { barbershopId: shop.id } })) return;
  const next = random(shop.id * 7919);
  const services = shop.services || [];
  const { openHour, closeHour, slotMinutes } = schedule;
  const slotsPerDay = ((closeHour - openHour) * 60) / slotMinutes;
  const rows = [];

  for (let day = -PAST_DAYS; day <= FUTURE_DAYS; day += 1) {
    if (day === 0) continue;
    if (schedule.closedWeekdays.includes(slotDate(day, 12 * 60).getUTCDay())) continue;
    for (const barber of barbers) {
      const taken = new Set();
      const count = 2 + Math.floor(next() * (day > 0 ? 4 : 7));
      for (let i = 0; i < count; i += 1) {
        const slot = Math.floor(next() * slotsPerDay);
        if (taken.has(slot)) continue;
        taken.add(slot);
        const service = services[Math.floor(next() * services.length)];
        const past = day < 0;
        rows.push({
          date: slotDate(day, openHour * 60 + slot * slotMinutes),
          status: past ? (next() < 0.9 ? 'Concluído' : 'Cancelado') : 'Agendado',
          specialty: service.name,
          price: service.price,
          barberId: barber.id,
          clientId: clients[Math.floor(next() * clients.length)].id,
          barbershopId: shop.id,
        });
      }
    }
  }
  await Appointment.bulkCreate(rows);
};

module.exports = async function seedDemoData() {
  if (process.env.SEED_DEMO === 'false') return;

  for (const demo of DEMO_SHOPS) {
    await Barbershop.findOrCreate({
      where: { slug: demo.slug },
      defaults: { ...demo, services: [...DEFAULT_SERVICES, ...EXTRA_SERVICES], commissionRate: DEFAULT_COMMISSION_RATE },
    });
  }

  const clients = await ensureClients();
  const shops = await Barbershop.findAll({ order: [['id', 'ASC']] });
  for (const [offset, shop] of shops.entries()) {
    await ensureServices(shop);
    const barbers = await ensureBarbers(shop, offset);
    await ensureAppointments(shop, barbers, clients);
  }
};
