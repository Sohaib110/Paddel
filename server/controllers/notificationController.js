const Notification = require('../models/Notification');

/**
 * Get all notifications for current user
 * GET /api/notifications
 */
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user_id: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = await Notification.countDocuments({
            user_id: req.user._id,
            is_read: false
        });

        res.json({ notifications, unreadCount });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Mark notification as read
 * POST /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user._id },
            { is_read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);

    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Mark all notifications as read
 * POST /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user_id: req.user._id, is_read: false },
            { is_read: true }
        );

        res.json({ message: 'All notifications marked as read' });

    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json({ message: 'Notification deleted' });

    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
};
