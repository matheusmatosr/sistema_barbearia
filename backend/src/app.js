require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const barberRoutes = require('./routes/barberRoutes');
const clientRoutes = require('./routes/clientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const authRoutes = require('./routes/authRoutes');
const barbershopRoutes = require('./routes/barbershopRoutes');
const reportRoutes = require('./routes/reportRoutes');
const setupDatabase = require('./config/setup');

const app = express();
// Em produção, CORS_ORIGIN restringe as chamadas ao domínio do frontend (vírgula separa vários).
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));
// A Vercel limita o corpo da requisição a 4,5 MB.
app.use(express.json({ limit: '4mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Conecta e prepara o banco uma vez por instância: no servidor local ao iniciar,
// na Vercel na primeira requisição de cada função.
let ready = null;
const ensureReady = () => {
  if (!ready) {
    ready = (async () => {
      if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET não configurado.');
      await sequelize.authenticate();
      await setupDatabase();
    })().catch((error) => {
      ready = null;
      throw error;
    });
  }
  return ready;
};

app.use(async (req, res, next) => {
  try {
    await ensureReady();
    next();
  } catch (error) {
    res.status(503).json({ error: 'Serviço temporariamente indisponível.' });
  }
});

app.use('/api/barbers', barberRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/barbershops', barbershopRoutes);
app.use('/api/reports', reportRoutes);

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Arquivo muito grande.' });
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;

// Execução local (npm start / npm run dev). Na Vercel o app é importado e não chama listen.
if (require.main === module) {
  ensureReady()
    .then(() => app.listen(PORT))
    .catch((error) => {
      console.error('Não foi possível iniciar a API:', error.message);
      process.exit(1);
    });
}

module.exports = app;
