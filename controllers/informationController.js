const connection = require('../config/database'); // Sesuaikan dengan path database Anda

const banner = async (req, res) => {
  connection.execute(
    `SELECT * FROM banner`,
    (error, rows, fields) => {
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          status: 999,
          message: "System error"
        });
      }
      const result = rows

      res.status(200).json({
        status: 0,
        message: "Sukses",
        data: result
      });
    }
  );
}

const services = async (req, res) => {
  connection.execute(
    `SELECT * FROM services`,
    (error, rows, fields) => {
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          status: 999,
          message: "System error"
        });
      }
      const result = rows

      res.status(200).json({
        status: 0,
        message: "Sukses",
        data: result
      });
    }
  );
}

module.exports = {
  banner,
  services
}