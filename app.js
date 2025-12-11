const express = require('express')

const app = express()
const port = 3000

// Add middleware to parse JSON and URL-encoded bodies
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

const routes = require('./routes')
app.use(routes)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})