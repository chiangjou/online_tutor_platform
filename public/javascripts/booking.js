const buttonElement = document.getElementById('book-class');
const selectElement = document.getElementById('bookDate');
const bookedDateElement = document.getElementById('booked-date');
const closeBookedButton = document.getElementById('close-booked-button');

selectElement.addEventListener('change', function () {
  const selectedDate = this.value;
  bookedDateElement.textContent = `時間：${selectedDate}`;
});

closeBookedButton.addEventListener('click', function () {
  location.reload();
});
