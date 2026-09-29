// Menu inicial de toda barbearia nova. Depois cada barbearia personaliza o seu.
const image = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=80`;

const DEFAULT_SERVICES = [
  { id: 'corte', name: 'Corte clássico', description: 'Tesoura e máquina, com lavagem e finalização.', price: 45, image: image('1622286342621-4bd786c2447c') },
  { id: 'degrade', name: 'Degradê', description: 'Fade na máquina com transição precisa e acabamento na navalha.', price: 50, image: image('1493256338651-d82f7acb2b38') },
  { id: 'barba', name: 'Barba completa', description: 'Modelagem, aparo e alinhamento do desenho da barba.', price: 35, image: image('1517832606299-7ae9b720a186') },
  { id: 'navalha', name: 'Barba na navalha', description: 'Toalha quente, espuma e barbear tradicional.', price: 40, image: image('1532710093739-9470acff878f') },
  { id: 'acabamento', name: 'Pezinho e acabamento', description: 'Contorno da nuca, costeletas e laterais.', price: 20, image: image('1599351431202-1e0f0137899a') },
  { id: 'finalizacao', name: 'Lavagem e finalização', description: 'Lavagem, secagem e styling com produto.', price: 30, image: image('1605497788044-5a32c7078486') },
];

const schedule = {
  openHour: 8,
  closeHour: 18,
  slotMinutes: 30,
  // 0 = domingo ... 6 = sábado. Ex.: [0] fecha aos domingos.
  closedWeekdays: [],
  timeZone: process.env.BUSINESS_TIMEZONE || 'America/Sao_Paulo',
};

// Parte de cada atendimento que fica com o barbeiro em barbearias novas.
const DEFAULT_COMMISSION_RATE = Number(process.env.BARBER_COMMISSION_RATE || 0.5);

const findService = (shop, name) => (shop?.services || []).find(service => service.name === name);

// Agendamentos antigos não têm preço gravado: usa o preço atual do menu da barbearia.
const priceOf = (appointment, shop) => (appointment.price != null
  ? Number(appointment.price)
  : findService(shop, appointment.specialty)?.price || 0);

// Mês (AAAA-MM) no fuso da barbearia.
const monthKeyOf = (date) => new Intl.DateTimeFormat('en-CA', {
  timeZone: schedule.timeZone, year: 'numeric', month: '2-digit',
}).format(date).slice(0, 7);

// Hora/minuto/dia da semana no fuso da barbearia, independente do fuso do servidor.
const toBusinessTime = (date) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: schedule.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(date).map(part => [part.type, part.value]));
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return { hour: Number(parts.hour), minute: Number(parts.minute), weekday: weekdays.indexOf(parts.weekday) };
};

const isValidSlot = (date) => {
  if (date.getSeconds() !== 0 || date.getMilliseconds() !== 0) return false;
  const { hour, minute, weekday } = toBusinessTime(date);
  const start = hour * 60 + minute;
  return !schedule.closedWeekdays.includes(weekday)
    && minute % schedule.slotMinutes === 0
    && start >= schedule.openHour * 60
    && start + schedule.slotMinutes <= schedule.closeHour * 60;
};

const publicSchedule = () => {
  const { timeZone, ...rest } = schedule;
  return rest;
};

module.exports = {
  DEFAULT_SERVICES, DEFAULT_COMMISSION_RATE, schedule, publicSchedule, findService, priceOf, monthKeyOf, isValidSlot,
};
