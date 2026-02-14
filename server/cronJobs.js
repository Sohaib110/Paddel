const cron = require('node-cron');
const Match = require('./models/Match');
const Team = require('./models/Team');
const { finalizeMatchResult } = require('./services/matchmakingService');
const { notifyResultConfirmed, notifyCooldownExpired, notifyTeamInactive, notifyUnavailableReminder } = require('./services/notificationService');

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
            status: 'ACTIVE',
            result: { $exists: true }, // Result has been submitted
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

        // Find teams in cooldown with expired cooldown_expires_at
        const teamsToRelease = await Team.find({
            status: 'COOLDOWN',
            cooldown_expires_at: { $lte: now }
        });

        for (const team of teamsToRelease) {
            team.status = 'AVAILABLE';
            team.cooldown_expires_at = undefined;
            await team.save();

            // Notify captain
            await notifyCooldownExpired(team);

            console.log(`[CRON] Team ${team.name} cooldown expired, now AVAILABLE`);
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
    console.log('[CRON] All cron jobs started successfully');
};

/**
 * Stop all cron jobs
 */
const stopCronJobs = () => {
    console.log('[CRON] Stopping all cron jobs...');
    autoConfirmMatches.stop();
    expireCooldowns.stop();
    detectInactiveTeams.stop();
    sendReturnReminders.stop();
    console.log('[CRON] All cron jobs stopped');
};

module.exports = {
    startCronJobs,
    stopCronJobs
};
