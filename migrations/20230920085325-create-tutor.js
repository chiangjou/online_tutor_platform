'use strict'
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Tutors', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tutor_introduction: {
        type: Sequelize.TEXT
      },
      teaching_style: {
        type: Sequelize.TEXT
      },
      duration: {
        type: Sequelize.STRING
      },
      teaching_time: {
        type: Sequelize.STRING
      },
      teaching_link: {
        type: Sequelize.STRING
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    })
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Tutors')
  }
}
