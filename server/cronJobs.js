const cron = require('node-cron');
const Match = require('./models/Match');
const Team = require('./models/Team');
const { finalizeMatchResult, findBestOpponent, createMatchWithLocking } = require('./services/matchmakingService');
const { notifyResultConfirmed, notifyCooldownExpired, notifyTeamInactive, notifyUnavailableReminder, notifyMatchCreated } = require('./services/notificationService');

/**
 * Cron Job 1: 48-Hour Auto-Confirmation
 * Runs every hour
 * Finds matches awaiting confirmation where deadline has passed
 * Auto-finalizes result and applies cooldown
 */
const autoConfirmMatches = cron.schedule('0 * * * *', async () => {
    try {
        console.log('[CRON] Running 48-hour auto-confirmation check...');

        const now = new Date();

        // Find matches awaiting confirmation (ACTIVE status but with results) with deadline passed
        const expiredMatches = await Match.find({
            status: 'AWAITING_CONFIRMATION', // spec 1.5: 48-hour window
            result: { $exists: true },
            confirmation_deadline: { $lte: now }
        }).populate('team_a_id team_b_id');

        for (const match of expiredMatches) {
            console.log(`[CRON] Auto-confirming match ${match._id}`);

            // Finalize the match
            const result = await finalizeMatchResult(match);

            if (result.success) {
                // Send notifications
                await notifyResultConfirmed(match, match.team_a_id, match.team_b_id, true);
                console.log(`[CRON] Match ${match._id} auto-confirmed successfully`);
            } else {
                console.error(`[CRON] Failed to auto-confirm match ${match._id}:`, result.error);
            }
        }

        console.log(`[CRON] Auto-confirmation complete. Processed ${expiredMatches.length} matches`);

    } catch (error) {
        console.error('[CRON] Error in auto-confirmation job:', error);
    }
});

/**
 * Cron Job 2: Cooldown Expiry Check
 * Runs daily at midnight
 * Finds teams with expired cooldowns and sets them to AVAILABLE
 */
const expireCooldowns = cron.schedule('0 0 * * *', async () => {
    try {
        console.log('[CRON] Running cooldown expiry check...');

        const now = new Date();

        const teamsToRelease = await Team.find({
            status: 'COOLDOWN',
            cooldown_expires_at: { $lte: now }
        });

        for (const team of teamsToRelease) {
            team.status = 'AVAILABLE';
            team.cooldown_expires_at = undefined;
            await team.save();

            await notifyCooldownExpired(team);
            console.log(`[CRON] Team ${team.name} cooldown expired, now AVAILABLE`);

            // --- Spec 2.2: Auto-create match for queued teams ---
            if (team.is_queued) {
                console.log(`[CRON] Team ${team.name} is queued — searching for opponent...`);
                try {
                    const populatedTeam = await Team.findById(team._id)
                        .populate('captain_id', 'full_name email phone_number')
                        .populate('player_2_id', 'full_name email');

                    const opponentResult = await findBestOpponent(populatedTeam);

                    if (opponentResult.success) {
                        const matchResult = await createMatchWithLocking(populatedTeam, opponentResult.opponent, 'COMPETITIVE');

                        if (matchResult.success) {
                            // Reset queue flag
                            populatedTeam.is_queued = false;
                            await populatedTeam.save();

                            await notifyMatchCreated(matchResult.match, matchResult.teamA, matchResult.teamB, 'MATCH_ASSIGNED');
                            console.log(`[CRON] Auto-match created for queued team ${team.name}`);
                        } else {
                            console.error(`[CRON] Auto-match conflict for team ${team.name}:`, matchResult.error);
                            // Leave is_queued = true so it retries next cycle
                        }
                    } else {
                        console.log(`[CRON] No opponent found for queued team ${team.name}: ${opponentResult.error}`);
                        // Leave is_queued = true so it retries next cycle
                    }
                } catch (queueErr) {
                    console.error(`[CRON] Error auto-matching queued team ${team.name}:`, queueErr);
                }
            }
        }

        console.log(`[CRON] Cooldown expiry complete. Released ${teamsToRelease.length} teams`);

    } catch (error) {
        console.error('[CRON] Error in cooldown expiry job:', error);
    }
});

/**
 * Cron Job 3: 30-Day Inactivity Detection
 * Runs daily at 2 AM
 * Finds teams with no matches in 30+ days and marks as INACTIVE
 */
const detectInactiveTeams = cron.schedule('0 2 * * *', async () => {
    try {
        console.log('[CRON] Running 30-day inactivity detection...');

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Find teams that haven't played in 30 days
        const inactiveTeams = await Team.find({
            status: { $in: ['AVAILABLE', 'COOLDOWN'] },
            $or: [
                { last_match_completed_at: { $lte: thirtyDaysAgo } },
                { last_match_completed_at: { $exists: false }, createdAt: { $lte: thirtyDaysAgo } }
            ]
        });

        for (const team of inactiveTeams) {
            team.status = 'INACTIVE';
            await team.save();

            // Notify captain
            await notifyTeamInactive(team);

            console.log(`[CRON] Team ${team.name} marked INACTIVE (30+ days no activity)`);
        }

        console.log(`[CRON] Inactivity detection complete. Marked ${inactiveTeams.length} teams inactive`);

    } catch (error) {
        console.error('[CRON] Error in inactivity detection job:', error);
    }
});

/**
 * Cron Job 4: Unavailable Return Date Reminders
 * Runs daily at 9 AM
 * Finds teams with unavailable_return_date = today and sends reminders
 */
const sendReturnReminders = cron.schedule('0 9 * * *', async () => {
    try {
        console.log('[CRON] Running unavailable return date reminders...');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find teams with return date today
        const teamsReturning = await Team.find({
            status: 'UNAVAILABLE',
            unavailable_return_date: {
                $gte: today,
                $lt: tomorrow
            }
        });

        for (const team of teamsReturning) {
            // Send reminder notification
            await notifyUnavailableReminder(team);

            console.log(`[CRON] Sent return reminder to team ${team.name}`);
        }

        console.log(`[CRON] Return reminders complete. Sent ${teamsReturning.length} reminders`);

    } catch (error) {
        console.error('[CRON] Error in return reminders job:', error);
    }
});

/**
 * Start all cron jobs
 */
const startCronJobs = () => {
    console.log('[CRON] Starting all cron jobs...');
    autoConfirmMatches.start();
    expireCooldowns.start();
    detectInactiveTeams.start();
    sendReturnReminders.start();
    processQueuedMatchmaking.start();
    console.log('[CRON] All cron jobs started successfully');
};

/**
 * Cron Job 5: Periodic Retry for Queued Teams (Spec 2.5)
 * Runs every hour
 * Finds AVAILABLE teams that are still is_queued and tries to find them a match
 */
const processQueuedMatchmaking = cron.schedule('0 * * * *', async () => {
    try {
        console.log('[CRON] Running periodic retry for queued teams...');

        const queuedTeams = await Team.find({
            status: 'AVAILABLE',
            is_queued: true
        });

        for (const team of queuedTeams) {
            console.log(`[CRON] Retrying matchmaking for queued team ${team.name}...`);
            try {
                const populatedTeam = await Team.findById(team._id)
                    .populate('captain_id', 'full_name email phone_number')
                    .populate('player_2_id', 'full_name email');

                const opponentResult = await findBestOpponent(populatedTeam);

                if (opponentResult.success) {
                    const matchResult = await createMatchWithLocking(populatedTeam, opponentResult.opponent, 'COMPETITIVE', 'MATCH_ASSIGNED');

                    if (matchResult.success) {
                        populatedTeam.is_queued = false;
                        await populatedTeam.save();
                        console.log(`[CRON] Auto-match created for retried queued team ${team.name}`);
                    }
                }
            } catch (err) {
                console.error(`[CRON] Error in retry for team ${team.name}:`, err);
            }
        }
    } catch (error) {
        console.error('[CRON] Error in processQueuedMatchmaking job:', error);
    }
});

/**
 * Stop all cron jobs
 */
const stopCronJobs = () => {
    console.log('[CRON] Stopping all cron jobs...');
    autoConfirmMatches.stop();
    expireCooldowns.stop();
    detectInactiveTeams.stop();
    sendReturnReminders.stop();
    processQueuedMatchmaking.stop();
    console.log('[CRON] All cron jobs stopped');
};

module.exports = {
    startCronJobs,
    stopCronJobs
};
