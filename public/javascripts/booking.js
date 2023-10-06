const selectElement = document.getElementById('bookDate')
const bookedDateElement = document.getElementById('booked-date')
const confirmButton = document.getElementById('confirm-button')

selectElement.addEventListener('change', function () {
  const selectedDate = this.value
  bookedDateElement.textContent = `時間：${selectedDate}`
})

confirmButton.addEventListener('click', function () {
  location.reload()
})
