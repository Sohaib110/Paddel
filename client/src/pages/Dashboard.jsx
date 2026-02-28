import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Button from '../components/Button';
import Input from '../components/Input';
import LeagueTable from '../components/LeagueTable';
import MatchHistory from '../components/MatchHistory';
import NotificationBell from '../components/NotificationBell';
import UnavailableToggle from '../components/UnavailableToggle';
import DisputeModal from '../components/DisputeModal';
import { Users, UserPlus, Calendar, Activity, Trophy, Shield, Search, Clock, MessageSquare, PlusCircle, Zap, Target, CheckCircle2, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import BackButton from '../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100
        }
    }
};

const SkeletonLoader = () => (
    <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-white/50 rounded-[2rem] border border-light-border" />
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-8">
                <div className="h-64 bg-white/50 rounded-[2.5rem] border border-light-border" />
                <div className="h-96 bg-text-primary/10 rounded-[2.5rem]" />
            </div>
            <div className="lg:col-span-8 space-y-8">
                <div className="h-[500px] bg-white/50 rounded-[2.5rem] border border-light-border" />
            </div>
        </div>
    </div>
);

const MatchStepper = ({ status }) => {
    const steps = [
        { key: 'PROPOSED', label: 'Proposed' },
        { key: 'ACCEPTED', label: 'Accepted' },
        { key: 'SCHEDULED', label: 'Scheduled' },
        { key: 'AWAITING_CONFIRMATION', label: 'Submitted' },
        { key: 'COMPLETED', label: 'Finalized' }
    ];

    const getStatusIndex = (status) => {
        const index = steps.findIndex(s => s.key === status);
        if (status === 'DISPUTED') return 3;
        return index === -1 ? 0 : index;
    };

    const currentIndex = getStatusIndex(status);

    return (
        <div className="flex items-center justify-between mb-8 px-2 relative overflow-x-auto pb-2 scrollbar-hide">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 z-0 min-w-[300px]" />
            <div
                className="absolute top-1/2 left-0 h-0.5 bg-padel-green -translate-y-1/2 z-0 transition-all duration-500 min-w-[300px]"
                style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((step, index) => (
                <div key={step.key} className="relative z-10 flex flex-col items-center min-w-[60px]">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${index <= currentIndex ? 'bg-padel-green border-padel-green shadow-[0_0_10px_rgba(156,231,18,0.5)]' : 'bg-text-primary border-white/20'
                        }`}>
                        {index < currentIndex ? <CheckCircle2 size={12} className="text-black" /> :
                            index === currentIndex ? <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" /> : null}
                    </div>
                    <span className={`text-[8px] font-black uppercase mt-2 tracking-tighter ${index <= currentIndex ? 'text-padel-green' : 'text-text-tertiary'
                        }`}>
                        {step.label}
                    </span>
                </div>
            ))}
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [createTeamMode, setCreateTeamMode] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [createMode, setCreateMode] = useState('FRIENDLY');
    const [createType, setCreateType] = useState('1v1');
    const [invitedToken, setInvitedToken] = useState('');
    const [activeMatch, setActiveMatch] = useState(null);
    const [submitMode, setSubmitMode] = useState(false);
    const [result, setResult] = useState('WIN');
    const [score, setScore] = useState('');
    const [showDispute, setShowDispute] = useState(false);
    const [matchMode, setMatchMode] = useState('COMPETITIVE');
    const [matchExperience, setMatchExperience] = useState(user?.experience_level || '0-1 Months');
    // Live ticker for countdown timers [F2][F3]
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        fetchData();
    }, []);

    // Tick every second for countdown timers
    useEffect(() => {
        const tick = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(tick);
    }, []);

    // Guard: if user becomes null (logout), don't render anything
    // MUST be placed AFTER all hooks to avoid violating Rules of Hooks
    if (!user) return null;

    // Helper: format ms remaining as "Xd Xh Xm" or "Xh Xm Xs" [F2][F3]
    const formatCountdown = (targetDate) => {
        if (!targetDate) return null;
        const diff = new Date(targetDate).getTime() - now.getTime();
        if (diff <= 0) return 'Expired';
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        if (d > 0) return `${d}d ${h}h ${m}m`;
        return `${h}h ${m}m ${s}s`;
    };

    const fetchData = async () => {
        try {
            const [teamRes, matchRes] = await Promise.all([
                api.get('/teams/me'),
                api.get('/matches/active')
            ]);
            setTeam(teamRes.data);
            setActiveMatch(matchRes.data);
        } catch {
            console.error('Failed to fetch data');
        } finally {
            setTimeout(() => setLoading(false), 800);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/teams', {
                name: teamName,
                mode: createMode,
                type: createType,
                experience_level: user?.experience_level || '0-1 Months'
            });
            setTeam(data);
            setCreateTeamMode(false);
            toast.success('Team initialized successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create team');
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post(`/teams/${team._id}/invite`);
            setInvitedToken(data.invite_token);
            toast.success('Code generated!');
            fetchData();
        } catch {
            toast.error('Failed to generate invite code');
        }
    };

    const handleFindMatch = async () => {
        try {
            const mode = team.mode || 'COMPETITIVE';
            await api.post(`/matches/find/${team._id}?mode=${mode}&experience=${matchExperience}`);
            toast.success(`${mode.toLowerCase()} match found! Check your notifications.`);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Error finding match');
        }
    };

    const handleToggleSoloPool = async () => {
        try {
            const { data } = await api.post('/teams/toggle-solo-pool');
            toast.success(data.message);
            fetchData();
        } catch {
            toast.error('Failed to toggle solo pool');
        }
    };

    const handleSubmitResult = async (e) => {
        e.preventDefault();
        try {
            await api.post('/matches/submit', {
                matchId: activeMatch._id,
                result,
                score
            });
            toast.success('Result submitted. Awaiting confirmation.');
            setSubmitMode(false);
            fetchData();
        } catch {
            toast.error('Failed to submit result');
        }
    };

    const handleConfirmMatch = async () => {
        try {
            await api.post(`/matches/${activeMatch._id}/confirm`);
            toast.success('Match confirmed! Points updated.');
            fetchData();
        } catch {
            toast.error('Failed to confirm match');
        }
    };

    const handleAcceptMatch = async () => {
        try {
            await api.post(`/matches/${activeMatch._id}/accept`);
            toast.success('Match accepted!');
            fetchData();
        } catch {
            toast.error('Failed to accept match');
        }
    };

    const handleScheduleMatch = async () => {
        try {
            await api.post(`/matches/${activeMatch._id}/schedule`);
            toast.success('Match scheduled!');
            fetchData();
        } catch {
            toast.error('Failed to schedule match');
        }
    };

    // [F1] Queue Next Match — available during COOLDOWN
    const handleQueueNextMatch = async () => {
        try {
            const { data } = await api.post('/teams/queue-next');
            toast.success(data.message);
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update queue');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-light-bg via-light-surface to-slate-50 font-sans tactical-grid">
            <BackButton className="absolute top-4 left-4 md:top-6 md:left-6 z-20" />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 md:pt-32 pb-12">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loader"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <SkeletonLoader />
                        </motion.div>
                    ) : !team ? (
                        <motion.div
                            key="unassigned"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="max-w-2xl mx-auto"
                        >
                            {!createTeamMode ? (
                                <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-12 border border-light-border shadow-2xl text-center relative overflow-hidden glass-card">
                                    <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-padel-blue/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                                    <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-padel-blue to-sky-500 rounded-[1.5rem] md:rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-xl shadow-padel-blue/20">
                                        <Users className="w-10 h-10 md:w-12 md:h-12 text-white" />
                                    </div>
                                    <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter text-text-primary uppercase mb-3 md:mb-4">Unassigned Agent</h2>
                                    <p className="text-sm md:text-base text-text-secondary font-medium mb-8 md:mb-10 max-w-sm mx-auto leading-relaxed border-l-2 border-light-border pl-4 md:pl-6 italic">
                                        "You are currently operating solo. Establish a team identity to infiltrate the rankings."
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                                        <Button size="lg" onClick={() => setCreateTeamMode(true)} className="flex-1">
                                            <PlusCircle className="w-5 h-5 mr-2" /> Initialize Team
                                        </Button>
                                        <Button size="lg" variant="outline" onClick={() => navigate('/accept-invite')} className="flex-1">
                                            <UserPlus className="w-5 h-5 mr-2" /> Join Team
                                        </Button>
                                    </div>
                                    <div className="pt-6 border-t border-light-border">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-3">Operating Solo?</p>
                                        <Button
                                            size="md"
                                            variant={user?.solo_pool_status === 'LOOKING' ? 'secondary' : 'outline'}
                                            onClick={handleToggleSoloPool}
                                            className="w-full"
                                        >
                                            <Search className="w-4 h-4 mr-2" />
                                            {user?.solo_pool_status === 'LOOKING' ? 'Exit Solo Pool' : 'Enter Solo Pool'}
                                        </Button>
                                        {user?.solo_pool_status === 'LOOKING' && (
                                            <p className="mt-2 text-[10px] text-padel-blue font-bold animate-pulse">Searching for partner...</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-[3rem] p-12 border border-light-border shadow-2xl glass-card">
                                    <h2 className="text-3xl font-black italic tracking-tighter text-text-primary uppercase mb-8 text-center">Infiltration Settings</h2>
                                    <form onSubmit={handleCreateTeam} className="space-y-6">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary block mb-3 px-1">Engagement Mode</label>
                                            <div className="flex p-1 bg-light-surface rounded-xl">
                                                <button
                                                    type="button"
                                                    onClick={() => { setCreateMode('COMPETITIVE'); setCreateType('2v2'); }}
                                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${createMode === 'COMPETITIVE' ? 'bg-white text-padel-blue shadow-sm' : 'text-text-tertiary hover:text-text-primary'}`}
                                                >
                                                    Competitive
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCreateMode('FRIENDLY')}
                                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${createMode === 'FRIENDLY' ? 'bg-white text-padel-blue shadow-sm' : 'text-text-tertiary hover:text-text-primary'}`}
                                                >
                                                    Friendly
                                                </button>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {createMode === 'FRIENDLY' && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary block mb-3 px-1">Tactical Formation</label>
                                                    <div className="flex p-1 bg-light-surface rounded-xl">
                                                        <button
                                                            type="button"
                                                            onClick={() => setCreateType('1v1')}
                                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${createType === '1v1' ? 'bg-white text-padel-blue shadow-sm' : 'text-text-tertiary hover:text-text-primary'}`}
                                                        >
                                                            1v1 Solo
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setCreateType('2v2')}
                                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${createType === '2v2' ? 'bg-white text-padel-blue shadow-sm' : 'text-text-tertiary hover:text-text-primary'}`}
                                                        >
                                                            2v2 Squad
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div>
                                            <Input
                                                label={createMode === 'COMPETITIVE' ? "Faction Name" : "Team Name (Optional)"}
                                                value={teamName}
                                                onChange={(e) => setTeamName(e.target.value)}
                                                required={createMode === 'COMPETITIVE'}
                                                placeholder={createMode === 'COMPETITIVE' ? "Alpha Squad" : "Leave blank for auto-gen"}
                                            />
                                            {createMode === 'FRIENDLY' && (
                                                <p className="mt-2 text-[10px] text-text-tertiary italic pl-1">
                                                    "Friendly ops do not require a formal designation."
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <Button variant="secondary" onClick={() => setCreateTeamMode(false)} className="flex-1" size="md">
                                                Abstain
                                            </Button>
                                            <Button type="submit" className="flex-1" size="md">Deploy</Button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="dashboard"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="space-y-8"
                        >
                            {/* Stats Overview */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <motion.div variants={itemVariants}><StatCard icon={<Trophy className="text-amber-500" />} label="Total Points" value={team.points || 0} hoverClass="glow-amber" /></motion.div>
                                <motion.div variants={itemVariants}><StatCard icon={<Activity className="text-padel-blue" />} label="Matches" value={team.matches_played || 0} hoverClass="glow-blue" /></motion.div>
                                <motion.div variants={itemVariants}><StatCard icon={<Shield className="text-sky-500" />} label="Win Rate" value={team.matches_played ? `${Math.round((team.wins / team.matches_played) * 100)}%` : '0%'} hoverClass="glow-sky" /></motion.div>
                                <motion.div variants={itemVariants}><StatCard icon={<Target className="text-rose-500" />} label="League Rank" value="#--" hoverClass="glow-rose" /></motion.div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                {/* Left Column: Team Status & Active Match */}
                                <motion.div variants={itemVariants} className="lg:col-span-4 space-y-8">
                                    {/* Team Status Card */}
                                    <div className="bg-white rounded-[2.5rem] border border-light-border shadow-xl overflow-hidden glass-card">
                                        <div className="bg-light-surface/50 p-6 md:p-8 border-b border-light-border">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-tertiary mb-1">
                                                {team.mode === 'FRIENDLY' ? 'Friendly Ops' : 'Squad Profile'}
                                            </h3>
                                            <h4 className="text-2xl font-black italic tracking-tighter text-text-primary uppercase">
                                                {team.mode === 'FRIENDLY'
                                                    ? (team.type === '1v1'
                                                        ? user?.full_name
                                                        : `${user?.full_name} & ${team.player_2_id?.full_name || 'Partner'}`)
                                                    : team.name}
                                            </h4>
                                        </div>
                                        <div className="p-6 md:p-8 space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full ${activeMatch?.status === 'DISPUTED' ? 'bg-amber-500 animate-pulse' :
                                                        team.status === 'AVAILABLE' ? 'bg-padel-blue animate-pulse' :
                                                            'bg-rose-500'
                                                        }`} />
                                                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                                                        {activeMatch?.status === 'DISPUTED' ? 'Active Dispute' :
                                                            activeMatch?.status === 'AWAITING_CONFIRMATION' ? 'Awaiting Confirmation' :
                                                                activeMatch ? activeMatch.status : team.status}
                                                    </span>
                                                </div>
                                                <UnavailableToggle team={team} onUpdate={fetchData} />
                                            </div>

                                            {team.type === '2v2' && !team.player_2_id && (
                                                <div className="bg-amber-50/50 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-amber-100">
                                                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest text-amber-900 mb-2 md:mb-3 flex items-center gap-2">
                                                        <Search size={14} /> Recruitment Open
                                                    </p>
                                                    <p className="text-[10px] md:text-xs text-amber-700 font-medium mb-3 md:mb-4 italic">"Generate a token to share with your partner to activate the squad."</p>
                                                    <Button onClick={handleInvite} size="sm" className="w-full">Generate Invite Code</Button>
                                                    {invitedToken && (
                                                        <div className="mt-4 p-3 md:p-4 bg-white/80 border border-amber-200 rounded-xl space-y-3">
                                                            <div>
                                                                <p className="text-[8px] md:text-[10px] font-black uppercase text-amber-900 mb-1">Invite Token</p>
                                                                <code className="text-[10px] md:text-xs font-mono break-all text-text-primary block bg-slate-50 p-2 rounded">{invitedToken}</code>
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="w-full text-[10px] md:text-xs"
                                                                onClick={() => {
                                                                    const link = `${window.location.origin}/accept-invite?token=${invitedToken}`;
                                                                    navigator.clipboard.writeText(link);
                                                                    toast.success('Invitation link copied!');
                                                                }}
                                                            >
                                                                Copy Invite Link
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Active Match Card */}
                                    {activeMatch && (
                                        <div className="bg-text-primary rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-white shadow-2xl shadow-padel-blue/20 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-padel-blue/20 blur-3xl rounded-full" />
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-padel-blue animate-pulse-slow">Contact Established</span>
                                                        <span className="text-[8px] md:text-[10px] font-bold text-text-tertiary uppercase mt-1">Mode: {activeMatch.mode}</span>
                                                    </div>
                                                    <Clock size={16} className="text-text-tertiary" />
                                                </div>

                                                <MatchStepper status={activeMatch.status} />

                                                <div className="flex items-center justify-between gap-2 md:gap-4 text-center mb-6">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1 md:mb-2 text-center">Home Squad</p>
                                                        <h5 className="text-xs md:text-sm font-black italic uppercase truncate px-1 text-center">{activeMatch.team_a_id?.name || '---'}</h5>
                                                    </div>
                                                    <div className="text-padel-blue font-black italic text-xl md:text-2xl px-2 md:px-4 tracking-tighter shrink-0">VS</div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-text-tertiary mb-1 md:mb-2 text-center">Away Squad</p>
                                                        <h5 className="text-xs md:text-sm font-black italic uppercase truncate px-1 text-center">{activeMatch.team_b_id?.name || '---'}</h5>
                                                    </div>
                                                </div>

                                                {/* WhatsApp Contact */}
                                                {(activeMatch.status === 'PROPOSED' || activeMatch.status === 'ACCEPTED' || activeMatch.status === 'SCHEDULED') && (
                                                    <>
                                                        {/* [F3] 7-day match deadline countdown */}
                                                        {activeMatch.match_deadline && (
                                                            <div className="mb-4 px-3 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                                                                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-text-tertiary">Mission Expires</span>
                                                                <span className={`text-[10px] md:text-xs font-black tabular-nums ${formatCountdown(activeMatch.match_deadline) === 'Expired' ? 'text-rose-400' : 'text-amber-400'}`}>
                                                                    {formatCountdown(activeMatch.match_deadline)}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="mb-6 md:mb-8 p-3 md:p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/10 transition-colors">
                                                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                                            <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 bg-padel-blue/10 rounded-xl flex items-center justify-center">
                                                                <MessageSquare size={16} className="text-padel-blue" />
                                                            </div>
                                                            <div className="text-left min-w-0">
                                                                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-text-tertiary truncate">Tactical Comms</p>
                                                                <p className="text-[10px] md:text-xs font-bold text-white uppercase italic truncate pr-2">
                                                                    {activeMatch.team_a_id?._id === team._id
                                                                        ? activeMatch.team_b_id?.captain_id?.full_name
                                                                        : activeMatch.team_a_id?.captain_id?.full_name}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <a
                                                            href={`https://wa.me/${(activeMatch.team_a_id?._id === team._id
                                                                ? activeMatch.team_b_id?.captain_id?.phone_number
                                                                : activeMatch.team_a_id?.captain_id?.phone_number)?.replace(/\D/g, '')}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 md:p-3 shrink-0 bg-padel-blue text-white rounded-xl hover:scale-105 transition-all shadow-lg shadow-padel-blue/20"
                                                        >
                                                            <svg width="16" height="16" className="md:w-[20px] md:h-[20px]" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                            </svg>
                                                        </a>
                                                    </div>
                                                    </>
                                                )}

                                                {(activeMatch.status === 'ACCEPTED' || activeMatch.status === 'SCHEDULED') && (
                                                    <div className="mb-6 md:mb-8 p-3 md:p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2 md:gap-3">
                                                        <Calendar size={16} className="text-padel-blue shrink-0" />
                                                        <p className="text-[8px] md:text-[10px] font-bold text-text-tertiary uppercase leading-tight">
                                                            Neutral Ground: Book your court directly with the club.
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="space-y-3">
                                                    {activeMatch.status === 'PROPOSED' && activeMatch.team_b_id?._id === team._id && (
                                                        <Button onClick={handleAcceptMatch} className="w-full bg-padel-blue text-white py-3 md:py-4 text-xs md:text-sm font-black shadow-xl shadow-padel-blue/20">
                                                            Accept Mission
                                                        </Button>
                                                    )}

                                                    {activeMatch.status === 'ACCEPTED' && (
                                                        <Button onClick={handleScheduleMatch} className="w-full bg-padel-blue text-white py-3 md:py-4 text-xs md:text-sm font-black shadow-xl shadow-padel-blue/20">
                                                            Mark as Scheduled
                                                        </Button>
                                                    )}

                                                    {(activeMatch.status === 'PROPOSED' || activeMatch.status === 'ACCEPTED' || activeMatch.status === 'SCHEDULED') && !activeMatch.result && !submitMode && (
                                                        <Button
                                                            onClick={() => setSubmitMode(true)}
                                                            className="w-full bg-white text-text-primary hover:bg-padel-blue hover:text-white transition-all py-3 md:py-4 text-xs md:text-sm font-black"
                                                            disabled={activeMatch.status === 'PROPOSED'}
                                                        >
                                                            {activeMatch.status === 'PROPOSED' ? 'Awaiting Acceptance' : 'Transmit Result'}
                                                        </Button>
                                                    )}

                                                    {activeMatch.status === 'AWAITING_CONFIRMATION' && activeMatch.submitted_by !== user?._id && (
                                                        <div className="flex gap-2">
                                                            <Button onClick={handleConfirmMatch} className="flex-1 bg-padel-blue text-white py-3 md:py-4 text-xs md:text-sm font-black shadow-xl shadow-padel-blue/20">
                                                                Confirm Intel
                                                            </Button>
                                                            <Button onClick={() => setShowDispute(true)} variant="danger" className="flex-1 py-3 md:py-4 text-xs md:text-sm font-black">
                                                                Dispute
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>

                                                {activeMatch.status === 'AWAITING_CONFIRMATION' && activeMatch.submitted_by === user?._id && (
                                                    <div className="bg-white/10 border border-white/20 p-3 md:p-4 rounded-2xl text-center">
                                                        <p className="text-[10px] md:text-xs font-bold text-white uppercase tracking-widest">Signal Transmitted</p>
                                                        {/* [F3] 48-hour confirmation countdown */}
                                                        {activeMatch.confirmation_deadline && (
                                                            <p className="text-[9px] md:text-[10px] text-amber-400 font-black tabular-nums mt-1">
                                                                Auto-confirms in {formatCountdown(activeMatch.confirmation_deadline)}
                                                            </p>
                                                        )}
                                                        <p className="text-[8px] md:text-[10px] text-text-tertiary mt-1 italic">Waiting for opponent confirmation</p>
                                                    </div>
                                                )}

                                                {submitMode && (
                                                    <form onSubmit={handleSubmitResult} className="space-y-4 pt-6 border-t border-white/10">
                                                        <div className="grid grid-cols-1 gap-4">
                                                            <div>
                                                                <label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-text-tertiary block mb-2">Outcome</label>
                                                                <select
                                                                    value={result}
                                                                    onChange={(e) => setResult(e.target.value)}
                                                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 md:py-3 text-xs md:text-sm font-bold focus:outline-none focus:border-padel-blue text-white appearance-none"
                                                                >
                                                                    <option value="WIN" className="bg-text-primary text-white">VICTORY</option>
                                                                    <option value="LOSS" className="bg-text-primary text-white">DEFEAT</option>
                                                                </select>
                                                            </div>
                                                            <Input
                                                                label="Scoreline"
                                                                value={score}
                                                                onChange={(e) => setScore(e.target.value)}
                                                                placeholder="e.g. 6-4, 7-5"
                                                                className="bg-white/5 border-white/10 text-white placeholder:text-text-tertiary text-xs md:text-sm"
                                                            />
                                                        </div>
                                                        <div className="flex gap-3 pt-2">
                                                            <Button variant="outline" size="sm" onClick={() => setSubmitMode(false)} className="flex-1 border-white/20 text-white hover:bg-white/10">
                                                                Cancel
                                                            </Button>
                                                            <Button size="sm" type="submit" className="flex-1 bg-padel-blue text-white shadow-lg shadow-padel-blue/20">
                                                                Verify
                                                            </Button>
                                                        </div>
                                                    </form>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Deploy Section (if no match) */}
                                    {!activeMatch && (team.type === '1v1' || team.player_2_id) && team.status === 'AVAILABLE' && (
                                        <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-light-border shadow-xl text-center flex flex-col items-center group overflow-hidden relative glass-card">
                                            <div className="absolute inset-0 bg-padel-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div className="w-16 h-16 bg-light-surface rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all">
                                                <Zap className="text-padel-blue w-8 h-8" />
                                            </div>
                                            <h5 className="text-xl font-black italic uppercase tracking-tighter text-text-primary mb-2">Tactical Deployment</h5>
                                            <p className="text-xs text-text-tertiary font-medium mb-6">Infiltrate the matchmaking system to find suitable adversaries.</p>

                                            <div className="w-full flex p-1 bg-light-surface rounded-xl mb-6">
                                                <div className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider text-padel-blue bg-white rounded-lg shadow-sm">
                                                    {team.mode || 'COMPETITIVE'} MODE {team.type || '2v2'}
                                                </div>
                                            </div>

                                            <div className="w-full mb-6 text-left">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary block mb-2 px-1 text-center sm:text-left">Target Skill Bracket</label>
                                                <select
                                                    className="w-full bg-light-surface border border-light-border rounded-xl px-4 py-3 text-xs font-bold focus:border-padel-blue outline-none appearance-none"
                                                    value={matchExperience}
                                                    onChange={(e) => setMatchExperience(e.target.value)}
                                                >
                                                    <option value="0-1 Months">Recruit (0-1 Mo)</option>
                                                    <option value="2-4 Months">Associate (2-4 Mo)</option>
                                                    <option value="5-9 Months">Veteran (5-9 Mo)</option>
                                                    <option value="10+ Months">Elite (10+ Mo)</option>
                                                </select>
                                            </div>

                                            <Button onClick={handleFindMatch} size="lg" className="w-full py-5 rounded-2xl shadow-xl shadow-padel-blue/20">
                                                <Search className="w-5 h-5 mr-2" /> Find Adversary
                                            </Button>
                                        </div>
                                    )}

                                    {/* [F1][F2] Cooldown Section — shown when team.status === 'COOLDOWN' */}
                                    {!activeMatch && team.status === 'COOLDOWN' && (
                                        <div className="bg-white rounded-[2.5rem] border border-light-border shadow-xl overflow-hidden glass-card">
                                            <div className="bg-rose-50/60 p-6 md:p-8 border-b border-rose-100">
                                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400 mb-1">Recovery Phase</p>
                                                <h4 className="text-xl font-black italic tracking-tighter text-text-primary uppercase">Cooldown Active</h4>
                                            </div>
                                            <div className="p-6 md:p-8 space-y-5">
                                                {/* Cooldown countdown timer */}
                                                {team.cooldown_expires_at && (
                                                    <div className="bg-rose-50 rounded-2xl p-4 text-center border border-rose-100">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-rose-400 mb-1">Time Remaining</p>
                                                        <p className="text-2xl font-black italic tracking-tighter text-rose-600 tabular-nums">
                                                            {formatCountdown(team.cooldown_expires_at)}
                                                        </p>
                                                        <p className="text-[9px] text-rose-300 mt-1 font-semibold">
                                                            Ends {new Date(team.cooldown_expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                )}

                                                {/* Queue Next Game button */}
                                                {team.is_queued ? (
                                                    <div className="flex items-center gap-3 p-4 bg-padel-blue/5 border border-padel-blue/20 rounded-2xl">
                                                        <CheckCircle2 className="text-padel-blue shrink-0" size={20} />
                                                        <div>
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-padel-blue">Queued ✓</p>
                                                            <p className="text-[9px] text-text-tertiary mt-0.5 font-medium">Your next match will be created automatically when cooldown ends.</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <p className="text-[9px] text-text-tertiary font-medium italic pl-1">Pre-register for the next match cycle before cooldown ends.</p>
                                                        <Button onClick={handleQueueNextMatch} size="md" variant="outline" className="w-full border-padel-blue/40 text-padel-blue hover:bg-padel-blue/5">
                                                            <Zap className="w-4 h-4 mr-2" /> Queue My Next Game
                                                        </Button>
                                                    </div>
                                                )}

                                                {/* Cancel queue if already queued */}
                                                {team.is_queued && (
                                                    <Button onClick={handleQueueNextMatch} size="sm" variant="outline" className="w-full text-text-tertiary border-light-border hover:border-rose-200 hover:text-rose-500 text-[10px]">
                                                        Cancel Queue
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Commander's Briefing */}
                                    <div className="bg-white rounded-[2.5rem] border border-light-border shadow-xl p-8 glass-card">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-10 h-10 bg-padel-blue/10 rounded-xl flex items-center justify-center">
                                                <HelpCircle className="text-padel-blue" size={20} />
                                            </div>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-text-primary italic">Strategic Intelligence</h3>
                                        </div>
                                        <div className="space-y-6">
                                            {[
                                                { title: 'Global Dominance', detail: 'Consistent victories lead to high-tier seeding and rewards.', icon: <Trophy size={14} className="text-amber-500" /> },
                                                { title: 'Transmission Protocol', detail: 'Results must be verified within 48h to maintain system integrity.', icon: <Clock size={14} className="text-padel-blue" /> },
                                                { title: 'Dynamic Training', detail: 'Use training ops to scout new strategies without rank impact.', icon: <Zap size={14} className="text-padel-green" /> }
                                            ].map((tip, i) => (
                                                <div key={i} className="flex gap-4 group cursor-default">
                                                    <div className="mt-1 transition-transform group-hover:scale-125">{tip.icon}</div>
                                                    <div>
                                                        <h4 className="text-[10px] font-black uppercase text-text-primary tracking-tighter mb-1">{tip.title}</h4>
                                                        <p className="text-[10px] text-text-tertiary leading-normal font-medium">{tip.detail}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Main Column: Rankings & History */}
                                <motion.div variants={itemVariants} className="lg:col-span-8 space-y-8">
                                    <div className="bg-white rounded-[2.5rem] border border-light-border shadow-xl overflow-hidden glass-card">
                                        <div className="p-8 border-b border-light-border flex items-center justify-between bg-light-surface/30">
                                            <div>
                                                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-text-tertiary mb-1">Live Intelligence</h3>
                                                <h4 className="text-2xl font-black italic tracking-tighter text-text-primary uppercase">Sector Rankings</h4>
                                            </div>
                                            <div className="p-3 bg-white/50 backdrop-blur-sm rounded-2xl border border-light-border shadow-sm">
                                                <Trophy className="text-amber-500" />
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            <LeagueTable clubId={team.club_id} />
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[2.5rem] border border-light-border shadow-xl overflow-hidden glass-card">
                                        <div className="p-8 border-b border-light-border flex items-center justify-between bg-light-surface/30">
                                            <div>
                                                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-text-tertiary mb-1">Archive Logs</h3>
                                                <h4 className="text-2xl font-black italic tracking-tighter text-text-primary uppercase">Past Operations</h4>
                                            </div>
                                            <div className="p-3 bg-white/50 backdrop-blur-sm rounded-2xl border border-light-border shadow-sm">
                                                <Clock className="text-text-secondary" />
                                            </div>
                                        </div>
                                        <div className="p-2">
                                            <MatchHistory teamId={team._id} />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {showDispute && (
                <DisputeModal
                    match={activeMatch}
                    onClose={() => setShowDispute(false)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
};

const StatCard = ({ icon, label, value, hoverClass }) => (
    <div className={`bg-white p-6 md:p-8 rounded-[2rem] border border-light-border shadow-lg flex items-center gap-5 md:gap-6 group transition-all hover:-translate-y-1 glass-card ${hoverClass}`}>
        <div className="w-12 h-12 md:w-16 md:h-16 bg-light-surface rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3">
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary mb-1">{label}</p>
            <p className="text-xl md:text-3xl font-black italic tracking-tighter text-text-primary leading-none uppercase">{value}</p>
        </div>
    </div>
);

export default Dashboard;
