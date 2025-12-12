const multer = require('multer');
const path = require('path');

const connection = require('../../config/database');

const createProduct = async (req, res) => {
    console.log('Create Product Endpoint');

    if (req?.body?.name == '' || req?.body?.qty == '' || req?.body?.description == '') {
        return res.status(400).json({
            status: 400,
            message: 'Name, qty, dan description tidak boleh kosong',
        });
    } else {
        let userData = req.user
        let userID = userData.user_id
        await connection.execute(
            `INSERT INTO products (user_id, name, qty, description, product_image) 
       VALUES (?, ?, ?, ?, ?)`,
            [
                userID,
                req.body.name,
                req.body.qty,
                req.body.description,
                ''
            ]
        );

        return res.status(200).json({
            status: 200,
            message: "Berhasil menambahkan product",
        });
    }

}

const getAllProduct = async (req, res) => {
    console.log('Get All Product Endpoint');
    let limit = req?.query?.limit || 0
    let offset = req?.query?.offset || 0

    let userData = req.user
    let userID = userData.user_id

    if (limit == 0 || limit == '0') {
        if (offset != 0) {
            return res.status(400).json({
                status: 400,
                message: "Apabila ingin menggunakan offset, limit harus diisi lebih besar dari 0",
            });
        } else {
            //Get All User Product
            connection.execute(
                `SELECT * FROM products where user_id = ?`,
                [userID],
                (error, rows, fields) => {
                    if (error) {
                        console.error('Database error:', error);
                        return res.status(500).json({
                            status: 500,
                            message: "System error"
                        });
                    }
                    const result = rows

                    return res.status(200).json({
                        status: 200,
                        message: "Success Get All Products",
                        data: result
                    });
                }
            );
        }
    } else {
        //Get Partial User Product
        connection.execute(
            `SELECT * FROM products where user_id = ? limit ? offset ?`,
            [userID, limit, offset],
            (error, rows, fields) => {
                if (error) {
                    console.error('Database error:', error);
                    return res.status(500).json({
                        status: 500,
                        message: "System error"
                    });
                }
                const result = rows

                return res.status(200).json({
                    status: 200,
                    message: "Success Get All Products",
                    data: result
                });
            }
        );
    }

}

const getProduct = async (req, res) => {
    console.log('Get Product Endpoint');

    let userData = req.user
    let userID = userData.user_id

    let productID = req.query.id

    connection.execute(
        `SELECT * FROM products where id = ? and user_id = ?`,
        [productID, userID],
        (error, rows, fields) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({
                    status: 500,
                    message: "System error"
                });
            }
            const result = rows

            return res.status(200).json({
                status: 200,
                message: "Success Get Product",
                data: result[0]
            });
        }
    );
}

const updateProduct = async (req, res) => {
    console.log('Update Product Endpoint');

    let userData = req.user
    let userID = userData.user_id

    connection.execute(
        `SELECT * FROM products`,
        (error, rows, fields) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({
                    status: 500,
                    message: "System error"
                });
            }
            const result = rows

            let found = false
            let productData
            result.forEach(data => {
                if (data.id == req.query.id) {
                    found = true
                    productData = data
                }
            });

            if (found) {
                connection.execute(
                    `UPDATE products 
                SET name = ?, qty = ?, description = ?
                WHERE id = ? and user_id = ?`,
                    [
                        req.body.name || productData.name,
                        req.body.qty || productData.qty,
                        req.body.description || productData.description,
                        req.body.id || productData.id,
                        userID
                    ]
                );

                return res.status(200).json({
                    status: 200,
                    message: "Success Update Product",
                });
            }
        }
    );
}

const deleteProduct = async (req, res) => {
    console.log('Delete Product Endpoint');

    let productID = req.query.id

    connection.execute(
        `SELECT * FROM products`,
        (error, rows, fields) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({
                    status: 500,
                    message: "System error"
                });
            }
            
            const result = rows
            let found = false

            result.forEach(data => {
                if (data.id == req.query.id) {
                    found = true
                }
            });

            if (!found) {
                return res.status(400).json({
                    status: 400,
                    message: "Product ID Tidak Ditemukan",
                });
            } else {
                connection.execute(
                    `DELETE FROM products WHERE id = ?`,
                    [productID]
                );

                return res.status(200).json({
                    status: 200,
                    message: "Delete Produk berhasil",
                });
            }
        }
    );
}

const updateProductImage = async (req, res) => {
    console.log('Update Product Image Endpoint');

    let productID = req.query.id

    connection.execute(
        `SELECT * FROM products`,
        (error, rows, fields) => {
            if (error) {
                console.error('Database error:', error);
                return res.status(500).json({
                    status: 500,
                    message: "System error"
                });
            }
            const result = rows
            let found = false

            result.forEach(data => {
                if (data.id == req.query.id) {
                    found = true
                }
            });

            if (!found) {
                return res.status(400).json({
                    status: 400,
                    message: "Product ID Tidak Ditemukan",
                });
            } else {
                // Validasi img must jpeg/jpg/png
                const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
                if (!allowedMimes.includes(req.file.mimetype)) {
                    return res.status(400).json({
                        status: 400,
                        message: 'Format Image tidak sesuai',
                        data: null
                    });
                } else {
                    connection.execute(
                        `UPDATE products 
                        SET product_image = ?
                        WHERE id = ?`,
                        [
                            req.file.filename,
                            productID
                        ]
                    );
                }

                return res.status(200).json({
                    status: 200,
                    message: "Update Product Image berhasil",
                });
            }
        }
    );
}

module.exports = {
    createProduct,
    getAllProduct,
    getProduct,
    updateProduct,
    deleteProduct,
    updateProductImage
}