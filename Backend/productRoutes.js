const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .get(productController.getProducts)
  .post(protect, admin, productController.createProduct);

router.route('/:id')
  .get(productController.getProductById)
  .put(protect, admin, productController.updateProduct)
  .delete(protect, admin, productController.deleteProduct);

module.exports = router;
