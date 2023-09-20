'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
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
    underscored: true,
  });
  return Course;
};