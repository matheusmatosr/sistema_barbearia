module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    name: DataTypes.STRING,
    email: {
      type: DataTypes.STRING,
      unique: true,
    },
    password: DataTypes.STRING,
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'client',
    },
  });

  Client.associate = models => {
    Client.hasMany(models.Appointment, { foreignKey: 'clientId' });
  };

  return Client;
};
