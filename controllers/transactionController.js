const connection = require('../config/database'); // Sesuaikan dengan path database Anda

const generateInvoice = () => {
  return 'INV' + Math.floor(100000000 + Math.random() * 900000000).toString();
}

const userBalance = async (req, res) => {
  const userData = req.user;
  connection.execute(
    `SELECT balance FROM users where id = ?`,
    [userData.user_id],
    (error, rows, fields) => {
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          status: 999,
          message: "System error"
        });
      }

      const balance = rows[0].balance

      res.status(200).json({
        status: 0,
        message: "Get Balance Berhasil",
        balance: balance
      });
    }
  );
}

const topUp = async (req, res) => {
  const userData = req.user;
  let userBalance = 0

  const amount = req.body.top_up_amount;

  // Validate amount must be number and greater than 0
  if (!/^\d+$/.test(amount) || Number(amount) < 0) {
    return res.status(400).json({
      status: 102,
      message: "Paramter amount hanya boleh angka dan tidak boleh lebih kecil dari 0",
      data: null
    });
  } else {
    // Get existing user balance from db
    connection.execute(
      `SELECT balance FROM users where id = ?`,
      [userData.user_id],
      async (error, rows, fields) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({
            status: 999,
            message: "System error"
          });
        }

        userBalance = rows[0].balance

        //Total balance after top up
        let totalBalance = userBalance + req.body.top_up_amount;

        //Update balance to db
        await connection.execute(
          `UPDATE users 
            SET balance = ?
            WHERE id = ?`,
          [
            totalBalance,
            userData.user_id // dari token
          ]
        );

        //Insert transaction record
        await connection.execute(
          `INSERT INTO transaction (user_id, nominal, type, description, inv) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            userData.user_id,
            req.body.top_up_amount,
            'TOPUP',
            'Top Up Balance',
            generateInvoice()
          ]
        );

        return res.status(200).json({
          status: 0,
          message: "Top Up Balance berhasil",
          data: {
            balance: totalBalance
          }
        });
      }
    );
  }
}

const transaction = async (req, res) => {
  const userData = req.user;

  connection.execute(
    `SELECT * FROM services where code = ?`,
    [req.body.service_code],
    async (error, rows, fields) => {
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({
          status: 999,
          message: "System error"
        });
      }

      let dataService = rows[0]

      if (dataService.length === 0) {
        return res.status(400).json({
          status: 102,
          message: "Service ataus Layanan tidak ditemukan",
          data: null
        });
      } else {
        //Cek Saldo
        connection.execute(
          `SELECT balance FROM users WHERE id = ?`,
          [userData.user_id],
          (error, rows, fields) => {
            if (error) {
              console.error('Database error:', error);
              return res.status(500).json({
                status: 999,
                message: "System error"
              });
            }

            let userBalance = rows[0].balance

            //Cek Saldo
            if (userBalance < dataService.tarif) {
              return res.status(502).json({
                status: 102,
                message: "Saldo tidak cukup. Pastikan saldo anda cukup untuk melakukan transaksi",
              });
            } else {
              //Saldo cukup
              connection.execute(
                `SELECT balance FROM users where id = ?`,
                [userData.user_id],
                async (error, rows, fields) => {
                  if (error) {
                    console.error('Database error:', error);
                    return res.status(500).json({
                      status: 999,
                      message: "System error"
                    });
                  }

                  userBalance = rows[0].balance

                  //Total balance after top up
                  let totalBalance = userBalance - dataService.tarif;

                  console.log('totalBalance ', totalBalance)

                  //Update balance to db
                  await connection.execute(
                    `UPDATE users 
                      SET balance = ?
                      WHERE id = ?`,
                    [
                      totalBalance,
                      userData.user_id // dari token
                    ]
                  );

                  let invoice = generateInvoice()

                  //Insert transaction record
                  await connection.execute(
                    `INSERT INTO transaction (user_id, nominal, type, description, inv) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                      userData.user_id,
                      dataService.tarif,
                      'PAYMENT',
                      dataService.name,
                      invoice
                    ]
                  );

                  res.status(200).json({
                    status: 0,
                    message: "Transaksi berhasil",
                    data: {
                      invoice_number: invoice,
                      service_code: dataService.code,
                      service_name: dataService.name,
                      transaction_type: "PAYMENT",
                      total_amount: dataService.tarif,
                      created_on: new Date(),
                    }
                  });
                }
              );
            }
          }
        );
      }
    }
  );
}

const transactionHistory = async (req, res) => {
  const userData = req.user;

  let dataTransaction

  let limit = req.query.limit || 0
  let offset = req.query.offset || 0  

  if (limit > 0) {
    connection.execute(
      `SELECT * FROM transaction where user_id = ? order by created_on desc limit ? offset ? `,
      [userData.user_id, limit, offset],
      async (error, rows, fields) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({
            status: 999,
            message: "System error"
          });
        }
  
        dataTransaction = rows
  
        return res.status(200).json({
          status: 0,
          message: "Get History Berhasil",
          data: {
            offset: offset,
            limit: limit,
            records: dataTransaction
          }
        });
      }
    );
  } else {
    connection.execute(
      `SELECT * FROM transaction where user_id = ? order by created_on desc`,
      [userData.user_id],
      async (error, rows, fields) => {
        if (error) {
          console.error('Database error:', error);
          return res.status(500).json({
            status: 999,
            message: "System error"
          });
        }
  
        dataTransaction = rows
  
        return res.status(200).json({
          status: 0,
          message: "Get History Berhasil",
          data: {
            offset: offset,
            limit: limit,
            records: dataTransaction
          }
        });
      }
    );
  }
}

module.exports = {
  userBalance,
  topUp,
  transaction,
  transactionHistory
}