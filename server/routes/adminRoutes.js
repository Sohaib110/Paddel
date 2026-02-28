const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getAllClubs,
    createClub,
    updateClub,
    deleteClub,
    getAllTeams,
    forceChangeTeamStatus,
    toggleTeamActive,
    removeInactiveTeams,
    getAllMatches,
    forceCreateMatch,
    overrideMatchResult,
    deleteMatch,
    getAllDisputes,
    resolveDispute,
    getPlatformStats
} = require('../controllers/adminController');

// Apply admin middleware to all routes
router.use(protect);
router.use(admin);

// Club Management
router.get('/clubs', getAllClubs);
router.post('/clubs', createClub);
router.put('/clubs/:id', updateClub);
router.delete('/clubs/:id', deleteClub);

// Team Management
router.get('/teams', getAllTeams);
router.put('/teams/:id/status', forceChangeTeamStatus);
router.post('/teams/:id/toggle-active', toggleTeamActive);
router.delete('/teams/remove-inactive', removeInactiveTeams);

// Match Management
router.get('/matches', getAllMatches);
router.post('/matches/force-create', forceCreateMatch);
router.post('/matches/force', forceCreateMatch); // [B6] alias — frontend uses /matches/force
router.put('/matches/:id/override', overrideMatchResult);
router.delete('/matches/:id', deleteMatch);

// Dispute Management
router.get('/disputes', getAllDisputes);
router.put('/disputes/:id/resolve', resolveDispute);
router.post('/disputes/:id/resolve', resolveDispute); // [B7] alias — frontend uses POST

// Statistics
router.get('/stats', getPlatformStats);

module.exports = router;
