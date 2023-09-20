'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Tutor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
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
    underscored: true,
  });
  return Tutor;
};