const nodemailer = require('nodemailer');

/**
 * Configure SMTP transporter
 */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

/**
 * Send a match found email to a captain
 */
const sendMatchFoundEmail = async (captain, myTeam, opponentTeam) => {
    // If no credentials are set, log to console for development
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`[EMAIL-LOG] Match Found Email for ${captain.email}: Team "${myTeam.name}" vs "${opponentTeam.name}"`);
        return;
    }

    try {
        const mailOptions = {
            from: `"Find My Padel" <${process.env.SMTP_USER}>`,
            to: captain.email,
            subject: '⚔️ Match Found! Objective Identified',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 20px;">
                    <h1 style="color: #0099ff; text-transform: uppercase; font-style: italic; letter-spacing: -1px;">Find My Padel</h1>
                    <p style="font-size: 18px; font-weight: bold; color: #0f172a;">Objective Identified!</p>
                    <p style="color: #475569;">Your squad <strong>"${myTeam.name}"</strong> has been matched for a mission.</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px; text-transform: uppercase; color: #94a3b8; font-weight: bold;">Opponent Faction</p>
                        <p style="margin: 5px 0; font-size: 24px; font-weight: 800; color: #0f172a; font-style: italic;">${opponentTeam.name}</p>
                    </div>

                    <p style="color: #475569;">Connect with the opposing captain via the dashboard to schedule your game.</p>
                    
                    <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard" 
                       style="display: inline-block; background: #0099ff; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px;">
                       Open Dashboard
                    </a>
                    
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                    <p style="font-size: 12px; color: #94a3b8;">Standard protocols applied. Good luck, Captain.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${captain.email}`);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = {
    sendMatchFoundEmail
};
