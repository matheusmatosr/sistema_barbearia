const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const Barbershop = require('./barbershop')(sequelize, Sequelize.DataTypes);
const Barber = require('./barber')(sequelize, Sequelize.DataTypes);
const Client = require('./client')(sequelize, Sequelize.DataTypes);
const Appointment = require('./appointment')(sequelize, Sequelize.DataTypes);

// A integridade entre barbearia e registros é garantida no código (constraints: false),
// para permitir a migração de bancos que já existiam antes das barbearias.
Barbershop.hasMany(Barber, { foreignKey: 'barbershopId', constraints: false });
Barbershop.hasMany(Client, { foreignKey: 'barbershopId', as: 'managers', constraints: false });
Barbershop.hasMany(Appointment, { foreignKey: 'barbershopId', constraints: false });

Barber.belongsTo(Barbershop, { foreignKey: 'barbershopId', constraints: false });
Client.belongsTo(Barbershop, { foreignKey: 'barbershopId', constraints: false });

Barber.hasMany(Appointment, { foreignKey: 'barberId' });
Client.hasMany(Appointment, { foreignKey: 'clientId' });

Appointment.belongsTo(Barber, { foreignKey: 'barberId' });
Appointment.belongsTo(Client, { foreignKey: 'clientId' });
Appointment.belongsTo(Barbershop, { foreignKey: 'barbershopId', constraints: false });

module.exports = { sequelize, Barbershop, Barber, Client, Appointment };
