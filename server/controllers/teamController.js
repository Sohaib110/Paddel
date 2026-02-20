const Team = require('../models/Team');
const User = require('../models/User');
const crypto = require('crypto');

// @desc    Create a new team
// @route   POST /api/teams
// @access  Private (Captain)
const createTeam = async (req, res) => {
    const { name, experience_level } = req.body;
    const club_id = req.user.club_id;

    // Validate experience_level
    const validLevels = ['0-1 Months', '2-4 Months', '5-9 Months', '10+ Months'];
    if (!experience_level || !validLevels.includes(experience_level)) {
        return res.status(400).json({
            message: `experience_level is required and must be one of: ${validLevels.join(', ')}`
        });
    }

    // A user can only be captain of one active team
    const existingTeam = await Team.findOne({ captain_id: req.user._id, status: { $ne: 'INACTIVE' } });
    if (existingTeam) {
        return res.status(400).json({ message: 'You already have an active team.' });
    }

    try {
        const team = await Team.create({
            club_id,
            name,
            experience_level,
            captain_id: req.user._id,
            status: 'PENDING_PARTNER'
        });
        res.status(201).json(team);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Team name already exists in this club.' });
        }
        throw err;
    }
};

// @desc    Invite partner
// @route   POST /api/teams/:id/invite
// @access  Private (Captain)
const invitePartner = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        if (team.captain_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Generate Invite Token
        const invite_token = crypto.randomBytes(20).toString('hex');
        team.invite_token = invite_token;

        // Critical: If the team has an old experience_level (e.g. 'BEGINNER'), 
        // saving will fail due to the updated enum. We'll handle this.
        await team.save();

        res.json({ message: 'Code generated. Share the token with your partner.', invite_token });
    } catch (error) {
        console.error('CRITICAL: Error generating invite:', error);
        console.error('TEAM STATE AT FAILURE:', JSON.stringify(team, null, 2));
        res.status(500).json({
            message: 'Invite generation failed. Server log has details.',
            error: error.message,
            stack: error.stack,
            teamId: req.params.id,
            userId: req.user._id
        });
    }
};

// @desc    Accept invite
// @route   POST /api/teams/accept-invite
// @access  Private (Player 2)
const acceptInvite = async (req, res) => {
    const { token } = req.body;

    const team = await Team.findOne({ invite_token: token });

    if (!team) {
        return res.status(400).json({ message: 'Invalid token' });
    }

    // Verify email matches invite_email if set
    if (team.invite_email && req.user.email !== team.invite_email) {
        return res.status(400).json({ message: 'This invite is not for you.' });
    }

    team.player_2_id = req.user._id;
    team.invite_token = undefined;
    team.invite_email = undefined;
    team.status = 'AVAILABLE';

    // Derive mixed_gender_preference from both players' play_mixed setting
    // Rule: both YES → YES, either NO → NO, otherwise → DOES_NOT_MATTER
    const captain = await User.findById(team.captain_id).select('play_mixed');
    const partner = req.user; // already loaded by auth middleware
    const captainPref = captain ? captain.play_mixed : null;
    const partnerPref = partner.play_mixed || null;

    if (captainPref === 'YES' && partnerPref === 'YES') {
        team.mixed_gender_preference = 'YES';
    } else if (captainPref === 'NO' || partnerPref === 'NO') {
        team.mixed_gender_preference = 'NO';
    } else {
        team.mixed_gender_preference = 'DOES_NOT_MATTER';
    }

    await team.save();

    res.json({ message: 'Invite accepted', team });
};

// @desc    Toggle team unavailable status
// @route   POST /api/teams/toggle-unavailable
// @access  Private (Captain)
const toggleUnavailable = async (req, res) => {
    try {
        const { unavailable_return_date } = req.body;

        const team = await Team.findOne({
            $or: [{ captain_id: req.user._id }, { player_2_id: req.user._id }]
        });

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Only captain can toggle
        if (team.captain_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Only captain can toggle availability' });
        }

        // Cannot toggle during active match
        if (team.status === 'IN_MATCH') {
            return res.status(400).json({ message: 'Cannot change availability during active match' });
        }

        // Toggle between AVAILABLE/PENDING_PARTNER and UNAVAILABLE
        if (team.status === 'UNAVAILABLE') {
            team.status = team.player_2_id ? 'AVAILABLE' : 'PENDING_PARTNER';
            team.unavailable_until = undefined;
            team.unavailable_return_date = undefined;
        } else {
            team.status = 'UNAVAILABLE';
            if (unavailable_return_date) {
                team.unavailable_return_date = new Date(unavailable_return_date);
            }
        }

        await team.save();

        res.json({
            message: `Team ${team.status === 'UNAVAILABLE' ? 'marked unavailable' : 'back to available'}`,
            status: team.status,
            unavailable_return_date: team.unavailable_return_date
        });

    } catch (error) {
        console.error('Error toggling unavailable:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get my team
// @route   GET /api/teams/me
// @access  Private
const getMyTeam = async (req, res) => {
    try {
        // Find team where user is captain OR player 2
        const team = await Team.findOne({
            $or: [{ captain_id: req.user._id }, { player_2_id: req.user._id }],
            status: { $ne: 'INACTIVE' } // Assuming we want active team
        }).populate('player_2_id', 'full_name');

        // If no team found, return null (200 OK) or 404? 
        // 200 with null is easier for frontend "create team" state.
        if (!team) return res.json(null);

        res.json(team);
    } catch (error) {
        console.error('Error in getMyTeam:', error);
        res.status(500).json({ message: 'Server error fetching your team', error: error.message });
    }
};

// @desc    Get League Table
// @route   GET /api/teams/league/:clubId
// @access  Public
const getLeagueTable = async (req, res) => {
    const { clubId } = req.params;

    try {
        const teams = await Team.find({
            club_id: clubId,
            status: { $ne: 'INACTIVE' }
        })
            .select('name points wins losses matches_played')
            .sort({ points: -1, wins: -1 }); // Sort by points desc, then wins

        res.json(teams);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const { pairSoloPlayers } = require('../services/matchmakingService');

// Toggle Solo Pool
const toggleSoloPool = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        const { experience_level, availability } = req.body;

        // Toggle user solo pool status
        if (user.solo_pool_status === 'LOOKING') {
            user.solo_pool_status = 'IDLE';
        } else {
            user.solo_pool_status = 'LOOKING';
            // Update preferences when joining
            if (experience_level) user.experience_level = experience_level;
            if (availability) user.availability = availability;
        }

        await user.save();

        let pairingMessage = '';
        if (user.solo_pool_status === 'LOOKING') {
            // Trigger pairing check for the club
            const result = await pairSoloPlayers(user.club_id);
            if (result.success && result.paired > 0) {
                pairingMessage = ` | Success! You have been paired with a partner.`;
            }
        }

        res.json({
            message: `Solo Pool ${user.solo_pool_status === 'LOOKING' ? 'enabled' : 'disabled'}${pairingMessage}`,
            solo_pool_status: user.solo_pool_status
        });

    } catch (error) {
        console.error('Error toggling solo pool:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Queue next match during cooldown (Spec 2.1)
// @route   POST /api/teams/queue-next
// @access  Private (Captain)
const queueNextMatch = async (req, res) => {
    try {
        const team = await Team.findOne({
            captain_id: req.user._id,
            status: { $ne: 'INACTIVE' }
        });

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Only captain can queue
        if (team.captain_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Only captain can queue the next match' });
        }

        // Can only queue during cooldown (result must be final first)
        if (team.status !== 'COOLDOWN') {
            return res.status(400).json({
                message: `Queue is only available during cooldown. Current status: ${team.status}`
            });
        }

        // Toggle queue
        team.is_queued = !team.is_queued;
        await team.save();

        res.json({
            message: team.is_queued
                ? 'Queued! Your next match will be created automatically when cooldown ends.'
                : 'Queue cancelled.',
            is_queued: team.is_queued,
            cooldown_expires_at: team.cooldown_expires_at
        });

    } catch (error) {
        console.error('Error queuing next match:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    createTeam,
    invitePartner,
    acceptInvite,
    getMyTeam,
    getLeagueTable,
    toggleSoloPool,
    toggleUnavailable,
    queueNextMatch
};
