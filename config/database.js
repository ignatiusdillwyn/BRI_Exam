const mysql = require('mysql2');

// Create the connection to database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'bri_exam',
    password: 'Ultraman2!'
  });

module.exports = connection;