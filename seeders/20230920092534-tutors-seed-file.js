'use strict'
const faker = require('faker')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const users = await queryInterface.sequelize.query('SELECT id from Users WHERE name NOT IN ("root", "user1");')
      const shuffledUsers = users[0].sort(() => 0.5 - Math.random())

      await queryInterface.bulkInsert('Tutors',
        Array.from({ length: 15 }).map((d, i) => {
          queryInterface.sequelize.query(`UPDATE Users SET is_tutor = true WHERE id = ${shuffledUsers[i].id}`)

          const maxTextLength = 160
          return {
            tutor_introduction: faker.lorem.text().substring(0, maxTextLength),
            teaching_style: faker.lorem.text().substring(0, maxTextLength),
            duration: Math.random() < 0.5 ? 30 : 60,
            teaching_time: JSON.stringify(Array.from({ length: 7 }, (_, i) => (i + 1).toString()).sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 7) + 1)),
            teaching_link: faker.internet.url(),
            user_id: shuffledUsers[i].id,
            created_at: new Date(),
            updated_at: new Date()
          }
        })
      )
      console.log('Tutors table seeding completed successfully.')
    } catch (error) {
      console.error('Error seeding Tutors.', error)
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.bulkDelete('Tutors', {})
      console.log('Tutors table reverted successfully.')
    } catch (error) {
      console.error('Error reverting Tutors table.', error)
    }
  }
}
