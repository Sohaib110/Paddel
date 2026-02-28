const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    joinPool,
    leavePool,
    getPoolStatus,
    submitResult,
    getFriendlyHistory,
    findTeamMatch,
} = require('../controllers/friendlyController');

// All routes require authentication
router.use(protect);

// Solo pool
router.post('/join-pool', joinPool);
router.delete('/leave-pool', leavePool);
router.get('/pool-status', getPoolStatus);

// Optional result (no league impact)
router.post('/submit-result', submitResult);

// History
router.get('/history', getFriendlyHistory);

// Team-vs-team friendly
router.post('/find-team-match', findTeamMatch);

module.exports = router;
