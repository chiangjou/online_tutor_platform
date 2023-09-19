const express = require('express')
const exphbs = require('express-handlebars')
const routes = require('./routes')
const app = express()
const port = process.env.PORT || 3000

// handlebars
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs'
}))
app.set('view engine', 'hbs')

// public
app.use(express.static('public'))

// body-parser
app.use(express.urlencoded({ extended: true }))

app.use(routes)

app.listen(port, () => console.log(`App is listening on port http://localhost:${port}`))

module.exports = app
