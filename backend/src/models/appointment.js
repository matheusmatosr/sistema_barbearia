module.exports = (sequelize, DataTypes) => {
  const Appointment = sequelize.define('Appointment', {
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Agendado',
    },
    specialty: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
  });

  Appointment.associate = (models) => {
    Appointment.belongsTo(models.Barber, { foreignKey: 'barberId' });
    Appointment.belongsTo(models.Client, { foreignKey: 'clientId' });
  };

  return Appointment;
};
