const Team = require('../models/Team');
const Match = require('../models/Match');
const Dispute = require('../models/Dispute');
const User = require('../models/User');

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

// Spec 1.4: ordered level bands — Beginner(0) ... Very Competitive(3)
const LEVEL_ORDER = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'VERY_COMPETITIVE'];

/**
 * Returns allowed level bands for a given team's experience_level.
 * Primary: same level. Secondary: ±1 band.
 * Hard rule: BEGINNER cannot match VERY_COMPETITIVE (and vice versa).
 */
const getAllowedLevelBands = (level) => {
    const idx = LEVEL_ORDER.indexOf(level);
    if (idx === -1) return LEVEL_ORDER; // unknown level → no restriction
    const adjacent = [];
    if (idx > 0) adjacent.push(LEVEL_ORDER[idx - 1]);
    if (idx < LEVEL_ORDER.length - 1) adjacent.push(LEVEL_ORDER[idx + 1]);
    // Remove the forbidden pairing: BEGINNER <-> VERY_COMPETITIVE
    const forbidden = level === 'BEGINNER' ? 'VERY_COMPETITIVE' : level === 'VERY_COMPETITIVE' ? 'BEGINNER' : null;
    const filtered = adjacent.filter(l => l !== forbidden);
    return { same: [level], expanded: filtered };
};

/**
 * Find best opponent for a team (spec 1.3 + 1.4)
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

        // 3. Build base eligibility filter
        const baseFilter = {
            _id: { $ne: team._id },
            club_id: team.club_id,
            status: options.isFriendly ? { $in: ['AVAILABLE', 'COOLDOWN'] } : 'AVAILABLE',
            player_2_id: { $exists: true, $ne: null }
        };
        if (disputedTeamIds.length > 0) {
            baseFilter._id = { ...baseFilter._id, $nin: disputedTeamIds };
        }

        /**
         * Filter + rank a candidate list by closest points, avoiding recent repeats.
         */
        const rankCandidates = (candidates, allCandidates) => {
            return candidates
                .filter(opponent => {
                    if (!isTeamEligible(opponent, disputedTeamIds, options).eligible) return false;
                    // Skip recent opponents only if fresher alternatives exist
                    if (recentOpponentIds.includes(opponent._id.toString())) {
                        const hasOtherOptions = allCandidates.some(t =>
                            t._id.toString() !== opponent._id.toString() &&
                            !recentOpponentIds.includes(t._id.toString()) &&
                            isTeamEligible(t, disputedTeamIds, options).eligible
                        );
                        if (hasOtherOptions) return false;
                    }
                    return true;
                })
                .sort((a, b) => Math.abs((a.points || 0) - (team.points || 0)) - Math.abs((b.points || 0) - (team.points || 0)));
        };

        // 4. Spec 1.4 — Level-aware search
        const teamLevel = team.experience_level;

        if (teamLevel && LEVEL_ORDER.includes(teamLevel)) {
            const bands = getAllowedLevelBands(teamLevel);

            // 4a. Primary: same level
            const sameLevel = await Team.find({ ...baseFilter, experience_level: { $in: bands.same } });
            const sameLevelRanked = rankCandidates(sameLevel, sameLevel);
            if (sameLevelRanked.length > 0) {
                return { success: true, opponent: sameLevelRanked[0] };
            }

            // 4b. Secondary: ±1 band (Beginner↔Very Competitive blocked by getAllowedLevelBands)
            if (bands.expanded.length > 0) {
                const expandedLevel = await Team.find({ ...baseFilter, experience_level: { $in: bands.expanded } });
                const expandedRanked = rankCandidates(expandedLevel, expandedLevel);
                if (expandedRanked.length > 0) {
                    return { success: true, opponent: expandedRanked[0] };
                }
            }

            return { success: false, error: 'No eligible opponents found at your experience level or adjacent bands' };
        }

        // Fallback: no level set — search all eligible (legacy / solo-pool teams)
        const allCandidates = await Team.find(baseFilter);
        const ranked = rankCandidates(allCandidates, allCandidates);
        if (ranked.length === 0) {
            return { success: false, error: 'No eligible opponents found' };
        }
        return { success: true, opponent: ranked[0] };

    } catch (error) {
        console.error('Error finding opponent:', error);
        return { success: false, error: 'Error finding opponent' };
    }
};

/**
 * Create a match with atomic locking to prevent double-matching
 * Spec 2.5: Match creation + notifications occur in same transaction
 */
const createMatchWithLocking = async (teamA, teamB, mode = 'COMPETITIVE', notificationType = 'MATCH_CREATED') => {
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

        // Create the match (deadline = 7 days from now, per spec 1.3 step 8)
        const match = new Match({
            club_id: teamA.club_id,
            team_a_id: teamA._id,
            team_b_id: teamB._id,
            status: 'PROPOSED',
            mode: mode,
            week_cycle: weekCycle,
            match_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });

        await match.save({ session });

        // Spec 2.5: Match creation + notifications must occur in same database transaction
        const { notifyMatchCreated } = require('./notificationService');
        await notifyMatchCreated(match, teamA, teamB, notificationType, session);

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
            // Friendly mode (Spec 3.2): No cooldown
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
 * Pair solo players into teams within a club (Spec 3.1)
 * Uses level, availability, and mixed preference matching
 */
const pairSoloPlayers = async (clubId) => {
    try {
        console.log(`[MATCHMAKING] Running solo pairing for club ${clubId}...`);

        // 1. Find all players in the solo pool for this club
        const soloPlayers = await User.find({
            club_id: clubId,
            solo_pool_status: 'LOOKING'
        }).sort({ createdAt: 1 });

        if (soloPlayers.length < 2) return { success: false, paired: 0 };

        let pairsCreated = 0;
        const pairedUserIds = new Set();

        // 2. Sophisticated pairing loop
        for (let i = 0; i < soloPlayers.length; i++) {
            const player1 = soloPlayers[i];
            if (pairedUserIds.has(player1._id.toString())) continue;

            let bestPartner = null;
            let bestScore = -1;

            for (let j = i + 1; j < soloPlayers.length; j++) {
                const player2 = soloPlayers[j];
                if (pairedUserIds.has(player2._id.toString())) continue;

                // --- Match Criteria 1: Level (Same > +/- 1) ---
                const level1 = player1.experience_level || 'BEGINNER';
                const level2 = player2.experience_level || 'BEGINNER';
                const pos1 = LEVEL_ORDER.indexOf(level1);
                const pos2 = LEVEL_ORDER.indexOf(level2);
                const levelDiff = Math.abs(pos1 - pos2);

                if (levelDiff > 1) continue; // Skip if levels are too far apart (e.g. Beginner vs Advanced)

                // --- Match Criteria 2: Availability (Overlapping strings) ---
                const avail1 = player1.availability || [];
                const avail2 = player2.availability || [];
                const commonAvail = avail1.filter(v => avail2.includes(v));
                if (commonAvail.length === 0 && avail1.length > 0 && avail2.length > 0) continue;

                // --- Match Criteria 3: Mixed Preference ---
                // If either is strict 'NO' to mixed, and they are different genders, skip
                if (player1.gender !== player2.gender) {
                    if (player1.play_mixed === 'NO' || player2.play_mixed === 'NO') continue;
                }

                // Scoring
                let score = (3 - levelDiff) * 10; // Level is primary (30 pts for same, 20 pts for +/- 1)
                score += commonAvail.length * 5; // Availability is secondary

                if (score > bestScore) {
                    bestScore = score;
                    bestPartner = player2;
                }
            }

            if (bestPartner) {
                // We found a match! Create the team
                const teamName = `Friendly: ${player1.full_name.split(' ')[0]} & ${bestPartner.full_name.split(' ')[0]}`;

                // Derived Team level = max of both (Spec 3.1)
                const level1 = player1.experience_level || 'BEGINNER';
                const level2 = bestPartner.experience_level || 'BEGINNER';
                const teamLevel = LEVEL_ORDER.indexOf(level1) > LEVEL_ORDER.indexOf(level2) ? level1 : level2;

                const team = await Team.create({
                    club_id: clubId,
                    name: teamName,
                    captain_id: player1._id,
                    player_2_id: bestPartner._id,
                    status: 'AVAILABLE',
                    solo_pool: true,
                    experience_level: teamLevel,
                    mixed_gender_preference: (player1.play_mixed === 'YES' && bestPartner.play_mixed === 'YES') ? 'YES' :
                        (player1.play_mixed === 'NO' || bestPartner.play_mixed === 'NO') ? 'NO' : 'DOES_NOT_MATTER'
                });

                // Update player statuses
                player1.solo_pool_status = 'PAIRED';
                bestPartner.solo_pool_status = 'PAIRED';
                await player1.save();
                await bestPartner.save();

                pairedUserIds.add(player1._id.toString());
                pairedUserIds.add(bestPartner._id.toString());
                pairsCreated++;

                // Notify both
                const { createNotification } = require('./notificationService');
                await Promise.all([
                    createNotification({
                        userId: player1._id,
                        type: 'PARTNER_JOINED',
                        title: 'Solo Partner Found!',
                        message: `You have been paired with ${bestPartner.full_name} for friendly games.`,
                        teamId: team._id,
                        actionUrl: '/dashboard'
                    }),
                    createNotification({
                        userId: bestPartner._id,
                        type: 'PARTNER_JOINED',
                        title: 'Solo Partner Found!',
                        message: `You have been paired with ${player1.full_name} for friendly games.`,
                        teamId: team._id,
                        actionUrl: '/dashboard'
                    })
                ]);
            }
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
