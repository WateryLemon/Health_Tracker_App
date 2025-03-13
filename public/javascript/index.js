const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    // password: '',
    database: 'userData'
  });

  module.exports = pool.promise();