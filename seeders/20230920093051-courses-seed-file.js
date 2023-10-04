'use strict'
const faker = require('faker')
const { DateTime } = require('luxon')

// 生成過去時間
function getRandomPastTime (teachingTime) {
  // 過去一年的隨機時間
  const now = DateTime.now().setZone('Asia/Taipei')
  const pastDate = faker.date.between(now.minus({ years: 1 }).toJSDate(), now.toJSDate())

  // 18:00 到 22:00 之間每小時的 30 分或每整點
  const randomHours = Math.floor(Math.random() * 4) + 18
  const randomMinutes = Math.random() < 0.5 ? 0 : 30

  // 轉換台北時區
  const taipeiTime = DateTime.fromJSDate(pastDate, { zone: 'Asia/Taipei' })
  const formattedTime = taipeiTime.set({ hour: randomHours, minute: randomMinutes, second: 0 })

  // 檢查生成的時間是否符合老師的 teaching_time
  // 獲取星期幾（0: 星期日, 1: 星期一, 2: 星期二 ...）
  const selectedDayOfWeek = formattedTime.weekday
  if (teachingTime.includes(selectedDayOfWeek.toString())) {
    const formattedPastTime = formattedTime.toFormat('yyyy-MM-dd HH:mm:ss')
    return formattedPastTime
  } else {
    // 如果不符合老師 teaching_time，重新生成時間
    return getRandomPastTime(teachingTime)
  }
}

function getRandomFutureTime (teachingTime) {
  // 未來兩週的隨機時間
  const futureDate = faker.date.between(
    DateTime.now().setZone('Asia/Taipei').toJSDate(),
    DateTime.now().setZone('Asia/Taipei').plus({ days: 14 }).toJSDate()
  )

  // 18:00 到 22:00 之間每小時的 30 分或每整點
  const randomHours = Math.floor(Math.random() * 4) + 18
  const randomMinutes = Math.random() < 0.5 ? 0 : 30

  // 轉換台北時區
  const taipeiTime = DateTime.fromJSDate(futureDate, { zone: 'Asia/Taipei' })
  const formattedTime = taipeiTime.set({ hour: randomHours, minute: randomMinutes, second: 0 })

  // 檢查生成的時間是否符合老師的 teaching_time
  // 獲取星期幾（0: 星期日, 1: 星期一, 2: 星期二 ...）
  const selectedDayOfWeek = formattedTime.weekday
  if (teachingTime.includes(selectedDayOfWeek.toString())) {
    const formattedFutureTime = formattedTime.toFormat('yyyy-MM-dd HH:mm:ss')
    return formattedFutureTime
  } else {
    // 如果不符合老師 teaching_time，重新生成時間
    return getRandomFutureTime(teachingTime)
  }
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const users = await queryInterface.sequelize.query('SELECT id from Users;')
      const tutors = await queryInterface.sequelize.query('SELECT id, duration, teaching_time from Tutors;')
      const courses = []
      const maxCommentLength = 100

      // 生成每個學生都上過兩堂課，且尚未評分與留言的課程
      users[0].forEach((user, i) => {
        Array.from({ length: 2 }).forEach(() => {
          const randomTutorIndex = Math.floor(Math.random() * tutors[0].length)
          const selectedTutor = tutors[0][randomTutorIndex]

          // 符合老師 teaching_time 的過去時間
          const pastTime = getRandomPastTime(selectedTutor.teaching_time)

          courses.push({
            time: pastTime,
            duration: selectedTutor.duration,
            is_done: 1,
            user_id: user.id,
            tutor_id: selectedTutor.id,
            created_at: new Date(),
            updated_at: new Date()
          })
        })
      })

      // 生成每個學生都上過兩堂課，且已經評分與留言的課程
      users[0].forEach((user, i) => {
        Array.from({ length: 2 }).forEach(() => {
          const randomTutorIndex = Math.floor(Math.random() * tutors[0].length)
          const selectedTutor = tutors[0][randomTutorIndex]

          // 符合老師 teaching_time 的過去時間
          const pastTime = getRandomPastTime(selectedTutor.teaching_time)

          courses.push({
            time: pastTime,
            duration: selectedTutor.duration,
            is_done: 1,
            rating: Math.floor(Math.random() * 5) + 1,
            comment: faker.lorem.text().substring(0, maxCommentLength),
            user_id: user.id,
            tutor_id: selectedTutor.id,
            created_at: new Date(),
            updated_at: new Date()
          })
        })
      })

      // 生成每個學生有兩堂未上過的課
      users[0].forEach((user, i) => {
        Array.from({ length: 2 }).forEach(() => {
          const randomTutorIndex = Math.floor(Math.random() * tutors[0].length)
          const selectedTutor = tutors[0][randomTutorIndex]

          // 符合老師 teaching_time 的未來時間
          const futureTime = getRandomFutureTime(selectedTutor.teaching_time)

          courses.push({
            time: futureTime,
            duration: selectedTutor.duration,
            is_done: 0,
            user_id: user.id,
            tutor_id: selectedTutor.id,
            created_at: new Date(),
            updated_at: new Date()
          })
        })
      })

      // 生成每個老師都上過兩堂課，且已被評分與留言
      tutors[0].forEach(tutor => {
        Array.from({ length: 2 }).forEach(() => {
          const randomUserIndex = Math.floor(Math.random() * users[0].length)
          const selectedUser = users[0][randomUserIndex]

          // 符合老師 teaching_time 的過去時間
          const pastTime = getRandomPastTime(tutor.teaching_time)

          courses.push({
            time: pastTime,
            duration: tutor.duration,
            is_done: 1,
            rating: Math.floor(Math.random() * 5) + 1,
            comment: faker.lorem.text().substring(0, maxCommentLength),
            user_id: selectedUser.id,
            tutor_id: tutor.id,
            created_at: new Date(),
            updated_at: new Date()
          })
        })
      })

      // 生成每個老師有兩堂未上過的課
      tutors[0].forEach(tutor => {
        Array.from({ length: 2 }).forEach(() => {
          const randomUserIndex = Math.floor(Math.random() * users[0].length)
          const selectedUser = users[0][randomUserIndex]

          // 符合老師 teaching_time 的未來時間
          const futureTime = getRandomFutureTime(tutor.teaching_time)

          courses.push({
            time: futureTime,
            duration: tutor.duration,
            is_done: 0,
            user_id: selectedUser.id,
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
