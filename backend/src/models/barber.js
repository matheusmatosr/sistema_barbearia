module.exports = (sequelize, DataTypes) => {
  const Barber = sequelize.define('Barber', {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: true },
    password: { type: DataTypes.STRING, allowNull: true },
    age: DataTypes.INTEGER,
    hireDate: DataTypes.DATE,
    photo: { type: DataTypes.TEXT, allowNull: true },
    specialties: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
  });

  Barber.associate = models => {
    Barber.hasMany(models.Appointment, { foreignKey: 'barberId' });
  };

  return Barber;
};
