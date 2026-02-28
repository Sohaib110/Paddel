/**
 * SSE Client Registry
 * Keeps track of all open Server-Sent Event connections per user.
 * Maps userId (string) → Set<Express.Response>
 */
const sseClients = new Map();

/**
 * Register an SSE response for a user.
 * Called when the client opens /api/notifications/stream.
 */
const registerSSEClient = (userId, res) => {
    const id = userId.toString();
    if (!sseClients.has(id)) sseClients.set(id, new Set());
    sseClients.get(id).add(res);
};

/**
 * Unregister an SSE response (called on connection close).
 */
const unregisterSSEClient = (userId, res) => {
    const id = userId.toString();
    const clients = sseClients.get(id);
    if (clients) {
        clients.delete(res);
        if (clients.size === 0) sseClients.delete(id);
    }
};

/**
 * Push a new notification event to all open SSE connections for a user.
 * Silently skips if no active connections exist.
 */
const pushToUser = (userId, notification) => {
    const id = userId.toString();
    const clients = sseClients.get(id);
    if (!clients || clients.size === 0) return;

    const payload = `data: ${JSON.stringify({ type: 'new_notification', notification })}\n\n`;
    clients.forEach(res => {
        try {
            res.write(payload);
        } catch (_) {
            // Stale connection — will be cleaned up on 'close' event
        }
    });
};

/**
 * Send a keep-alive ping to all connected clients.
 * Prevents proxy/browser timeouts on idle connections.
 */
const pingAll = () => {
    sseClients.forEach((clients) => {
        clients.forEach(res => {
            try { res.write(': ping\n\n'); } catch (_) { /* ignore */ }
        });
    });
};

// Ping every 25 seconds to prevent idle disconnects
setInterval(pingAll, 25000);

module.exports = { registerSSEClient, unregisterSSEClient, pushToUser };
