const bcrypt = require('bcrypt');
const { sequelize, Barbershop, Client } = require('../models');
const { DEFAULT_SERVICES, DEFAULT_COMMISSION_RATE } = require('./services');

const DEFAULT_SHOP = { name: 'Mestre dos Penteados', slug: 'mestre-dos-penteados', tagline: 'Barbearia · Est. 2018' };

// Ajusta bancos criados antes das colunas/tabelas novas e garante o admin supremo.
module.exports = async function setupDatabase() {
  await sequelize.sync();
  const statements = [
    `ALTER TABLE "Clients" ADD COLUMN IF NOT EXISTS "role" VARCHAR(255) NOT NULL DEFAULT 'client'`,
    'ALTER TABLE "Clients" ADD COLUMN IF NOT EXISTS "barbershopId" INTEGER',
    'ALTER TABLE "Barbers" ADD COLUMN IF NOT EXISTS "email" VARCHAR(255)',
    'ALTER TABLE "Barbers" ADD COLUMN IF NOT EXISTS "password" VARCHAR(255)',
    'ALTER TABLE "Barbers" ADD COLUMN IF NOT EXISTS "photo" TEXT',
    'ALTER TABLE "Barbers" ADD COLUMN IF NOT EXISTS "barbershopId" INTEGER',
    `ALTER TABLE "Appointments" ADD COLUMN IF NOT EXISTS "specialty" VARCHAR(255) NOT NULL DEFAULT 'Serviço'`,
    'ALTER TABLE "Appointments" ADD COLUMN IF NOT EXISTS "price" NUMERIC(10, 2)',
    'ALTER TABLE "Appointments" ADD COLUMN IF NOT EXISTS "barbershopId" INTEGER',
    'CREATE UNIQUE INDEX IF NOT EXISTS "barbers_email_unique" ON "Barbers" ("email") WHERE "email" IS NOT NULL',
  ];
  for (const statement of statements) await sequelize.query(statement);

  // Dados de antes das barbearias passam a pertencer à primeira barbearia.
  let shop = await Barbershop.findOne({ order: [['id', 'ASC']] });
  if (!shop) {
    shop = await Barbershop.create({ ...DEFAULT_SHOP, services: DEFAULT_SERVICES, commissionRate: DEFAULT_COMMISSION_RATE });
  }
  await sequelize.query('UPDATE "Barbers" SET "barbershopId" = :id WHERE "barbershopId" IS NULL', { replacements: { id: shop.id } });
  await sequelize.query(`UPDATE "Appointments" AS a SET "barbershopId" = b."barbershopId"
    FROM "Barbers" AS b WHERE a."barberId" = b.id AND a."barbershopId" IS NULL`);
  await sequelize.query('UPDATE "Appointments" SET "barbershopId" = :id WHERE "barbershopId" IS NULL', { replacements: { id: shop.id } });

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const [admin] = await Client.findOrCreate({
      where: { email },
      defaults: {
        name: process.env.ADMIN_NAME || 'Administrador',
        email,
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10),
        role: 'admin',
      },
    });
    if (admin.role !== 'admin' || admin.barbershopId) await admin.update({ role: 'admin', barbershopId: null });
  }
};
