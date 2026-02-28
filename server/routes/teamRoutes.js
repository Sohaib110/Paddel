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
    toggleUnavailable,
    queueNextMatch,
    getEligibility
} = require('../controllers/teamController');

// Team management
router.post('/', protect, createTeam);
router.post('/:id/invite', protect, invitePartner);
router.post('/accept-invite', protect, acceptInvite);
router.get('/me', protect, getMyTeam);
router.get('/league/:clubId', getLeagueTable);
router.get('/:teamId/eligibility', protect, getEligibility); // [B5]

// Team features
router.post('/toggle-solo-pool', protect, toggleSoloPool);
router.post('/toggle-unavailable', protect, toggleUnavailable);
router.post('/queue-next', protect, queueNextMatch);

module.exports = router;
