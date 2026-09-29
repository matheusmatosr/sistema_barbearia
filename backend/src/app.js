require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
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
app.use(cors());
app.use(express.json({ limit: '8mb' }));

app.use('/api/barbers', barberRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/barbershops', barbershopRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Arquivo muito grande.' });
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;

async function start() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET não configurado.');
  await sequelize.authenticate();
  await setupDatabase();
  app.listen(PORT);
}

start().catch((error) => {
  console.error('Não foi possível iniciar a API:', error.message);
  process.exit(1);
});
