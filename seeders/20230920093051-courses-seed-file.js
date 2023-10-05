'use strict'
const faker = require('faker')
const { DateTime } = require('luxon')

// 生成隨機時間加進 bookedCourses
function generateRandomTime (teachingTime, bookedCourses, isPast) {
  const randomTime = getRandomTime(teachingTime, bookedCourses, isPast)
  bookedCourses.push(randomTime)
  return randomTime
}

// 生成隨機時間
function getRandomTime (teachingTime, bookedCourses, isPast) {
  const now = DateTime.now().setZone('Asia/Taipei')
  // 過去一年時間
  const minDate = isPast ? now.minus({ years: 1 }).toJSDate() : now.toJSDate()
  // 未來兩週時間
  const maxDate = isPast ? now.toJSDate() : now.plus({ days: 14 }).toJSDate()
  const time = faker.date.between(minDate, maxDate)

  // 生成介於 18:00~21:00 的每個整點或 30 分的時間
  const randomHours = Math.floor(Math.random() * 3) + 18
  const randomMinutes = Math.random() < 0.5 ? 0 : 30

  // 轉換台北時區
  const taipeiTime = DateTime.fromJSDate(time, { zone: 'Asia/Taipei' })
  const formattedTime = taipeiTime.set({ hour: randomHours, minute: randomMinutes, second: 0 })

  const selectedDayOfWeek = formattedTime.weekday
  const formattedRandomTime = formattedTime.toFormat('yyyy-MM-dd HH:mm:ss')

  // 檢查是否符合老師的 teaching time 及課程是否被預約
  if (teachingTime.includes(selectedDayOfWeek.toString()) && !bookedCourses.includes(formattedRandomTime)) {
    return formattedRandomTime
  } else {
    return getRandomTime(teachingTime, bookedCourses, isPast)
  }
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const users = await queryInterface.sequelize.query('SELECT id from Users;')
      const tutors = await queryInterface.sequelize.query('SELECT id, duration, teaching_time from Tutors;')
      const courses = []
      const maxCommentLength = 100
      const bookedCourses = {}

      // 每個學生都上過兩堂課，且尚未評分與留言的課程
      users[0].forEach((user, i) => {
        Array.from({ length: 2 }).forEach(() => {
          const randomTutorIndex = Math.floor(Math.random() * tutors[0].length)
          const selectedTutor = tutors[0][randomTutorIndex]

          if (!bookedCourses[selectedTutor.id]) {
            bookedCourses[selectedTutor.id] = []
          }

          const pastTime = generateRandomTime(selectedTutor.teaching_time, bookedCourses[selectedTutor.id], true)

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

      // 每個學生都上過兩堂課，且已經評分與留言的課程
      users[0].forEach((user, i) => {
        Array.from({ length: 2 }).forEach(() => {
          const randomTutorIndex = Math.floor(Math.random() * tutors[0].length)
          const selectedTutor = tutors[0][randomTutorIndex]

          if (!bookedCourses[selectedTutor.id]) {
            bookedCourses[selectedTutor.id] = []
          }

          const pastTime = generateRandomTime(selectedTutor.teaching_time, bookedCourses[selectedTutor.id], true)

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

          if (!bookedCourses[selectedTutor.id]) {
            bookedCourses[selectedTutor.id] = []
          }

          const futureTime = generateRandomTime(selectedTutor.teaching_time, bookedCourses[selectedTutor.id], false)

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

      // 每個老師都上過兩堂課，且已被評分與留言
      tutors[0].forEach(tutor => {
        Array.from({ length: 2 }).forEach(() => {
          const randomUserIndex = Math.floor(Math.random() * users[0].length)
          const selectedUser = users[0][randomUserIndex]

          if (!bookedCourses[tutor.id]) {
            bookedCourses[tutor.id] = []
          }

          const pastTime = generateRandomTime(tutor.teaching_time, bookedCourses[tutor.id], true)

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

          if (!bookedCourses[tutor.id]) {
            bookedCourses[tutor.id] = []
          }

          const futureTime = generateRandomTime(tutor.teaching_time, bookedCourses[tutor.id], false)

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
