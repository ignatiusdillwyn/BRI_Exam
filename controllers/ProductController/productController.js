const multer = require('multer');
const path = require('path');

const connection = require('../../config/database');

const createProduct = async (req, res) => {
    console.log('Create Product Endpoint');
    //   connection.execute(
    //     `SELECT * FROM banner`,
    //     (error, rows, fields) => {
    //       if (error) {
    //         console.error('Database error:', error);
    //         return res.status(500).json({
    //           status: 999,
    //           message: "System error"
    //         });
    //       }
    //       const result = rows

    //       res.status(200).json({
    //         status: 0,
    //         message: "Sukses",
    //         data: result
    //       });
    //     }
    //   );
}

const getAllProduct = async (req, res) => {
    console.log('Get All User Endpoint');
}

const getProduct = async (req, res) => {
    console.log('Get Product Endpoint');
}

const updateProduct = async (req, res) => {
    console.log('Update Product Endpoint');
}

const deleteProduct = async (req, res) => {
    console.log('Delete Product Endpoint');
}

module.exports = {
    createProduct,
    getAllProduct,
    getProduct,
    updateProduct,
    deleteProduct
}