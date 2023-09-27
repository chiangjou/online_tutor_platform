async function countryOptions () {
  try {
    const url = 'https://restcountries.com/v3.1/all'
    const response = await fetch(url)
    const data = await response.json()
    const select = document.getElementById('nation')

    // 按字母排序
    data.sort((a, b) => {
      const nameA = a.name.common.toUpperCase()
      const nameB = b.name.common.toUpperCase()
      return nameA.localeCompare(nameB)
    })

    // 尚未選擇國家時顯示選擇國家
    const initialOption = document.createElement('option')
    initialOption.value = ''
    initialOption.textContent = '選擇國家'
    select.appendChild(initialOption)

    // 選擇國家
    data.forEach(country => {
      const option = document.createElement('option')
      option.value = country.name.common
      option.textContent = country.name.common
      select.appendChild(option)
    })
  } catch (error) {
    console.error('Error fetching countries data:', error)
  }
}

document.addEventListener('DOMContentLoaded', countryOptions)

function updateNationValue (select) {
  const selectedOption = select.options[select.selectedIndex]
  const nationInput = document.getElementById('hiddenNation')
  nationInput.value = selectedOption.value
}

function submitForm () {
  const form = document.querySelector('.form-edit-profile')
  form.submit()
}
