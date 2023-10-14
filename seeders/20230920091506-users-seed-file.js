'use strict'
const bcrypt = require('bcryptjs')
const faker = require('faker')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const maxIntroductiontLength = 160
      const users = [
        {
          name: 'root',
          email: 'root@example.com',
          password: await bcrypt.hash('12345678', 10),
          is_admin: 1,
          is_tutor: 0,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'user1',
          email: 'user1@example.com',
          password: await bcrypt.hash('12345678', 10),
          avatar: `https://loremflickr.com/200/200/people/?lock=${Math.random() * 100}`,
          nation: faker.address.country(),
          introduction: faker.lorem.text().substring(0, maxIntroductiontLength),
          is_admin: 0,
          is_tutor: 0,
          created_at: new Date(),
          updated_at: new Date()
        }]

      const generateUsers = 60
      const maxNameLength = 10

      for (let i = 0; i < generateUsers; i++) {
        const name = faker.name.firstName().substring(0, maxNameLength)

        users.push({
          name: faker.name.firstName().substring(0, maxNameLength),
          email: `${name}@example.com`,
          password: bcrypt.hashSync(Math.random().toString(36).slice(-8), 10),
          avatar: `https://loremflickr.com/200/200/people/?lock=${Math.random() * 100}`,
          nation: faker.address.country(),
          introduction: faker.lorem.text().substring(0, maxIntroductiontLength),
          is_admin: 0,
          is_tutor: 0,
          created_at: new Date(),
          updated_at: new Date()
        })
      }

      await queryInterface.bulkInsert('Users', users, {})
      console.log('Users table seeding completed successfully.')
    } catch (error) {
      console.error('Error seeding Users.', error)
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.bulkDelete('Users', {})
      console.log('Users table reverted successfully.')
    } catch (error) {
      console.error('Error reverting Users table.', error)
    }
  }
}
