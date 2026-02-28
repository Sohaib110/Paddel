const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    streamNotifications,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} = require('../controllers/notificationController');

// All routes require authentication
router.use(protect);

// SSE stream — must come BEFORE /:id routes
router.get('/stream', streamNotifications);

router.get('/', getNotifications);
router.post('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
