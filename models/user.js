'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate (models) {
      User.hasOne(models.Tutor, { foreignKey: 'userId' })
      User.hasMany(models.Course, { foreignKey: 'userId' })
    }
  };
  User.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    avatar: DataTypes.STRING,
    nation: DataTypes.STRING,
    introduction: DataTypes.TEXT,
    isAdmin: DataTypes.BOOLEAN,
    isTutor: DataTypes.BOOLEAN,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    underscored: true
  })
  return User
}
