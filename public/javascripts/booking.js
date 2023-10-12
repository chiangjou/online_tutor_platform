const selectDateElement = document.getElementById('selectDate')
const bookedDateElement = document.getElementById('bookDate')
const confirmBookingBtn = document.getElementById('confirm-booking-btn')
const bookingForm = document.getElementById('booking-form')

function updateBookedDate () {
  const selectedDate = selectDateElement.value
  bookedDateElement.textContent = `時間：${selectedDate}`
}

function bookingConfirmation () {
  bookingForm.submit()
  location.reload()
}

selectDateElement.addEventListener('change', updateBookedDate)
confirmBookingBtn.addEventListener('click', bookingConfirmation)
