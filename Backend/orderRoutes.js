const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

router.route('/')
  .post(protect, orderController.createOrder)
  .get(protect, admin, orderController.getAllOrders);

router.get('/user', protect, orderController.getUserOrders);
router.post('/payment', protect, orderController.processPayment);
router.put('/:id/status', protect, admin, orderController.updateOrderStatus);

module.exports = router;
