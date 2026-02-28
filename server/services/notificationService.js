const Notification = require('../models/Notification');
const User = require('../models/User');
const { pushToUser } = require('./sseService');

/**
 * Create a notification for a user
 */
const createNotification = async ({ userId, type, title, message, matchId = null, teamId = null, actionUrl = null, session = null }) => {
    try {
        const notification = new Notification({
            user_id: userId,
            type,
            title,
            message,
            match_id: matchId,
            team_id: teamId,
            action_url: actionUrl
        });

        await notification.save({ session });

        // Push real-time SSE event (non-blocking — fire and forget)
        setImmediate(() => pushToUser(userId, notification.toObject()));

        return { success: true, notification };
    } catch (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Create notifications for both team captains about a new match
 */
const notifyMatchCreated = async (match, teamA, teamB, notificationType = 'MATCH_CREATED', session = null) => {
    try {
        // Fetch captains to get their emails
        const [captainA, captainB] = await Promise.all([
            User.findById(teamA.captain_id),
            User.findById(teamB.captain_id)
        ]);

        // 1. In-account notifications (Atomic DB transaction if session provided)
        await Promise.all([
            createNotification({
                userId: teamA.captain_id,
                type: notificationType,
                title: 'Match Found!',
                message: `Your team "${teamA.name}" has been matched with "${teamB.name}". Connect via WhatsApp to schedule your game.`,
                matchId: match._id,
                teamId: teamA._id,
                actionUrl: '/dashboard',
                session
            }),
            createNotification({
                userId: teamB.captain_id,
                type: notificationType,
                title: 'Match Found!',
                message: `Your team "${teamB.name}" has been matched with "${teamA.name}". Connect via WhatsApp to schedule your game.`,
                matchId: match._id,
                teamId: teamB._id,
                actionUrl: '/dashboard',
                session
            })
        ]);

        return { success: true };
    } catch (error) {
        console.error('Error sending match notifications:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Notify opposing captain about result submission
 */
const notifyResultSubmitted = async (match, submittingTeam, opposingTeam, result) => {
    try {
        const resultText = result === 'WIN' ? 'won' : 'lost';

        await createNotification({
            userId: opposingTeam.captain_id,
            type: 'RESULT_SUBMITTED',
            title: 'Match Result Submitted',
            message: `${submittingTeam.name} reported they ${resultText}. Please confirm within 48 hours or the result will stand automatically.`,
            matchId: match._id,
            teamId: opposingTeam._id,
            actionUrl: '/dashboard'
        });

        return { success: true };
    } catch (error) {
        console.error('Error sending result notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Notify both captains about result confirmation
 */
const notifyResultConfirmed = async (match, teamA, teamB, isAutoConfirmed = false) => {
    try {
        const confirmType = isAutoConfirmed ? 'auto-confirmed' : 'confirmed';
        const notificationType = isAutoConfirmed ? 'RESULT_AUTO_CONFIRMED' : 'RESULT_CONFIRMED';

        await createNotification({
            userId: teamA.captain_id,
            type: notificationType,
            title: `Match Result ${confirmType === 'confirmed' ? 'Confirmed' : 'Auto-Confirmed'}`,
            message: `Your match result has been ${confirmType}. You're now in a 7-day cooldown period.`,
            matchId: match._id,
            teamId: teamA._id
        });

        await createNotification({
            userId: teamB.captain_id,
            type: notificationType,
            title: `Match Result ${confirmType === 'confirmed' ? 'Confirmed' : 'Auto-Confirmed'}`,
            message: `Your match result has been ${confirmType}. You're now in a 7-day cooldown period.`,
            matchId: match._id,
            teamId: teamB._id
        });

        return { success: true };
    } catch (error) {
        console.error('Error sending confirmation notifications:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Notify captain about cooldown expiry
 */
const notifyCooldownExpired = async (team) => {
    try {
        await createNotification({
            userId: team.captain_id,
            type: 'COOLDOWN_EXPIRED',
            title: 'Cooldown Period Ended',
            message: `Your team "${team.name}" is now available for matchmaking. Find your next match!`,
            teamId: team._id,
            actionUrl: '/dashboard'
        });

        return { success: true };
    } catch (error) {
        console.error('Error sending cooldown notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Notify captain about team inactivity
 */
const notifyTeamInactive = async (team) => {
    try {
        await createNotification({
            userId: team.captain_id,
            type: 'TEAM_INACTIVE',
            title: 'Team Marked Inactive',
            message: `Your team "${team.name}" has been marked inactive due to 30 days of inactivity. Contact admin to reactivate.`,
            teamId: team._id,
            actionUrl: '/dashboard'
        });

        return { success: true };
    } catch (error) {
        console.error('Error sending inactive notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Notify captain about unavailable return date
 */
const notifyUnavailableReminder = async (team) => {
    try {
        await createNotification({
            userId: team.captain_id,
            type: 'UNAVAILABLE_REMINDER',
            title: 'Ready to Return?',
            message: `Your team "${team.name}" return date has arrived. Update your availability status to start playing again.`,
            teamId: team._id,
            actionUrl: '/dashboard'
        });

        return { success: true };
    } catch (error) {
        console.error('Error sending reminder notification:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    createNotification,
    notifyMatchCreated,
    notifyResultSubmitted,
    notifyResultConfirmed,
    notifyCooldownExpired,
    notifyTeamInactive,
    notifyUnavailableReminder
};
