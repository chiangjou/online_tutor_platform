const buttonElement = document.getElementById('book-class')
const selectElement = document.getElementById('bookDate')
const bookedDateElement = document.getElementById('booked-date')
const closeButton = document.getElementById('close-button')

selectElement.addEventListener('change', function () {
  const selectedDate = this.value
  bookedDateElement.textContent = `時間：${selectedDate}`
})

closeButton.addEventListener('click', function () {
  location.reload()
})
