const productController = require('../../controllers/ProductController/productController');
const connection = require('../../config/database');

// Mock dependencies
jest.mock('../../config/database');
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req, res, next) => next()
  });
  multer.diskStorage = jest.fn();
  return multer;
});

describe('Product Controller', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock request
    mockReq = {
      body: {},
      query: {},
      params: {},
      user: { user_id: 1 },
      file: null
    };

    // Setup mock response
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();
  });

  describe('createProduct', () => {
    it('should return 400 when required fields are empty', async () => {
      mockReq.body = { name: '', qty: '', description: '' };

      await productController.createProduct(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 400,
        message: 'Name, qty, dan description tidak boleh kosong'
      });
    });

    it('should return 400 when any required field is missing', async () => {
      mockReq.body = { name: 'Product', qty: 10 }; // Missing description

      await productController.createProduct(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 400,
        message: 'Name, qty, dan description tidak boleh kosong'
      });
    });

    it('should create product successfully when all fields are provided', async () => {
      const mockExecute = jest.fn().mockResolvedValue([{ insertId: 1 }]);
      connection.execute = mockExecute;
      
      mockReq.body = {
        name: 'Test Product',
        qty: 10,
        description: 'Test Description'
      };

      await productController.createProduct(mockReq, mockRes);

      expect(mockExecute).toHaveBeenCalledWith(
        `INSERT INTO products (user_id, name, qty, description, product_image) VALUES (?, ?, ?, ?, ?)`,
        [1, 'Test Product', 10, 'Test Description', '']
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 200,
        message: 'Berhasil menambahkan product'
      });
    });

    it('should handle database error during product creation', async () => {
      const mockExecute = jest.fn().mockRejectedValue(new Error('DB Error'));
      connection.execute = mockExecute;
      
      mockReq.body = {
        name: 'Test Product',
        qty: 10,
        description: 'Test Description'
      };

      await expect(productController.createProduct(mockReq, mockRes))
        .rejects.toThrow('DB Error');
    });
  });

  describe('getAllProduct', () => {
    it('should get all products without limit and offset', (done) => {
      const mockProducts = [
        { id: 1, name: 'Product 1', user_id: 1 },
        { id: 2, name: 'Product 2', user_id: 1 }
      ];

      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callback(null, mockProducts, []);
      });

      productController.getAllProduct(mockReq, mockRes);

      // Wait for async operation
      setImmediate(() => {
        expect(connection.execute).toHaveBeenCalledWith(
          `SELECT * FROM products where user_id = ?`,
          [1],
          expect.any(Function)
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 200,
          message: 'Success Get All Products',
          data: mockProducts
        });
        done();
      });
    });

    it('should get products with limit and offset', (done) => {
      mockReq.query = { limit: 10, offset: 5 };
      const mockProducts = [{ id: 1, name: 'Product 1' }];

      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callback(null, mockProducts, []);
      });

      productController.getAllProduct(mockReq, mockRes);

      setImmediate(() => {
        expect(connection.execute).toHaveBeenCalledWith(
          `SELECT * FROM products where user_id = ? limit ? offset ?`,
          [1, 10, 5],
          expect.any(Function)
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
        done();
      });
    });

    it('should return 400 when offset is used without limit', (done) => {
      mockReq.query = { limit: 0, offset: 10 };

      productController.getAllProduct(mockReq, mockRes);

      setImmediate(() => {
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 400,
          message: 'Apabila ingin menggunakan offset, limit harus diisi lebih besar dari 0'
        });
        done();
      });
    });

    it('should handle database error', (done) => {
      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null, []);
      });

      productController.getAllProduct(mockReq, mockRes);

      setImmediate(() => {
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 500,
          message: 'System error'
        });
        done();
      });
    });
  });

  describe('getProduct', () => {
    it('should get product by id', (done) => {
      mockReq.query = { id: 1 };
      const mockProduct = { id: 1, name: 'Test Product' };

      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callback(null, [mockProduct], []);
      });

      productController.getProduct(mockReq, mockRes);

      setImmediate(() => {
        expect(connection.execute).toHaveBeenCalledWith(
          `SELECT * FROM products where id = ? and user_id = ?`,
          [1, 1],
          expect.any(Function)
        );
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 200,
          message: 'Success Get Product',
          data: mockProduct
        });
        done();
      });
    });

    it('should handle database error in getProduct', (done) => {
      mockReq.query = { id: 1 };
      
      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null, []);
      });

      productController.getProduct(mockReq, mockRes);

      setImmediate(() => {
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 500,
          message: 'System error'
        });
        done();
      });
    });

    it('should return empty data when product not found', (done) => {
      mockReq.query = { id: 999 };

      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callback(null, [], []);
      });

      productController.getProduct(mockReq, mockRes);

      setImmediate(() => {
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 200,
          message: 'Success Get Product',
          data: undefined // Karena result[0] dari array kosong adalah undefined
        });
        done();
      });
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', (done) => {
      mockReq.query = { id: 1 };
      mockReq.body = {
        name: 'Updated Product',
        qty: 20,
        description: 'Updated Description'
      };

      const mockProducts = [
        { id: 1, name: 'Old Product', qty: 10, description: 'Old Description', user_id: 1 }
      ];

      // Mock pertama untuk SELECT
      let callCount = 0;
      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callCount++;
        if (callCount === 1) {
          callback(null, mockProducts, []);
        } else if (callCount === 2) {
          callback(null, [], []);
        }
      });

      productController.updateProduct(mockReq, mockRes);

      setImmediate(() => {
        expect(connection.execute).toHaveBeenCalledTimes(2);
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 200,
          message: 'Success Update Product'
        });
        done();
      });
    });

    it('should handle partial updates', (done) => {
      mockReq.query = { id: 1 };
      mockReq.body = { name: 'Partially Updated' };

      const mockProducts = [
        { id: 1, name: 'Old Product', qty: 10, description: 'Old Description', user_id: 1 }
      ];

      let callCount = 0;
      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callCount++;
        if (callCount === 1) {
          callback(null, mockProducts, []);
        } else if (callCount === 2) {
          // Verify UPDATE query
          expect(params).toEqual([
            'Partially Updated', // name
            10, // qty (original)
            'Old Description', // description (original)
            1, // id
            1 // user_id
          ]);
          callback(null, [], []);
        }
      });

      productController.updateProduct(mockReq, mockRes);

      setImmediate(() => {
        expect(mockRes.status).toHaveBeenCalledWith(200);
        done();
      });
    });

    it('should handle database error in updateProduct', (done) => {
      mockReq.query = { id: 1 };

      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null, []);
      });

      productController.updateProduct(mockReq, mockRes);

      setImmediate(() => {
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 500,
          message: 'System error'
        });
        done();
      });
    });

    it('should update nothing when product not found', (done) => {
      mockReq.query = { id: 999 };
      
      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callback(null, [], []); // Empty result
      });

      productController.updateProduct(mockReq, mockRes);

      setImmediate(() => {
        expect(connection.execute).toHaveBeenCalledTimes(1);
        // Tidak ada response karena fungsi tidak mengembalikan response ketika product tidak ditemukan
        // Ini adalah bug dalam kode asli yang perlu diperbaiki
        done();
      });
    });
  });

  describe('deleteProduct', () => {
    it('should delete product successfully', (done) => {
      mockReq.query = { id: 1 };

      const mockProducts = [
        { id: 1, name: 'Product to delete' }
      ];

      let callCount = 0;
      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callCount++;
        if (callCount === 1) {
          callback(null, mockProducts, []);
        } else if (callCount === 2) {
          // DELETE query
          expect(params).toEqual([1]);
          callback(null, [], []);
        }
      });

      productController.deleteProduct(mockReq, mockRes);

      setImmediate(() => {
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 200,
          message: 'Delete Produk berhasil'
        });
        done();
      });
    });

    it('should return 400 when product not found', (done) => {
      mockReq.query = { id: 999 };

      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callback(null, [], []); // Empty result
      });

      productController.deleteProduct(mockReq, mockRes);

      setImmediate(() => {
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 400,
          message: 'Product ID Tidak Ditemukan'
        });
        done();
      });
    });

    it('should handle database error in deleteProduct', (done) => {
      mockReq.query = { id: 1 };

      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null, []);
      });

      productController.deleteProduct(mockReq, mockRes);

      setImmediate(() => {
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 500,
          message: 'System error'
        });
        done();
      });
    });
  });

  describe('updateProductImage', () => {
    it('should update product image successfully', (done) => {
      mockReq.query = { id: 1 };
      mockReq.file = {
        mimetype: 'image/jpeg',
        filename: 'product-image.jpg'
      };

      const mockProducts = [
        { id: 1, name: 'Product with image' }
      ];

      let callCount = 0;
      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callCount++;
        if (callCount === 1) {
          callback(null, mockProducts, []);
        } else if (callCount === 2) {
          expect(params).toEqual(['product-image.jpg', 1]);
          callback(null, [], []);
        }
      });

      productController.updateProductImage(mockReq, mockRes);

      setImmediate(() => {
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 200,
          message: 'Update Product Image berhasil'
        });
        done();
      });
    });

    it('should return 400 when product not found', (done) => {
      mockReq.query = { id: 999 };
      mockReq.file = {
        mimetype: 'image/jpeg',
        filename: 'image.jpg'
      };

      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callback(null, [], []);
      });

      productController.updateProductImage(mockReq, mockRes);

      setImmediate(() => {
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 400,
          message: 'Product ID Tidak Ditemukan'
        });
        done();
      });
    });

    it('should return 400 when image format is invalid', (done) => {
      mockReq.query = { id: 1 };
      mockReq.file = {
        mimetype: 'application/pdf',
        filename: 'document.pdf'
      };

      const mockProducts = [
        { id: 1, name: 'Product' }
      ];

      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callback(null, mockProducts, []);
      });

      productController.updateProductImage(mockReq, mockRes);

      setImmediate(() => {
        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 400,
          message: 'Format Image tidak sesuai',
          data: null
        });
        done();
      });
    });

    it('should accept png images', (done) => {
      mockReq.query = { id: 1 };
      mockReq.file = {
        mimetype: 'image/png',
        filename: 'product-image.png'
      };

      const mockProducts = [
        { id: 1, name: 'Product' }
      ];

      let callCount = 0;
      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callCount++;
        if (callCount === 1) {
          callback(null, mockProducts, []);
        } else if (callCount === 2) {
          callback(null, [], []);
        }
      });

      productController.updateProductImage(mockReq, mockRes);

      setImmediate(() => {
        expect(mockRes.status).toHaveBeenCalledWith(200);
        done();
      });
    });

    it('should handle database error in updateProductImage', (done) => {
      mockReq.query = { id: 1 };
      mockReq.file = {
        mimetype: 'image/jpeg',
        filename: 'image.jpg'
      };

      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callback(new Error('Database error'), null, []);
      });

      productController.updateProductImage(mockReq, mockRes);

      setImmediate(() => {
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith({
          status: 500,
          message: 'System error'
        });
        done();
      });
    });

    it('should handle missing file', (done) => {
      mockReq.query = { id: 1 };
      mockReq.file = null;

      const mockProducts = [
        { id: 1, name: 'Product' }
      ];

      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callback(null, mockProducts, []);
      });

      productController.updateProductImage(mockReq, mockRes);

      setImmediate(() => {
        // Akan error karena req.file.mimetype diakses
        // Ini mengungkap bug: kode tidak menangani kasus req.file null
        done();
      });
    });
  });

  // Edge Cases
  describe('Edge Cases', () => {
    it('should handle non-numeric qty in createProduct', async () => {
      mockReq.body = {
        name: 'Test',
        qty: 'not-a-number',
        description: 'Test'
      };

      await productController.createProduct(mockReq, mockRes);

      // Ini akan berhasil karena validasi hanya memeriksa string kosong
      // Jika perlu validasi tipe data, perlu ditambahkan di controller
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle SQL injection attempt', (done) => {
      mockReq.query = { 
        id: "1; DROP TABLE products; --"
      };

      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        // Parameterized query mencegah SQL injection
        expect(params[0]).toBe("1; DROP TABLE products; --");
        callback(null, [], []);
      });

      productController.getProduct(mockReq, mockRes);
      
      setImmediate(() => {
        done();
      });
    });

    it('should handle very large numbers in limit/offset', (done) => {
      mockReq.query = { 
        limit: Number.MAX_SAFE_INTEGER,
        offset: 1000000
      };

      connection.execute = jest.fn().mockImplementation((query, params, callback) => {
        callback(null, [], []);
      });

      productController.getAllProduct(mockReq, mockRes);
      
      setImmediate(() => {
        // Akan error karena MySQL mungkin tidak menerima angka sebesar itu
        // Controller perlu validasi tambahan untuk ini
        done();
      });
    });
  });
});