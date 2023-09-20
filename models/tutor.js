'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Tutor extends Model {
    static associate (models) {
      Tutor.belongsTo(models.User, { foreignKey: 'userId' })
      Tutor.hasMany(models.Course, { foreignKey: 'tutorId' })
    }
  };
  Tutor.init({
    tutorIntroduction: DataTypes.TEXT,
    teachingStyle: DataTypes.TEXT,
    duration: DataTypes.STRING,
    teachingTime: DataTypes.STRING,
    teachingLink: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Tutor',
    tableName: 'Tutors',
    underscored: true
  })
  return Tutor
}
