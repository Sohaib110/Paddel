const FriendlyPool = require('../models/FriendlyPool');
const User = require('../models/User');
const Team = require('../models/Team');
const Match = require('../models/Match');
const { findBestOpponent, createMatchWithLocking } = require('../services/matchmakingService');
const { createNotification } = require('../services/notificationService');

/* ─────────────────────────────────────────────────────────────────────────────
 *  HELPERS
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * Spec pairing algorithm — run immediately when a player joins the pool.
 * Returns { paired: true, partner } or { paired: false }
 */
const attemptPairing = async (newEntry) => {
    // Find waiting players in the same club (excluding the new entrant)
    const candidates = await FriendlyPool.find({
        club_id: newEntry.club_id,
        status: 'WAITING',
        user_id: { $ne: newEntry.user_id },
    })
        .populate('user_id', 'full_name phone_number gender play_mixed experience_level')
        .sort({ createdAt: 1 }); // Longest-waiting first (spec rule)

    for (const candidate of candidates) {
        const cUser = candidate.user_id;

        // 1. Same experience level
        if (candidate.experience_level !== newEntry.experience_level) continue;

        // 2. Availability overlap — at least 1 common slot
        const overlap = candidate.availability.some(slot =>
            newEntry.availability.includes(slot)
        );
        if (!overlap) continue;

        // 3. playMixed compatibility
        const newUser = await User.findById(newEntry.user_id);
        if (newUser && cUser) {
            const newMixed = newUser.play_mixed || 'DOES_NOT_MATTER';
            const candMixed = cUser.play_mixed || 'DOES_NOT_MATTER';

            const newGender = newUser.gender;
            const candGender = cUser.gender;

            // Reject if either player says NO and genders differ
            if (
                (newMixed === 'NO' || candMixed === 'NO') &&
                newGender && candGender &&
                newGender !== candGender
            ) continue;
        }

        // ── Match found ───────────────────────────────────────────────────────
        const now = new Date();

        // Update both pool entries atomically
        await FriendlyPool.findByIdAndUpdate(candidate._id, {
            status: 'MATCHED',
            matched_with_id: newEntry.user_id,
            matched_at: now,
        });
        await FriendlyPool.findByIdAndUpdate(newEntry._id, {
            status: 'MATCHED',
            matched_with_id: candidate.user_id._id,
            matched_at: now,
        });

        // Send in-app notifications to both players
        const partnerUser = await User.findById(candidate.user_id._id);
        if (partnerUser) {
            await createNotification({
                userId: newEntry.user_id,
                type: 'MATCH_CREATED',
                title: 'Friendly Match Found!',
                message: `You've been paired with ${partnerUser.full_name} for a friendly game. Check the Friendly tab to connect!`,
                actionUrl: '/friendly',
            });
            await createNotification({
                userId: candidate.user_id._id,
                type: 'MATCH_CREATED',
                title: 'Friendly Match Found!',
                message: `You've been paired with ${newUser ? newUser.full_name : 'a player'} for a friendly game. Check the Friendly tab!`,
                actionUrl: '/friendly',
            });
        }

        return { paired: true, partner: cUser };
    }

    return { paired: false };
};

/* ─────────────────────────────────────────────────────────────────────────────
 *  CONTROLLERS
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * POST /api/friendly/join-pool
 * Solo player joins the pool and we immediately attempt pairing.
 */
const joinPool = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user || !user.club_id) {
            return res.status(400).json({ message: 'You must belong to a club to join the friendly pool' });
        }

        // Block if already in pool
        const existing = await FriendlyPool.findOne({ user_id: user._id });
        if (existing && existing.status === 'WAITING') {
            return res.status(409).json({ message: 'You are already in the pool', entry: existing });
        }
        // Clean up old matched/completed entry so they can re-join
        if (existing) await FriendlyPool.deleteOne({ user_id: user._id });

        // Build pool entry
        const entry = await FriendlyPool.create({
            user_id: user._id,
            club_id: user.club_id,
            experience_level: user.experience_level,
            availability: user.availability || [],
            play_mixed: user.play_mixed || 'DOES_NOT_MATTER',
            gender: user.gender,
        });

        // Update user solo pool status
        await User.findByIdAndUpdate(user._id, { solo_pool_status: 'LOOKING' });

        // Attempt immediate pairing
        const pairingResult = await attemptPairing(entry);

        return res.status(200).json({
            message: pairingResult.paired
                ? `Matched with ${pairingResult.partner.full_name}!`
                : 'Added to pool. Waiting for a compatible partner...',
            status: pairingResult.paired ? 'MATCHED' : 'WAITING',
            partner: pairingResult.partner || null,
        });

    } catch (error) {
        console.error('[Friendly] joinPool error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * DELETE /api/friendly/leave-pool
 * Remove current user from the solo pool.
 */
const leavePool = async (req, res) => {
    try {
        await FriendlyPool.deleteOne({ user_id: req.user._id });
        await User.findByIdAndUpdate(req.user._id, { solo_pool_status: 'IDLE' });
        res.json({ message: 'Left the friendly pool' });
    } catch (error) {
        console.error('[Friendly] leavePool error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/friendly/pool-status
 * Check if the current user is in the pool and their pairing status.
 */
const getPoolStatus = async (req, res) => {
    try {
        const entry = await FriendlyPool.findOne({ user_id: req.user._id })
            .populate('matched_with_id', 'full_name phone_number experience_level gender');

        if (!entry) {
            return res.json({ inPool: false, status: 'IDLE' });
        }

        res.json({
            inPool: true,
            status: entry.status,
            entry,
            partner: entry.matched_with_id || null,
            matchedAt: entry.matched_at,
        });
    } catch (error) {
        console.error('[Friendly] getPoolStatus error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * POST /api/friendly/submit-result
 * Optional win/loss recording — no league points impact.
 * Body: { result: 'WIN' | 'LOSS' }
 */
const submitResult = async (req, res) => {
    try {
        const { result } = req.body;
        if (!['WIN', 'LOSS'].includes(result)) {
            return res.status(400).json({ message: 'Result must be WIN or LOSS' });
        }

        const entry = await FriendlyPool.findOneAndUpdate(
            { user_id: req.user._id, status: 'MATCHED' },
            { result, status: 'COMPLETED' },
            { new: true }
        );

        if (!entry) {
            return res.status(404).json({ message: 'No active friendly match found' });
        }

        // Also complete partner's entry
        await FriendlyPool.findOneAndUpdate(
            { user_id: entry.matched_with_id, status: 'MATCHED' },
            { status: 'COMPLETED' }
        );

        // Reset solo_pool_status for both players
        await User.updateMany(
            { _id: { $in: [req.user._id, entry.matched_with_id] } },
            { solo_pool_status: 'IDLE' }
        );

        res.json({ message: 'Result recorded (no league points)', entry });
    } catch (error) {
        console.error('[Friendly] submitResult error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * GET /api/friendly/history
 * Friendly session history for current user.
 */
const getFriendlyHistory = async (req, res) => {
    try {
        const history = await FriendlyPool.find({
            user_id: req.user._id,
            status: { $in: ['MATCHED', 'COMPLETED'] },
        })
            .populate('matched_with_id', 'full_name experience_level')
            .sort({ createdAt: -1 })
            .limit(20);

        // Also fetch team-vs-team friendly matches
        const user = await User.findById(req.user._id);
        let teamFriendlyMatches = [];
        if (user) {
            const userTeam = await Team.findOne({ $or: [{ captain_id: user._id }, { player_2_id: user._id }] });
            if (userTeam) {
                teamFriendlyMatches = await Match.find({
                    $or: [{ team_a_id: userTeam._id }, { team_b_id: userTeam._id }],
                    mode: 'FRIENDLY',
                    status: { $in: ['COMPLETED', 'AWAITING_CONFIRMATION'] },
                })
                    .populate('team_a_id team_b_id', 'name')
                    .sort({ createdAt: -1 })
                    .limit(10);
            }
        }

        res.json({ soloHistory: history, teamHistory: teamFriendlyMatches });
    } catch (error) {
        console.error('[Friendly] getFriendlyHistory error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * POST /api/friendly/find-team-match
 * Existing 2v2 team finds a friendly opponent (no cooldown applied).
 * This wraps the existing matchmakingService with isFriendly=true.
 * Body: { teamId }
 */
const findTeamMatch = async (req, res) => {
    try {
        const { teamId } = req.body;
        if (!teamId) return res.status(400).json({ message: 'teamId required' });

        const myTeam = await Team.findById(teamId)
            .populate('captain_id', 'full_name phone_number')
            .populate('player_2_id', 'full_name');

        if (!myTeam) return res.status(404).json({ message: 'Team not found' });

        if (myTeam.captain_id._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Only team captain can initiate match' });
        }

        if (myTeam.status === 'IN_MATCH') {
            return res.status(400).json({ message: 'Team is already in a match' });
        }

        const opponentResult = await findBestOpponent(myTeam, { isFriendly: true });
        if (!opponentResult.success) {
            return res.status(404).json({ message: opponentResult.error || 'No available opponent found' });
        }

        const matchResult = await createMatchWithLocking(myTeam, opponentResult.opponent, 'FRIENDLY');
        if (!matchResult.success) {
            return res.status(409).json({ message: matchResult.error || 'Conflict, please retry' });
        }

        res.status(201).json({
            message: 'Friendly match created!',
            match: matchResult.match,
            opponent: { name: opponentResult.opponent.name, captain: opponentResult.opponent.captain_id },
        });
    } catch (error) {
        console.error('[Friendly] findTeamMatch error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    joinPool,
    leavePool,
    getPoolStatus,
    submitResult,
    getFriendlyHistory,
    findTeamMatch,
};
