'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    static associate (models) {
      Course.belongsTo(models.User, { foreignKey: 'userId' })
      Course.belongsTo(models.Tutor, { foreignKey: 'tutorId' })
    }
  };
  Course.init({
    time: DataTypes.DATE,
    duration: DataTypes.STRING,
    isDone: DataTypes.BOOLEAN,
    rating: DataTypes.INTEGER,
    comment: DataTypes.TEXT,
    userId: DataTypes.INTEGER,
    tutorId: DataTypes.INTEGER,
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Course',
    tableName: 'Courses',
    underscored: true
  })
  return Course
}
