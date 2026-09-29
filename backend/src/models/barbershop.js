module.exports = (sequelize, DataTypes) => {
  const Barbershop = sequelize.define('Barbershop', {
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    tagline: { type: DataTypes.STRING, allowNull: true },
    logo: { type: DataTypes.TEXT, allowNull: true },
    services: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    contact: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
    commissionRate: { type: DataTypes.DECIMAL(4, 3), allowNull: false, defaultValue: 0.5 },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  });

  return Barbershop;
};
