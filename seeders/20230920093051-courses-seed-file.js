'use strict'
const faker = require('faker')
const { DateTime } = require('luxon')

function getRandomPastTime() {
  // 過去一年的隨機時間
  const now = DateTime.now();
  const pastDate = faker.date.between(now.minus({ years: 1 }).toJSDate(), now.toJSDate());

  // 18:00 到 22:00 之間每小時的 30 分或每整點
  const randomHours = Math.floor(Math.random() * 4) + 18
  const randomMinutes = Math.random() < 0.5 ? 0 : 30

  // 轉換台北時區
  const taipeiTime = DateTime.fromJSDate(pastDate, { zone: "Asia/Taipei" })
  const formattedTime = taipeiTime.set({ hour: randomHours, minute: randomMinutes, second: 0 })

  // 格式化時間為 "YYYY-MM-DD HH:mm:ss"
  const formattedPastTime = formattedTime.toFormat("yyyy-MM-dd HH:mm:ss")

  return formattedPastTime
}


function getRandomFutureTime () {
  // 未來兩週的隨機時間
  const futureDate = faker.date.between(
    new Date(),
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  )

  // 18:00 到 22:00 之間每小時的 30 分或每整點
  const randomHours = Math.floor(Math.random() * 4) + 18
  const randomMinutes = Math.random() < 0.5 ? 0 : 30

  // 轉換台北時區
  const taipeiTime = DateTime.fromJSDate(futureDate, { zone: "Asia/Taipei" })
  const formattedTime = taipeiTime.set({ hour: randomHours, minute: randomMinutes, second: 0 })

  // 格式化時間為 "YYYY-MM-DD HH:mm:ss"
  const formattedFutureTime = formattedTime.toFormat("yyyy-MM-dd HH:mm:ss")

  return formattedFutureTime
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const users = await queryInterface.sequelize.query('SELECT id from Users;')
      const tutors = await queryInterface.sequelize.query('SELECT id, duration from Tutors;')
      const courses = []

      // 每個學生都上過兩堂課，且尚未評分與留言
      users[0].forEach((user, i) => {
        Array.from({ length: 2 })
          .map((_, j) => {
            const randomTutorIndex = Math.floor(Math.random() * tutors[0].length)

            return courses.push({
              time: getRandomPastTime(),
              duration: tutors[0][randomTutorIndex].duration,
              is_done: 1,
              user_id: user.id,
              tutor_id: tutors[0][randomTutorIndex].id,
              created_at: new Date(),
              updated_at: new Date()
            })
          })
      })

      // 每個老師都上過兩堂課，且已被評分與留言
      tutors[0].forEach((tutor, i) => {
        Array.from({ length: 2 })
          .map((_, j) => {
            const randomUserIndex = Math.floor(Math.random() * users[0].length)
            const maxCommentLength = 100

            return courses.push({
              time: getRandomPastTime(),
              duration: tutor.duration,
              is_done: 1,
              rating: Math.floor(Math.random() * 5) + 1,
              comment: faker.lorem.text().substring(0, maxCommentLength),
              user_id: users[0][randomUserIndex].id,
              tutor_id: tutor.id,
              created_at: new Date(),
              updated_at: new Date()
            })
          })
      })

      // 每個老師有兩堂未上過的課
      tutors[0].forEach((tutor, i) => {
        Array.from({ length: 2 })
          .map((_, j) => {
            const randomUserIndex = Math.floor(Math.random() * users[0].length)

            return courses.push({
              time: getRandomFutureTime(),
              duration: tutor.duration,
              is_done: 0,
              user_id: users[0][randomUserIndex].id,
              tutor_id: tutor.id,
              created_at: new Date(),
              updated_at: new Date()
            })
          })
      })
      
      await queryInterface.bulkInsert('Courses', courses, {})
      console.log('Courses table seeding completed successfully.')
    } catch (error) {
      console.error('Error seeding Courses.', error)
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.bulkDelete('Courses', {})
      console.log('Courses table reverted successfully.')
    } catch (error) {
      console.error('Error reverting Courses table.', error)
    }
  }
}
