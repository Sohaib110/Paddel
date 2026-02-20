const Match = require('../models/Match');
const Team = require('../models/Team');
const Dispute = require('../models/Dispute');
const { isTeamEligible, findBestOpponent, createMatchWithLocking, finalizeMatchResult } = require('../services/matchmakingService');
const { notifyMatchCreated, notifyResultSubmitted, notifyResultConfirmed } = require('../services/notificationService');

/**
 * Captain-initiated matchmaking
 * POST /api/matches/find/:teamId
 */
const findMatch = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const mode = req.query.mode || 'COMPETITIVE';
        const experienceOverride = req.query.experience;
        const isFriendly = mode === 'FRIENDLY';

        // 1. Verify requesting team
        const myTeam = await Team.findById(teamId)
            .populate('captain_id', 'full_name email phone_number')
            .populate('player_2_id', 'full_name email');

        if (!myTeam) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Verify user is captain
        if (myTeam.captain_id._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Only team captain can initiate matchmaking' });
        }

        // 2. Check eligibility
        const activeDisputes = await Dispute.find({
            status: { $in: ['PENDING', 'UNDER_REVIEW'] }
        }).populate('match_id');

        const disputedTeamIds = activeDisputes.reduce((acc, dispute) => {
            if (dispute.match_id) {
                acc.push(dispute.match_id.team_a_id.toString());
                acc.push(dispute.match_id.team_b_id.toString());
            }
            return acc;
        }, []);

        const eligibilityCheck = isTeamEligible(myTeam, disputedTeamIds, { isFriendly });
        if (!eligibilityCheck.eligible) {
            return res.status(400).json({
                message: eligibilityCheck.reason,
                details: eligibilityCheck.reason
            });
        }

        // 3. Find best opponent
        const opponentResult = await findBestOpponent(myTeam, { isFriendly, experienceOverride });
        if (!opponentResult.success) {
            return res.status(404).json({ message: opponentResult.error });
        }

        const opponent = opponentResult.opponent;

        // 4. Create match with atomic locking
        const matchResult = await createMatchWithLocking(myTeam, opponent, mode);
        if (!matchResult.success) {
            return res.status(409).json({ message: matchResult.error || 'Matchmaking conflict. Please try again.' });
        }

        // Match creation success (notifications already sent atomically inside transaction)

        // 6. Return success
        res.status(201).json({
            message: `${mode.toLowerCase()} match found!`,
            match: matchResult.match,
            opponent: {
                name: opponent.name,
                points: opponent.points,
                captain: opponent.captain_id
            }
        });

    } catch (error) {
        console.error('Error in findMatch:', error);
        res.status(500).json({ message: 'Server error during matchmaking' });
    }
};

/**
 * Submit match result
 * POST /api/matches/submit
 */
const submitResult = async (req, res) => {
    try {
        const { matchId, result, score } = req.body;

        // Validate input
        if (!['WIN', 'LOSS'].includes(result)) {
            return res.status(400).json({ message: 'Result must be WIN or LOSS' });
        }

        const match = await Match.findById(matchId)
            .populate('team_a_id')
            .populate('team_b_id');

        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }

        if (!['PROPOSED', 'ACCEPTED', 'SCHEDULED'].includes(match.status)) {
            return res.status(400).json({ message: 'Match is not in a submittable state' });
        }

        // Verify user is captain of one of the teams
        const isTeamACaptain = match.team_a_id.captain_id.toString() === req.user._id.toString();
        const isTeamBCaptain = match.team_b_id.captain_id.toString() === req.user._id.toString();

        if (!isTeamACaptain && !isTeamBCaptain) {
            return res.status(401).json({ message: 'Only team captains can submit results' });
        }

        // Update match
        // Store result from Team A's perspective
        if (isTeamACaptain) {
            match.result = result; // Captain A says they won/lost
        } else {
            match.result = result === 'WIN' ? 'LOSS' : 'WIN'; // Captain B says they won (means A lost), or they lost (means A won)
        }
        match.score = score;
        match.submitted_by = req.user._id;
        match.status = 'AWAITING_CONFIRMATION';

        // Set 48-hour confirmation deadline
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + 48);
        match.confirmation_deadline = deadline;

        await match.save();

        // Notify opposing captain
        const submittingTeam = isTeamACaptain ? match.team_a_id : match.team_b_id;
        const opposingTeam = isTeamACaptain ? match.team_b_id : match.team_a_id;

        await notifyResultSubmitted(match, submittingTeam, opposingTeam, result);

        res.json({ message: 'Result submitted successfully', match });

    } catch (error) {
        console.error('Error submitting result:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Accept a proposed match
 * POST /api/matches/:id/accept
 */
const acceptMatch = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate('team_a_id')
            .populate('team_b_id');

        if (!match) return res.status(404).json({ message: 'Match not found' });
        if (match.status !== 'PROPOSED') return res.status(400).json({ message: 'Match is not in proposed state' });

        // Only opposing captain (Team B) can accept
        if (match.team_b_id.captain_id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Only the invited captain can accept' });
        }

        match.status = 'ACCEPTED';
        await match.save();

        res.json({ message: 'Match accepted!', match });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Mark match as scheduled/ready
 * POST /api/matches/:id/schedule
 */
const scheduleMatch = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate('team_a_id')
            .populate('team_b_id');

        if (!match) return res.status(404).json({ message: 'Match not found' });
        if (match.status !== 'ACCEPTED') return res.status(400).json({ message: 'Match must be accepted before scheduling' });

        // Verify user is captain
        const isTeamACaptain = match.team_a_id.captain_id.toString() === req.user._id.toString();
        const isTeamBCaptain = match.team_b_id.captain_id.toString() === req.user._id.toString();

        if (!isTeamACaptain && !isTeamBCaptain) {
            return res.status(401).json({ message: 'Only captains can schedule' });
        }

        match.status = 'SCHEDULED';
        await match.save();

        res.json({ message: 'Match marked as scheduled!', match });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Confirm match result
 * POST /api/matches/:id/confirm
 */
const confirmMatch = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate('team_a_id')
            .populate('team_b_id');

        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }

        if (match.status !== 'AWAITING_CONFIRMATION') {
            return res.status(400).json({ message: 'Match is not awaiting confirmation' });
        }

        // Ensure user is not the one who submitted
        if (match.submitted_by.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot confirm your own submission' });
        }

        // Verify user is captain of opposing team
        const isTeamACaptain = match.team_a_id.captain_id.toString() === req.user._id.toString();
        const isTeamBCaptain = match.team_b_id.captain_id.toString() === req.user._id.toString();

        if (!isTeamACaptain && !isTeamBCaptain) {
            return res.status(401).json({ message: 'Only opposing captain can confirm' });
        }

        // Finalize match
        const finalizeResult = await finalizeMatchResult(match);
        if (!finalizeResult.success) {
            return res.status(500).json({ message: 'Error finalizing match' });
        }

        // Send notifications
        await notifyResultConfirmed(match, match.team_a_id, match.team_b_id, false);

        res.json({ message: 'Match confirmed and finalized!' });

    } catch (error) {
        console.error('Error confirming match:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Dispute match result
 * POST /api/matches/:id/dispute
 */
const disputeMatch = async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({ message: 'Dispute reason required' });
        }

        const match = await Match.findById(req.params.id)
            .populate('team_a_id')
            .populate('team_b_id');

        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }

        if (match.status !== 'AWAITING_CONFIRMATION') {
            return res.status(400).json({ message: 'Can only dispute matches awaiting confirmation' });
        }

        // Verify user is captain
        const isTeamACaptain = match.team_a_id.captain_id.toString() === req.user._id.toString();
        const isTeamBCaptain = match.team_b_id.captain_id.toString() === req.user._id.toString();

        if (!isTeamACaptain && !isTeamBCaptain) {
            return res.status(401).json({ message: 'Only team captains can dispute' });
        }

        const disputingTeam = isTeamACaptain ? match.team_a_id : match.team_b_id;

        // Create dispute record
        const dispute = new Dispute({
            club_id: match.club_id,
            match_id: match._id,
            disputed_by: req.user._id,
            disputing_team_id: disputingTeam._id,
            reason: reason.trim()
        });

        await dispute.save();

        // Update match status
        match.status = 'DISPUTED';
        await match.save();

        res.json({ message: 'Dispute submitted. Admin will review.', dispute });

    } catch (error) {
        console.error('Error creating dispute:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Dispute already exists for this match' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get active match for current user
 * GET /api/matches/active
 */
const getMyActiveMatch = async (req, res) => {
    try {
        // Find user's team
        const myTeam = await Team.findOne({
            $or: [{ captain_id: req.user._id }, { player_2_id: req.user._id }]
        });

        if (!myTeam) {
            return res.json(null);
        }

        // Find active match
        const match = await Match.findOne({
            $or: [{ team_a_id: myTeam._id }, { team_b_id: myTeam._id }],
            status: { $in: ['PROPOSED', 'ACCEPTED', 'SCHEDULED', 'AWAITING_CONFIRMATION', 'COMPLETED', 'DISPUTED'] }
        })
            .populate({
                path: 'team_a_id',
                select: 'name points captain_id',
                populate: { path: 'captain_id', select: 'full_name phone_number' }
            })
            .populate({
                path: 'team_b_id',
                select: 'name points captain_id',
                populate: { path: 'captain_id', select: 'full_name phone_number' }
            })
            .sort({ createdAt: -1 });

        res.json(match);

    } catch (error) {
        console.error('Error getting active match:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Get match history for current user's team
 * GET /api/matches/history/:teamId
 */
const getMatchHistory = async (req, res) => {
    try {
        const teamId = req.params.teamId;

        const matches = await Match.find({
            $or: [{ team_a_id: teamId }, { team_b_id: teamId }],
            status: { $in: ['COMPLETED', 'AWAITING_CONFIRMATION', 'DISPUTED'] }
        })
            .populate('team_a_id', 'name')
            .populate('team_b_id', 'name')
            .sort({ updatedAt: -1 })
            .limit(10);

        res.json(matches);

    } catch (error) {
        console.error('Error fetching match history:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    findMatch,
    submitResult,
    confirmMatch,
    disputeMatch,
    getMyActiveMatch,
    getMatchHistory,
    acceptMatch,
    scheduleMatch
};
