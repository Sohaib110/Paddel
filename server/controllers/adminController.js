const Club = require('../models/Club');
const Team = require('../models/Team');
const Match = require('../models/Match');
const User = require('../models/User');
const Dispute = require('../models/Dispute');
const { finalizeMatchResult } = require('../services/matchmakingService');
const { createNotification } = require('../services/notificationService');

/**
 * COMPREHENSIVE ADMIN CONTROLS
 * Complete platform management for administrators
 */

// ==================== CLUB MANAGEMENT ====================

/**
 * Get all clubs
 * GET /api/admin/clubs
 */
const getAllClubs = async (req, res) => {
    try {
        const clubs = await Club.find()
            .populate('admin_ids', 'full_name email')
            .sort({ createdAt: -1 });

        res.json(clubs);
    } catch (error) {
        console.error('Error fetching clubs:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Create new club
 * POST /api/admin/clubs
 */
const createClub = async (req, res) => {
    try {
        const { name, location, phone_number, website_link, settings } = req.body;

        const club = new Club({
            name,
            location,
            phone_number,
            website_link,
            settings,
            admin_ids: [req.user._id] // Add creating admin
        });

        await club.save();

        res.status(201).json({ message: 'Club created successfully', club });
    } catch (error) {
        console.error('Error creating club:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Club with this name already exists' });
        }
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Update club
 * PUT /api/admin/clubs/:id
 */
const updateClub = async (req, res) => {
    try {
        const { name, location, phone_number, website_link, settings } = req.body;

        const club = await Club.findByIdAndUpdate(
            req.params.id,
            { name, location, phone_number, website_link, settings },
            { new: true, runValidators: true }
        );

        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        res.json({ message: 'Club updated successfully', club });
    } catch (error) {
        console.error('Error updating club:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Delete club
 * DELETE /api/admin/clubs/:id
 */
const deleteClub = async (req, res) => {
    try {
        const club = await Club.findByIdAndDelete(req.params.id);

        if (!club) {
            return res.status(404).json({ message: 'Club not found' });
        }

        res.json({ message: 'Club deleted successfully' });
    } catch (error) {
        console.error('Error deleting club:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== TEAM MANAGEMENT ====================

/**
 * Get all teams (with filtering)
 * GET /api/admin/teams
 */
const getAllTeams = async (req, res) => {
    try {
        const { club_id, status } = req.query;

        const filter = {};
        if (club_id) filter.club_id = club_id;
        if (status) filter.status = status;

        const teams = await Team.find(filter)
            .populate('captain_id', 'full_name email')
            .populate('player_2_id', 'full_name email')
            .populate('club_id', 'name')
            .sort({ points: -1 });

        res.json(teams);
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Force change team status
 * PUT /api/admin/teams/:id/status
 */
const forceChangeTeamStatus = async (req, res) => {
    try {
        const { status, reason } = req.body;

        if (!['PENDING_PARTNER', 'AVAILABLE', 'IN_MATCH', 'COOLDOWN', 'UNAVAILABLE', 'INACTIVE'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const team = await Team.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        ).populate('captain_id', 'full_name email');

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Notify team captain
        await createNotification({
            userId: team.captain_id._id,
            type: 'ADMIN_MESSAGE',
            title: 'Team Status Changed by Admin',
            message: `Your team status has been changed to ${status}. ${reason || ''}`,
            teamId: team._id
        });

        res.json({ message: 'Team status updated', team });
    } catch (error) {
        console.error('Error changing team status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Disable/Enable team
 * POST /api/admin/teams/:id/toggle-active
 */
const toggleTeamActive = async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);

        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }

        // Toggle between INACTIVE and AVAILABLE
        const newStatus = team.status === 'INACTIVE' ? 'AVAILABLE' : 'INACTIVE';

        // Use findByIdAndUpdate to avoid validation errors on legacy documents 
        // that might be missing newly required fields
        const updatedTeam = await Team.findByIdAndUpdate(
            req.params.id,
            { status: newStatus },
            { new: true }
        );

        res.json({ message: `Team ${newStatus === 'INACTIVE' ? 'disabled' : 'enabled'}`, team: updatedTeam });
    } catch (error) {
        console.error('Error toggling team:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Remove inactive teams
 * DELETE /api/admin/teams/remove-inactive
 */
const removeInactiveTeams = async (req, res) => {
    try {
        const result = await Team.deleteMany({ status: 'INACTIVE' });

        res.json({ message: `Removed ${result.deletedCount} inactive teams` });
    } catch (error) {
        console.error('Error removing inactive teams:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== MATCH MANAGEMENT ====================

/**
 * Get all matches (with filtering)
 * GET /api/admin/matches
 */
const getAllMatches = async (req, res) => {
    try {
        const { club_id, status } = req.query;

        const filter = {};
        if (club_id) filter.club_id = club_id;
        if (status) filter.status = status;

        const matches = await Match.find(filter)
            .populate('team_a_id', 'name points')
            .populate('team_b_id', 'name points')
            .populate('club_id', 'name')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json(matches);
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Force create match between two teams
 * POST /api/admin/matches/force-create
 */
const forceCreateMatch = async (req, res) => {
    try {
        const { team_a_id, team_b_id } = req.body;

        const teamA = await Team.findById(team_a_id);
        const teamB = await Team.findById(team_b_id);

        if (!teamA || !teamB) {
            return res.status(404).json({ message: 'One or both teams not found' });
        }

        if (teamA.club_id.toString() !== teamB.club_id.toString()) {
            return res.status(400).json({ message: 'Teams must be from the same club' });
        }

        // Create match
        const weekCycle = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));

        const match = new Match({
            club_id: teamA.club_id,
            team_a_id: teamA._id,
            team_b_id: teamB._id,
            status: 'SCHEDULED', // Admin override usually means they are ready to play
            week_cycle: weekCycle
        });

        await match.save();

        // Update team statuses
        teamA.status = 'IN_MATCH';
        teamB.status = 'IN_MATCH';
        await teamA.save();
        await teamB.save();

        // Notify both captains
        await createNotification({
            userId: teamA.captain_id,
            type: 'ADMIN_MESSAGE',
            title: 'Match Created by Admin',
            message: `A match has been created for your team vs ${teamB.name}`,
            matchId: match._id
        });

        await createNotification({
            userId: teamB.captain_id,
            type: 'ADMIN_MESSAGE',
            title: 'Match Created by Admin',
            message: `A match has been created for your team vs ${teamA.name}`,
            matchId: match._id
        });

        res.status(201).json({ message: 'Match created successfully', match });
    } catch (error) {
        console.error('Error force creating match:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Override match result
 * PUT /api/admin/matches/:id/override
 */
const overrideMatchResult = async (req, res) => {
    try {
        const { result, score, reason } = req.body;

        const match = await Match.findById(req.params.id)
            .populate('team_a_id')
            .populate('team_b_id');

        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }

        // Update match
        match.result = result;
        match.score = score;
        match.status = 'COMPLETED';
        await match.save();

        // Finalize immediately
        await finalizeMatchResult(match);

        // Notify both teams
        await createNotification({
            userId: match.team_a_id.captain_id,
            type: 'ADMIN_MESSAGE',
            title: 'Match Result Overridden',
            message: `Admin has overridden your match result. ${reason || ''}`,
            matchId: match._id
        });

        await createNotification({
            userId: match.team_b_id.captain_id,
            type: 'ADMIN_MESSAGE',
            title: 'Match Result Overridden',
            message: `Admin has overridden your match result. ${reason || ''}`,
            matchId: match._id
        });

        res.json({ message: 'Match result overridden', match });
    } catch (error) {
        console.error('Error overriding match:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Delete match
 * DELETE /api/admin/matches/:id
 */
const deleteMatch = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);

        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }

        // Reset team statuses if match was not completed
        if (!['COMPLETED', 'DISPUTED'].includes(match.status)) {
            await Team.findByIdAndUpdate(match.team_a_id, { status: 'AVAILABLE' });
            await Team.findByIdAndUpdate(match.team_b_id, { status: 'AVAILABLE' });
        }

        await Match.findByIdAndDelete(req.params.id);

        res.json({ message: 'Match deleted successfully' });
    } catch (error) {
        console.error('Error deleting match:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== DISPUTE MANAGEMENT ====================

/**
 * Get all disputes
 * GET /api/admin/disputes
 */
const getAllDisputes = async (req, res) => {
    try {
        const { status, club_id } = req.query;

        const filter = status ? { status } : {};
        if (club_id) filter.club_id = club_id;

        const disputes = await Dispute.find(filter)
            .populate({
                path: 'match_id',
                populate: [
                    { path: 'team_a_id', select: 'name' },
                    { path: 'team_b_id', select: 'name' }
                ]
            })
            .populate('disputed_by', 'full_name email')
            .populate('disputing_team_id', 'name')
            .sort({ createdAt: -1 });

        res.json(disputes);
    } catch (error) {
        console.error('Error fetching disputes:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Resolve dispute
 * PUT /api/admin/disputes/:id/resolve
 */
const resolveDispute = async (req, res) => {
    try {
        const { resolution, final_result, final_score, admin_notes } = req.body;

        const dispute = await Dispute.findById(req.params.id)
            .populate('match_id');

        if (!dispute) {
            return res.status(404).json({ message: 'Dispute not found' });
        }

        // Update dispute
        dispute.status = 'RESOLVED';
        dispute.resolution = resolution;
        dispute.final_result = final_result;
        dispute.final_score = final_score;
        dispute.admin_notes = admin_notes;
        dispute.resolved_by = req.user._id;
        dispute.resolved_at = new Date();
        await dispute.save();

        // Update match based on resolution
        const match = dispute.match_id;

        if (resolution === 'UPHOLD_ORIGINAL') {
            // Keep original result, just finalize
            await finalizeMatchResult(match);
        } else if (resolution === 'REVERSE_RESULT') {
            // Reverse the result
            match.result = match.result === 'WIN' ? 'LOSS' : 'WIN';
            match.score = final_score || match.score;
            await match.save();
            await finalizeMatchResult(match);
        } else if (resolution === 'VOID_MATCH') {
            // Void match - reset teams
            match.status = 'DISPUTED';
            await match.save();
            await Team.findByIdAndUpdate(match.team_a_id, { status: 'AVAILABLE' });
            await Team.findByIdAndUpdate(match.team_b_id, { status: 'AVAILABLE' });
        }

        // Notify disputing team
        await createNotification({
            userId: dispute.disputed_by,
            type: 'DISPUTE_RESOLVED',
            title: 'Dispute Resolved',
            message: `Admin has resolved your dispute. Resolution: ${resolution}. ${admin_notes || ''}`,
            matchId: match._id
        });

        res.json({ message: 'Dispute resolved', dispute });
    } catch (error) {
        console.error('Error resolving dispute:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== STATISTICS & REPORTS ====================

/**
 * Get platform statistics
 * GET /api/admin/stats
 */
const getPlatformStats = async (req, res) => {
    try {
        const stats = {
            totalClubs: await Club.countDocuments(),
            totalTeams: await Team.countDocuments(),
            activeTeams: await Team.countDocuments({ status: { $in: ['AVAILABLE', 'IN_MATCH', 'COOLDOWN'] } }),
            totalMatches: await Match.countDocuments(),
            activeMatches: await Match.countDocuments({ status: { $in: ['PROPOSED', 'ACCEPTED', 'SCHEDULED', 'AWAITING_CONFIRMATION', 'DISPUTED'] } }),
            totalDisputes: await Dispute.countDocuments(),
            pendingDisputes: await Dispute.countDocuments({ status: 'PENDING' }),
            totalUsers: await User.countDocuments()
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    // Club Management
    getAllClubs,
    createClub,
    updateClub,
    deleteClub,

    // Team Management
    getAllTeams,
    forceChangeTeamStatus,
    toggleTeamActive,
    removeInactiveTeams,

    // Match Management
    getAllMatches,
    forceCreateMatch,
    overrideMatchResult,
    deleteMatch,

    // Dispute Management
    getAllDisputes,
    resolveDispute,

    // Statistics
    getPlatformStats
};
