const Team = require('../models/Team');
const Match = require('../models/Match');
const Dispute = require('../models/Dispute');

/**
 * Check if a team is eligible for matchmaking
 * Based on PDF specification rules
 */
const isTeamEligible = (team, teamsWithDisputes = [], options = { isFriendly: false }) => {
    // Rule 1: Team has 2 confirmed players
    if (!team.player_2_id) return { eligible: false, reason: 'Partner required' };

    // Rule 2: Team has a unique team name (handled by schema validation)
    if (!team.name || team.name.trim() === '') return { eligible: false, reason: 'Team name required' };

    // Rule 3: Not currently in an active match
    if (team.status === 'IN_MATCH') return { eligible: false, reason: 'Already in an active match' };

    // Rule 4: Not in 7-day cooldown (Bypass for Friendly)
    if (team.status === 'COOLDOWN' && !options.isFriendly) {
        const cooldownRemaining = team.cooldown_expires_at ? Math.ceil((team.cooldown_expires_at - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
        return { eligible: false, reason: `In cooldown for ${cooldownRemaining} more days` };
    }

    // Rule 5: Not marked Unavailable
    if (team.status === 'UNAVAILABLE') {
        return { eligible: false, reason: 'Team marked as unavailable' };
    }

    // Rule 6: Not marked Inactive
    if (team.status === 'INACTIVE') {
        return { eligible: false, reason: 'Team is inactive' };
    }

    // Rule 7: NO ACTIVE DISPUTE
    if (teamsWithDisputes.includes(team._id.toString())) {
        return { eligible: false, reason: 'Team has an active dispute' };
    }

    // Rule 8: Must be AVAILABLE (or COOLDOWN if friendly)
    const allowedStatuses = options.isFriendly ? ['AVAILABLE', 'COOLDOWN'] : ['AVAILABLE'];
    if (!allowedStatuses.includes(team.status)) {
        return { eligible: false, reason: `Team is currently ${team.status}` };
    }

    return { eligible: true, reason: 'Eligible' };
};

/**
 * Find best opponent for a team based on PDF specification
 */
const findBestOpponent = async (team, options = { isFriendly: false }) => {
    try {
        // 1. Fetch active disputes in this club
        const activeDisputes = await Dispute.find({
            status: { $in: ['PENDING', 'UNDER_REVIEW'] }
        }).populate('match_id');

        const disputedTeamIds = activeDisputes.reduce((acc, d) => {
            if (d.match_id) {
                acc.push(d.match_id.team_a_id.toString());
                acc.push(d.match_id.team_b_id.toString());
            }
            return acc;
        }, []);

        // 2. Fetch last 2 opponents for repeat safeguard
        const lastTwoMatches = await Match.find({
            $or: [{ team_a_id: team._id }, { team_b_id: team._id }],
            status: 'COMPLETED'
        }).sort({ updatedAt: -1 }).limit(2);

        const recentOpponentIds = lastTwoMatches.map(m =>
            m.team_a_id.toString() === team._id.toString() ? m.team_b_id.toString() : m.team_a_id.toString()
        );

        // 3. Find and filter potential opponents
        const filter = {
            _id: { $ne: team._id },
            club_id: team.club_id,
            status: options.isFriendly ? { $in: ['AVAILABLE', 'COOLDOWN'] } : 'AVAILABLE',
            player_2_id: { $exists: true, $ne: null }
        };

        if (disputedTeamIds.length > 0) {
            filter._id = { ...filter._id, $nin: disputedTeamIds };
        }

        const potentialOpponents = await Team.find(filter);

        const eligibleOpponents = potentialOpponents.filter(opponent => {
            // Check specific eligibility rules
            const eligibilityCheck = isTeamEligible(opponent, disputedTeamIds, options);
            if (!eligibilityCheck.eligible) return false;

            // Avoid repeat opponents if alternatives exist
            if (recentOpponentIds.includes(opponent._id.toString())) {
                const hasOtherOptions = potentialOpponents.some(t =>
                    t._id.toString() !== opponent._id.toString() &&
                    !recentOpponentIds.includes(t._id.toString()) &&
                    isTeamEligible(t, disputedTeamIds, options).eligible
                );
                if (hasOtherOptions) return false;
            }

            return true;
        });

        if (eligibleOpponents.length === 0) {
            return { success: false, error: 'No eligible opponents found' };
        }

        // 4. Rank by closest league points
        const rankedOpponents = eligibleOpponents.sort((a, b) => {
            const pointsDiffA = Math.abs((a.points || 0) - (team.points || 0));
            const pointsDiffB = Math.abs((b.points || 0) - (team.points || 0));
            return pointsDiffA - pointsDiffB;
        });

        return { success: true, opponent: rankedOpponents[0] };

    } catch (error) {
        console.error('Error finding opponent:', error);
        return { success: false, error: 'Error finding opponent' };
    }
};

/**
 * Create a match with atomic locking to prevent double-matching
 */
const createMatchWithLocking = async (teamA, teamB, mode = 'COMPETITIVE') => {
    const session = await Team.startSession();
    session.startTransaction();

    try {
        // Lock both teams by updating their status
        // For Friendly, teams can be in COOLDOWN, but we still set them to IN_MATCH
        const allowedStatuses = mode === 'FRIENDLY' ? ['AVAILABLE', 'COOLDOWN'] : ['AVAILABLE'];

        const updatedTeamA = await Team.findOneAndUpdate(
            {
                _id: teamA._id,
                status: { $in: allowedStatuses }
            },
            {
                status: 'IN_MATCH',
                last_opponent_id: teamB._id
            },
            { session, new: true }
        );

        if (!updatedTeamA) {
            throw new Error('Team A no longer available');
        }

        const updatedTeamB = await Team.findOneAndUpdate(
            {
                _id: teamB._id,
                status: { $in: allowedStatuses }
            },
            {
                status: 'IN_MATCH',
                last_opponent_id: teamA._id
            },
            { session, new: true }
        );

        if (!updatedTeamB) {
            throw new Error('Team B no longer available');
        }

        // Calculate current week cycle
        const weekCycle = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));

        // Create the match
        const match = new Match({
            club_id: teamA.club_id,
            team_a_id: teamA._id,
            team_b_id: teamB._id,
            status: 'PROPOSED',
            mode: mode,
            week_cycle: weekCycle
        });

        await match.save({ session });

        // Commit transaction
        await session.commitTransaction();

        return { success: true, match, teamA: updatedTeamA, teamB: updatedTeamB };

    } catch (error) {
        await session.abortTransaction();
        console.error('Error creating match:', error);
        return { success: false, error: error.message };
    } finally {
        session.endSession();
    }
};

/**
 * Finalize match result and apply cooldown
 */
const finalizeMatchResult = async (match) => {
    const session = await Team.startSession();
    session.startTransaction();

    try {
        // Determine winner and loser
        const isTeamAWinner = match.result === 'WIN';
        const winnerTeamId = isTeamAWinner ? match.team_a_id : match.team_b_id;
        const loserTeamId = isTeamAWinner ? match.team_b_id : match.team_a_id;

        // Calculate cooldown expiry (7 days from now)
        const cooldownExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        // Update winner team
        const winnerUpdate = {
            $inc: { matches_played: 1 },
            last_match_completed_at: new Date()
        };

        if (match.mode === 'COMPETITIVE') {
            winnerUpdate.$inc.wins = 1;
            winnerUpdate.$inc.points = 3;
            winnerUpdate.status = 'COOLDOWN';
            winnerUpdate.cooldown_expires_at = cooldownExpiry;
        } else {
            // Friendly remains AVAILABLE (or goes back from COOLDOWN)
            winnerUpdate.status = 'AVAILABLE';
        }

        await Team.findByIdAndUpdate(
            winnerTeamId,
            winnerUpdate,
            { session }
        );

        // Update loser team
        const loserUpdate = {
            $inc: { matches_played: 1 },
            last_match_completed_at: new Date()
        };

        if (match.mode === 'COMPETITIVE') {
            loserUpdate.$inc.losses = 1;
            loserUpdate.status = 'COOLDOWN';
            loserUpdate.cooldown_expires_at = cooldownExpiry;
        } else {
            loserUpdate.status = 'AVAILABLE';
        }

        await Team.findByIdAndUpdate(
            loserTeamId,
            loserUpdate,
            { session }
        );

        // Update match status to COMPLETED (Finalized)
        match.status = 'COMPLETED';
        await match.save({ session });

        await session.commitTransaction();
        return { success: true };

    } catch (error) {
        await session.abortTransaction();
        console.error('Error finalizing match:', error);
        return { success: false, error: error.message };
    } finally {
        session.endSession();
    }
};

/**
 * Pair solo players into teams within a club
 */
const pairSoloPlayers = async (clubId) => {
    try {
        // 1. Find all players in the solo pool for this club
        const soloPlayers = await User.find({
            club_id: clubId,
            solo_pool_status: 'LOOKING'
        }).sort({ createdAt: 1 }); // Pair oldest first

        if (soloPlayers.length < 2) return { success: false, paired: 0 };

        let pairsCreated = 0;

        // 2. Iterate and pair in chunks of 2
        for (let i = 0; i < soloPlayers.length - 1; i += 2) {
            const player1 = soloPlayers[i];
            const player2 = soloPlayers[i + 1];

            // Create a temporary Friendly Team
            const teamName = `Friendly Team: ${player1.full_name.split(' ')[0]} & ${player2.full_name.split(' ')[0]}`;

            const team = await Team.create({
                club_id: clubId,
                name: teamName,
                captain_id: player1._id,
                player_2_id: player2._id,
                status: 'AVAILABLE',
                solo_pool: true
            });

            // Update player statuses
            player1.solo_pool_status = 'PAIRED';
            player2.solo_pool_status = 'PAIRED';
            await player1.save();
            await player2.save();

            pairsCreated++;

            // Notify both players
            const { createNotification } = require('./notificationService');
            await createNotification({
                userId: player1._id,
                type: 'TEAM_INVITE',
                title: 'Solo Partner Found!',
                message: `You have been paired with ${player2.full_name} for friendly games.`,
                teamId: team._id,
                actionUrl: '/dashboard'
            });

            await createNotification({
                userId: player2._id,
                type: 'TEAM_INVITE',
                title: 'Solo Partner Found!',
                message: `You have been paired with ${player1.full_name} for friendly games.`,
                teamId: team._id,
                actionUrl: '/dashboard'
            });
        }

        return { success: true, paired: pairsCreated };

    } catch (error) {
        console.error('Error pairing solo players:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    isTeamEligible,
    findBestOpponent,
    createMatchWithLocking,
    finalizeMatchResult,
    pairSoloPlayers
};
