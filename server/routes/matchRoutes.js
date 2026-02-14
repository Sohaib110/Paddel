const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    findMatch,
    submitResult,
    confirmMatch,
    disputeMatch,
    getMyActiveMatch,
    getMatchHistory,
    acceptMatch,
    scheduleMatch
} = require('../controllers/matchController');

// Match finding and management
router.post('/find/:teamId', protect, findMatch);
router.post('/submit', protect, submitResult);
router.post('/:id/confirm', protect, confirmMatch);
router.post('/:id/dispute', protect, disputeMatch);
router.post('/:id/accept', protect, acceptMatch);
router.post('/:id/schedule', protect, scheduleMatch);

// Get matches
router.get('/active', protect, getMyActiveMatch);
router.get('/history/:teamId', protect, getMatchHistory);

module.exports = router;
