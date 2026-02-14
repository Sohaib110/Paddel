const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createTeam,
    invitePartner,
    acceptInvite,
    getMyTeam,
    getLeagueTable,
    toggleSoloPool,
    toggleUnavailable
} = require('../controllers/teamController');

// Team management
router.post('/', protect, createTeam);
router.post('/:id/invite', protect, invitePartner);
router.post('/accept-invite', protect, acceptInvite);
router.get('/me', protect, getMyTeam);
router.get('/league/:clubId', getLeagueTable);

// Team features
router.post('/toggle-solo-pool', protect, toggleSoloPool);
router.post('/toggle-unavailable', protect, toggleUnavailable);

module.exports = router;
