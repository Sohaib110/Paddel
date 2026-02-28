/**
 * clientSeed.js — Client Demo & Acceptance Testing Seed
 *
 * Usage:  cd server && node clientSeed.js
 *         OR: npm run seed:client
 *
 * PURPOSE: Complete, realistic dataset for client demo and acceptance testing.
 * Every scenario in CLIENT_TESTING_GUIDE.md maps directly to accounts here.
 *
 * === SCENARIOS ===
 *  Scenario A   — Fresh Registration  (manual, no seed account needed)
 *  Scenario B   — Invite & Join Team  (alex invites mike via pre-set link)
 *  Scenario 2.5 — Go Stealth Toggle   (sarah — AVAILABLE team, test unavailable)
 *  Scenario C   — Find Competitive Match (sarah vs jake — both AVAILABLE)
 *  Scenario D   — Accept & Schedule   (ryan PROPOSED vs jason — jason must Accept)
 *  Scenario E   — Confirm Result      (olivia submitted WIN, jessica must Confirm)
 *  Scenario F   — Cooldown & Queue    (brandon in COOLDOWN, 5 days left)
 *  Scenario G   — Dispute Result      (jessica disputes olivia's WIN instead)
 *  Scenario H   — Friendly Mode       (emily + madison — Club B, Miami)
 *  Scenario I   — Admin Panel         (admin@padel.com)
 *
 * === ALL PASSWORDS: Test123! ===
 *
 * === PRE-SET INVITE LINK FOR SCENARIO B ===
 *  http://localhost:5173/accept-invite?token=alex2026lainvite
 *  (Log in as mike@test.com and visit this link)
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const dotenv   = require('dotenv');

const User         = require('./models/User');
const Club         = require('./models/Club');
const Team         = require('./models/Team');
const Match        = require('./models/Match');
const Dispute      = require('./models/Dispute');
const Notification = require('./models/Notification');

dotenv.config();

const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
const weekCycle   = () => Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅  Connected to MongoDB');

    // ── Wipe everything ───────────────────────────────────────────────────────
    await Promise.all([
        User.deleteMany({}),
        Club.deleteMany({}),
        Team.deleteMany({}),
        Match.deleteMany({}),
        Dispute.deleteMany({}),
        Notification.deleteMany({}),
    ]);
    console.log('🗑   Database cleared');

    const hash = await bcrypt.hash('Test123!', 10);

    // Helper: create user
    const u = (full_name, email, role, club_id, opts = {}) =>
        User.create({
            full_name,
            email,
            password_hash:    hash,
            role,
            club_id,
            phone_number:     opts.phone  || '+1 (213) 555-0100',
            gender:           opts.gender || 'MALE',
            play_mixed:       opts.mixed  || 'DOES_NOT_MATTER',
            months_played:    opts.months || 6,
            experience_level: opts.exp    || '2-4 Months',
            availability:     opts.avail  || ['MORNINGS', 'EVENINGS'],
            mode_selection:   opts.mode   || 'COMPETITIVE',
        });

    // ─────────────────────────────────────────────────────────────────────────
    // CLUBS
    // ─────────────────────────────────────────────────────────────────────────
    const clubA = await Club.create({
        name: 'LA Padel Club',
        location: 'Beverly Hills, Los Angeles, CA',
        phone_number: '+1 (213) 555-0200',
        is_active: true,
    });
    const clubB = await Club.create({
        name: 'Miami Padel Club',
        location: 'South Beach, Miami, FL',
        phone_number: '+1 (305) 555-0300',
        is_active: true,
    });
    console.log('🏢  Clubs created: LA Padel Club (Los Angeles) + Miami Padel Club');

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN
    // ─────────────────────────────────────────────────────────────────────────
    const admin = await u('James Carter', 'admin@padel.com', 'ADMIN', clubA._id, {
        exp: '10+ Months', months: 60, phone: '+1 (213) 555-9999',
    });

    // ─────────────────────────────────────────────────────────────────────────
    // CLUB A — LA Padel Club, Los Angeles
    // ─────────────────────────────────────────────────────────────────────────

    // ── Scenario B: Invite & Join ──
    // alex@test.com → Captain, solo team (PENDING_PARTNER), pre-set invite token
    // mike@test.com → Player with no team — will accept Alex's invite
    const alex = await u('Alex Mitchell', 'alex@test.com', 'CAPTAIN', clubA._id, {
        exp: '2-4 Months', months: 4, phone: '+1 (213) 555-1001',
    });
    const mike = await u('Mike Torres', 'mike@test.com', 'PLAYER', clubA._id, {
        exp: '2-4 Months', months: 3, phone: '+1 (213) 555-1002',
    });

    // ── Scenario 2.5 + C: Go Stealth & Find Competitive Match ──
    // sarah + emma (AVAILABLE, 2-4 Months) — sarah demoing Go Stealth, then Find Adversary
    // jake + tyler (AVAILABLE, 2-4 Months) — same club/exp, sarah's opponent
    const sarah = await u('Sarah Johnson', 'sarah@test.com', 'CAPTAIN', clubA._id, {
        exp: '2-4 Months', months: 5, gender: 'FEMALE',
        phone: '+1 (213) 555-2001', avail: ['MORNINGS', 'WEEKENDS'],
    });
    const emma = await u('Emma Davis', 'emma@test.com', 'PLAYER', clubA._id, {
        exp: '2-4 Months', months: 4, gender: 'FEMALE',
        phone: '+1 (213) 555-2002', avail: ['MORNINGS', 'WEEKENDS'],
    });
    const jake = await u('Jake Wilson', 'jake@test.com', 'CAPTAIN', clubA._id, {
        exp: '2-4 Months', months: 6,
        phone: '+1 (213) 555-2003', avail: ['MORNINGS', 'EVENINGS', 'WEEKENDS'],
    });
    const tyler = await u('Tyler Brown', 'tyler@test.com', 'PLAYER', clubA._id, {
        exp: '2-4 Months', months: 5, phone: '+1 (213) 555-2004',
    });

    // ── Scenario D: Accept & Schedule Match ──
    // ryan + chris (PROPOSED — challenged jason's team)
    // jason + kevin (PROPOSED — must click Accept Mission)
    const ryan  = await u('Ryan Cooper',  'ryan@test.com',  'CAPTAIN', clubA._id, {
        exp: '5-9 Months', months: 8, phone: '+1 (213) 555-3001',
    });
    const chris = await u('Chris Evans',  'chris@test.com', 'PLAYER',  clubA._id, {
        exp: '5-9 Months', months: 7, phone: '+1 (213) 555-3002',
    });
    const jason = await u('Jason Reed',   'jason@test.com', 'CAPTAIN', clubA._id, {
        exp: '5-9 Months', months: 9, phone: '+1 (213) 555-3003',
    });
    const kevin = await u('Kevin Brooks', 'kevin@test.com', 'PLAYER',  clubA._id, {
        exp: '5-9 Months', months: 8, phone: '+1 (213) 555-3004',
    });

    // ── Scenario E + G: Confirm / Dispute Result ──
    // olivia + chloe (submitted WIN — AWAITING_CONFIRMATION)
    // jessica + ashley (must Confirm Intel OR Dispute)
    const olivia  = await u('Olivia Scott',   'olivia@test.com',  'CAPTAIN', clubA._id, {
        exp: '0-1 Months', months: 1, gender: 'FEMALE', phone: '+1 (213) 555-4001',
    });
    const chloe   = await u('Chloe Adams',    'chloe@test.com',   'PLAYER',  clubA._id, {
        exp: '0-1 Months', months: 1, gender: 'FEMALE', phone: '+1 (213) 555-4002',
    });
    const jessica = await u('Jessica White',  'jessica@test.com', 'CAPTAIN', clubA._id, {
        exp: '0-1 Months', months: 2, gender: 'FEMALE', phone: '+1 (213) 555-4003',
    });
    const ashley  = await u('Ashley Clark',   'ashley@test.com',  'PLAYER',  clubA._id, {
        exp: '0-1 Months', months: 1, gender: 'FEMALE', phone: '+1 (213) 555-4004',
    });

    // ── Scenario F: Cooldown ──
    const brandon = await u('Brandon Lee', 'brandon@test.com', 'CAPTAIN', clubA._id, {
        exp: '10+ Months', months: 18, phone: '+1 (213) 555-5001',
    });
    const derek   = await u('Derek Hall',  'derek@test.com',   'PLAYER',  clubA._id, {
        exp: '10+ Months', months: 15, phone: '+1 (213) 555-5002',
    });

    // ─────────────────────────────────────────────────────────────────────────
    // CLUB B — Miami Padel Club, South Beach
    // ─────────────────────────────────────────────────────────────────────────

    // ── Scenario H: Friendly Mode ──
    // emily + natalie (AVAILABLE, 2-4 Months) vs madison + grace (AVAILABLE, 2-4 Months)
    // Both in Miami club — competitive OR friendly
    const emily   = await u('Emily Turner',   'emily@test.com',   'CAPTAIN', clubB._id, {
        exp: '2-4 Months', months: 3, gender: 'FEMALE',
        phone: '+1 (305) 555-6001', avail: ['EVENINGS', 'WEEKENDS'],
    });
    const natalie = await u('Natalie Moore',  'natalie@test.com', 'PLAYER',  clubB._id, {
        exp: '2-4 Months', months: 4, gender: 'FEMALE',
        phone: '+1 (305) 555-6002', avail: ['EVENINGS', 'WEEKENDS'],
    });
    const madison = await u('Madison Taylor', 'madison@test.com', 'CAPTAIN', clubB._id, {
        exp: '2-4 Months', months: 3, gender: 'FEMALE',
        phone: '+1 (305) 555-6003', avail: ['EVENINGS', 'WEEKENDS'],
    });
    const grace   = await u('Grace Anderson', 'grace@test.com',   'PLAYER',  clubB._id, {
        exp: '2-4 Months', months: 2,
        phone: '+1 (305) 555-6004', avail: ['EVENINGS', 'WEEKENDS'],
    });

    console.log('👤  Users created (20 + 1 admin)');

    // ─────────────────────────────────────────────────────────────────────────
    // TEAMS
    // ─────────────────────────────────────────────────────────────────────────

    // Scenario B — Alex's solo team (PENDING_PARTNER) with pre-set readable invite token
    const teamAlex = await Team.create({
        name: 'Westside Aces',
        club_id: clubA._id,
        captain_id: alex._id,
        experience_level: '2-4 Months',
        status: 'PENDING_PARTNER',
        invite_token: 'alex2026lainvite', // PRE-SET — see CLIENT_TESTING_GUIDE
    });

    // Scenario 2.5 + C — Sarah's team (AVAILABLE, ready for Go Stealth demo & matchmaking)
    const teamSarah = await Team.create({
        name: 'LA Smashers',
        club_id: clubA._id,
        captain_id: sarah._id, player_2_id: emma._id,
        experience_level: '2-4 Months',
        status: 'AVAILABLE',
        mixed_gender_preference: 'YES',
        points: 0, wins: 0, losses: 0, matches_played: 0,
    });

    // Scenario C — Jake's team (AVAILABLE, same exp as Sarah — will be matched)
    const teamJake = await Team.create({
        name: 'Venice Volleys',
        club_id: clubA._id,
        captain_id: jake._id, player_2_id: tyler._id,
        experience_level: '2-4 Months',
        status: 'AVAILABLE',
        points: 0, wins: 0, losses: 0, matches_played: 0,
    });

    // Scenario D — Ryan's team (IN_MATCH, PROPOSED — challenged jason)
    const teamRyan = await Team.create({
        name: 'Hollywood Hawks',
        club_id: clubA._id,
        captain_id: ryan._id, player_2_id: chris._id,
        experience_level: '5-9 Months',
        status: 'IN_MATCH',
        points: 6, wins: 2, losses: 0, matches_played: 2,
    });

    // Scenario D — Jason's team (IN_MATCH, PROPOSED — must Accept Mission)
    const teamJason = await Team.create({
        name: 'Sunset Strikers',
        club_id: clubA._id,
        captain_id: jason._id, player_2_id: kevin._id,
        experience_level: '5-9 Months',
        status: 'IN_MATCH',
        points: 3, wins: 1, losses: 1, matches_played: 2,
    });

    // Scenario E+G — Olivia's team (submitted WIN — AWAITING_CONFIRMATION)
    const teamOlivia = await Team.create({
        name: 'Beverly Blazers',
        club_id: clubA._id,
        captain_id: olivia._id, player_2_id: chloe._id,
        experience_level: '0-1 Months',
        status: 'IN_MATCH',
        points: 3, wins: 1, losses: 0, matches_played: 1,
    });

    // Scenario E+G — Jessica's team (must Confirm or Dispute)
    const teamJessica = await Team.create({
        name: 'Malibu Aces',
        club_id: clubA._id,
        captain_id: jessica._id, player_2_id: ashley._id,
        experience_level: '0-1 Months',
        status: 'IN_MATCH',
        points: 0, wins: 0, losses: 0, matches_played: 1,
    });

    // Scenario F — Brandon's team (COOLDOWN, 5 days left)
    const teamBrandon = await Team.create({
        name: 'Pacific Force',
        club_id: clubA._id,
        captain_id: brandon._id, player_2_id: derek._id,
        experience_level: '10+ Months',
        status: 'COOLDOWN',
        cooldown_expires_at:     daysFromNow(5),
        last_match_completed_at: daysFromNow(-2),
        points: 12, wins: 4, losses: 0, matches_played: 4,
        is_queued: false,
    });

    // Scenario H — Emily's team (Club B, Miami, AVAILABLE)
    const teamEmily = await Team.create({
        name: 'Miami Heat',
        club_id: clubB._id,
        captain_id: emily._id, player_2_id: natalie._id,
        experience_level: '2-4 Months',
        status: 'AVAILABLE',
        mixed_gender_preference: 'YES',
        points: 3, wins: 1, losses: 0, matches_played: 1,
    });

    // Scenario H — Madison's team (Club B, Miami, AVAILABLE — Emily's opponent)
    const teamMadison = await Team.create({
        name: 'South Beach Squad',
        club_id: clubB._id,
        captain_id: madison._id, player_2_id: grace._id,
        experience_level: '2-4 Months',
        status: 'AVAILABLE',
        mixed_gender_preference: 'YES',
        points: 0, wins: 0, losses: 1, matches_played: 1,
    });

    console.log('🏅  Teams created (9)');

    // ─────────────────────────────────────────────────────────────────────────
    // MATCHES
    // ─────────────────────────────────────────────────────────────────────────

    // Scenario D — PROPOSED (Ryan vs Jason — Jason must Accept Mission)
    const matchD = await Match.create({
        club_id:        clubA._id,
        team_a_id:      teamRyan._id,
        team_b_id:      teamJason._id,
        status:         'PROPOSED',
        mode:           'COMPETITIVE',
        week_cycle:     weekCycle(),
        match_deadline: daysFromNow(7),
    });

    // Scenario E+G — AWAITING_CONFIRMATION (Olivia submitted WIN, Jessica must Confirm/Dispute)
    const matchEG = await Match.create({
        club_id:               clubA._id,
        team_a_id:             teamOlivia._id,
        team_b_id:             teamJessica._id,
        status:                'AWAITING_CONFIRMATION',
        mode:                  'COMPETITIVE',
        week_cycle:            weekCycle() - 1,
        match_deadline:        daysFromNow(1),
        result:                'WIN',          // Olivia's team claims WIN
        score:                 '6-3, 7-5',
        submitted_by:          olivia._id,
        confirmation_deadline: daysFromNow(1.5), // ~36h left to auto-confirm
    });

    // Historical COMPLETED match (league table / match history data)
    const matchCompleted = await Match.create({
        club_id:        clubA._id,
        team_a_id:      teamBrandon._id,
        team_b_id:      teamRyan._id,
        status:         'COMPLETED',
        mode:           'COMPETITIVE',
        week_cycle:     weekCycle() - 2,
        result:         'WIN',           // Brandon won
        score:          '6-2, 6-4',
        completed_at:   daysFromNow(-2),
        match_deadline: daysFromNow(5),
    });

    // Historical match for Jessica's team match history
    const matchHistoryJessica = await Match.create({
        club_id:        clubA._id,
        team_a_id:      teamBrandon._id,
        team_b_id:      teamJessica._id,
        status:         'COMPLETED',
        mode:           'COMPETITIVE',
        week_cycle:     weekCycle() - 3,
        result:         'WIN',           // Brandon won
        score:          '6-1, 6-3',
        completed_at:   daysFromNow(-5),
        match_deadline: daysFromNow(2),
    });

    console.log('🎾  Matches created (4)');

    // ─────────────────────────────────────────────────────────────────────────
    // NOTIFICATIONS
    // ─────────────────────────────────────────────────────────────────────────
    await Notification.insertMany([
        // Olivia — submitted WIN, waiting for Jessica to confirm
        {
            user_id: olivia._id, type: 'RESULT_SUBMITTED', is_read: false,
            title: 'Result Submitted', match_id: matchEG._id,
            message: 'You submitted a WIN vs Malibu Aces. Waiting for opponent to confirm.',
        },
        // Jessica — must confirm/dispute Olivia's result
        {
            user_id: jessica._id, type: 'RESULT_SUBMITTED', is_read: false,
            title: 'Confirm Match Result', match_id: matchEG._id,
            message: 'Beverly Blazers has submitted a result against your team. Please Confirm or Dispute.',
        },
        // Ryan — new match proposed vs Jason
        {
            user_id: ryan._id, type: 'MATCH_CREATED', is_read: false,
            title: 'Match Found!', match_id: matchD._id,
            message: 'A competitive match has been scheduled against Sunset Strikers.',
        },
        // Jason — new match, must accept
        {
            user_id: jason._id, type: 'MATCH_CREATED', is_read: false,
            title: 'Match Found! Accept Now', match_id: matchD._id,
            message: 'Hollywood Hawks have challenged your team. Go to your Dashboard and click Accept Mission.',
        },
        // Brandon — cooldown started after last match
        {
            user_id: brandon._id, type: 'RESULT_CONFIRMED', is_read: true,
            title: 'Match Confirmed — Cooldown Active', match_id: matchCompleted._id,
            message: 'Your match result was confirmed. 7-day cooldown is now active. Use "Queue My Next Game" to get ahead.',
        },
        // Admin — seeded
        {
            user_id: admin._id, type: 'ADMIN_MESSAGE', is_read: false,
            title: 'Client Seed Loaded',
            message: 'All client demo scenarios are ready. Check CLIENT_TESTING_GUIDE.md for full walkthrough.',
        },
        // Alex — solo team, needs to share invite
        {
            user_id: alex._id, type: 'ADMIN_MESSAGE', is_read: false,
            title: 'Welcome to Padel!',
            message: 'Your team is ready. Share the invite link with your partner to get started.',
        },
    ]);
    console.log('🔔  Notifications created');

    // ─────────────────────────────────────────────────────────────────────────
    // PRINT SUMMARY
    // ─────────────────────────────────────────────────────────────────────────
    console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║          CLIENT SEED COMPLETE  —  All Passwords: Test123!            ║
╠══════════════════════════════════════════════════════════════════════╣
║  ADMIN                                                                ║
║    admin@padel.com     James Carter   (LA Padel Club, Los Angeles)   ║
╠══════════════════════════════════════════════════════════════════════╣
║  CLUB A — LA Padel Club, Beverly Hills, Los Angeles, CA              ║
╠══════════════════════════════════════════════════════════════════════╣
║  Scenario B — Invite & Join                                           ║
║    alex@test.com    Alex Mitchell  Captain, Westside Aces [PENDING]   ║
║    mike@test.com    Mike Torres    Player  (no team — will join)      ║
║    Invite: http://localhost:5173/accept-invite?token=alex2026lainvite ║
║                                                                        ║
║  Scenario 2.5 — Go Stealth Toggle                                     ║
║    sarah@test.com   Sarah Johnson  Captain, LA Smashers  [AVAILABLE]  ║
║    → Click the tiny calendar toggle on Squad Profile card             ║
║                                                                        ║
║  Scenario C — Find Competitive Match (click Find Adversary)           ║
║    sarah@test.com   Sarah Johnson  Captain, LA Smashers  [AVAILABLE]  ║
║    jake@test.com    Jake Wilson    Captain, Venice Volleys[AVAILABLE]  ║
║                                                                        ║
║  Scenario D — Accept & Schedule (jason must Accept Mission)           ║
║    ryan@test.com    Ryan Cooper    Captain, Hollywood Hawks[PROPOSED]  ║
║    jason@test.com   Jason Reed     Captain, Sunset Strikers[PROPOSED]  ║
║                                                                        ║
║  Scenario E/G — Confirm or Dispute (jessica's choice)                 ║
║    olivia@test.com  Olivia Scott   Captain, Beverly Blazers[AWAITING]  ║
║    jessica@test.com Jessica White  Captain, Malibu Aces   [AWAITING]  ║
║                                                                        ║
║  Scenario F — Cooldown & Queue                                        ║
║    brandon@test.com Brandon Lee    Captain, Pacific Force  [COOLDOWN]  ║
╠══════════════════════════════════════════════════════════════════════╣
║  CLUB B — Miami Padel Club, South Beach, FL                           ║
║  Scenario H — Friendly Mode                                           ║
║    emily@test.com   Emily Turner   Captain, Miami Heat     [AVAILABLE] ║
║    madison@test.com Madison Taylor Captain, South Beach Squad[AVAIL]  ║
╠══════════════════════════════════════════════════════════════════════╣
║  See CLIENT_TESTING_GUIDE.md for step-by-step instructions            ║
╚══════════════════════════════════════════════════════════════════════╝
`);

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch((err) => {
    console.error('❌  Client seed failed:', err);
    process.exit(1);
});
