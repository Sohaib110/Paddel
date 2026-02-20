import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Button from '../components/Button';
import Input from '../components/Input';
import { Users, UserPlus, Calendar, Activity, Trophy, Shield, Search, PlusCircle, Trash2, CheckCircle, XCircle, AlertCircle, Settings, Layout, ClipboardList, Trash, Clock, ChevronRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import BackButton from '../components/BackButton';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
    useAuth();
    const [stats, setStats] = useState({ clubs: 0, teams: 0, matches: 0, disputes: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('clubs');
    const [showCreateClub, setShowCreateClub] = useState(false);
    const [showForceMatch, setShowForceMatch] = useState(false);
    const [showResolveDispute, setShowResolveDispute] = useState(false);
    const [showOverrideResult, setShowOverrideResult] = useState(false);

    // Data states
    const [clubs, setClubs] = useState([]);
    const [teams, setTeams] = useState([]);
    const [matches, setMatches] = useState([]);
    const [disputes, setDisputes] = useState([]);

    // Selection states
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [selectedMatch, setSelectedMatch] = useState(null);

    // Form states
    const [newClub, setNewClub] = useState({ name: '', location: '' });
    const [forceMatchData, setForceMatchData] = useState({ teamA: '', teamB: '', club: '', mode: 'COMPETITIVE' });
    const [resolveData, setResolveData] = useState({ winner: '', score: '' });
    const [overrideData, setOverrideData] = useState({ winner: '', score: '' });

    // Search/Filter states
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchAdminData();
    }, []);

    const fetchAdminData = async () => {
        setLoading(true);
        try {
            const [cRes, tRes, mRes, dRes] = await Promise.all([
                api.get('/admin/clubs'),
                api.get('/admin/teams'),
                api.get('/admin/matches'),
                api.get('/admin/disputes')
            ]);
            setClubs(cRes.data);
            setTeams(tRes.data);
            setMatches(mRes.data);
            setDisputes(dRes.data);
            setStats({
                clubs: cRes.data.length,
                teams: tRes.data.length,
                matches: mRes.data.length,
                disputes: dRes.data.length
            });
        } catch {
            toast.error('Failed to intercept system data');
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    };

    const handleCreateClub = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/clubs', newClub);
            toast.success('Club node established');
            setShowCreateClub(false);
            fetchAdminData();
        } catch {
            toast.error('Failed to establish node');
        }
    };

    const handleForceMatch = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/matches/force', forceMatchData);
            toast.success('Match override initiated');
            setShowForceMatch(false);
            fetchAdminData();
        } catch {
            toast.error('Override failed');
        }
    };

    const handleResolveDispute = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/admin/disputes/${selectedDispute._id}/resolve`, resolveData);
            toast.success('Dispute clarified');
            setShowResolveDispute(false);
            fetchAdminData();
        } catch {
            toast.error('Clarification failed');
        }
    };

    const handleOverrideResult = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/admin/matches/${selectedMatch._id}/override`, overrideData);
            toast.success('Reality adjusted');
            setShowOverrideResult(false);
            fetchAdminData();
        } catch {
            toast.error('Adjustment failed');
        }
    };

    const handleDeleteClub = async (id) => {
        if (!window.confirm('Terminate this node?')) return;
        try {
            await api.delete(`/admin/clubs/${id}`);
            toast.success('Node terminated');
            fetchAdminData();
        } catch {
            toast.error('Termination failed');
        }
    };

    const filteredData = () => {
        const query = searchTerm.toLowerCase();
        switch (activeTab) {
            case 'clubs': return clubs.filter(c => c.name.toLowerCase().includes(query) || c.location.toLowerCase().includes(query));
            case 'teams': return teams.filter(t => t.name.toLowerCase().includes(query));
            case 'matches': return matches.filter(m => m.team_a_id?.name.toLowerCase().includes(query) || m.team_b_id?.name.toLowerCase().includes(query));
            case 'disputes': return disputes.filter(d => d.match_id?.team_a_id?.name.toLowerCase().includes(query) || d.match_id?.team_b_id?.name.toLowerCase().includes(query));
            default: return [];
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const itemVariants = {
        hidden: { y: 10, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    if (loading) return (
        <div className="min-h-screen bg-light-bg flex items-center justify-center tactical-grid">
            <div className="flex flex-col items-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-16 h-16 border-4 border-padel-blue border-t-transparent rounded-full shadow-lg shadow-padel-blue/20"
                />
                <p className="mt-6 text-[10px] font-black uppercase tracking-[0.5em] text-padel-blue animate-pulse">Establishing Secure Connection...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-light-bg via-light-surface to-slate-50 font-sans tactical-grid pb-20">
            <BackButton className="absolute top-4 left-4 md:top-6 md:left-6 z-20" />

            <header className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 md:pt-32 pb-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <div className="flex items-center gap-2 text-padel-blue font-black uppercase tracking-[0.4em] text-[10px] mb-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-padel-blue opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-padel-blue"></span>
                            </span>
                            Live System Intel
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black italic tracking-tighter text-text-primary uppercase leading-tight">
                            Central <span className="text-padel-blue">Command.</span>
                        </h1>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto"
                    >
                        <QuickStat label="Clubs" value={stats.clubs} color="bg-padel-blue" />
                        <QuickStat label="Squads" value={stats.teams} color="bg-sky-500" />
                        <QuickStat label="Ops" value={stats.matches} color="bg-emerald-500" />
                        <QuickStat label="Disputes" value={stats.disputes} color="bg-rose-500" pulse={stats.disputes > 0} />
                    </motion.div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="bg-white rounded-[2.5rem] border border-light-border shadow-2xl overflow-hidden glass-card">
                    {/* Tactical Tabs */}
                    <div className="flex flex-wrap items-center justify-between border-b border-light-border bg-light-surface/40 p-4 md:p-6 gap-4">
                        <div className="flex p-1 bg-light-surface rounded-2xl border border-light-border overflow-x-auto scrollbar-hide">
                            <TabButton active={activeTab === 'clubs'} onClick={() => setActiveTab('clubs')} icon={<Layout size={16} />} label="Nodes" />
                            <TabButton active={activeTab === 'teams'} onClick={() => setActiveTab('teams')} icon={<Users size={16} />} label="Squads" />
                            <TabButton active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} icon={<Zap size={16} />} label="Operations" />
                            <TabButton active={activeTab === 'disputes'} onClick={() => setActiveTab('disputes')} icon={<AlertCircle size={16} />} label="Alerts" />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1 md:flex-initial">
                                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
                                <input
                                    type="text"
                                    placeholder="Search network..."
                                    className="pl-12 pr-4 py-3 bg-white border border-light-border rounded-xl text-xs font-bold focus:border-padel-blue outline-none w-full md:w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button size="sm" onClick={() => {
                                if (activeTab === 'clubs') setShowCreateClub(true);
                                else if (activeTab === 'matches') setShowForceMatch(true);
                            }} className="shrink-0">
                                <PlusCircle size={16} className="mr-2" /> Action
                            </Button>
                        </div>
                    </div>

                    <div className="p-4 md:p-8">
                        <motion.div
                            key={activeTab}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            <AnimatePresence mode="popLayout">
                                {filteredData().map((item) => (
                                    <motion.div
                                        key={item._id}
                                        variants={itemVariants}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group"
                                    >
                                        <DataCard
                                            type={activeTab}
                                            data={item}
                                            onDelete={handleDeleteClub}
                                            onOverride={(m) => { setSelectedMatch(m); setShowOverrideResult(true); }}
                                            onResolve={(d) => { setSelectedDispute(d); setShowResolveDispute(true); }}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                        {filteredData().length === 0 && (
                            <div className="py-20 text-center">
                                <Search size={48} className="mx-auto text-text-tertiary mb-4 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">No matching data identified in sector</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Admin Modals */}
            <AdminModal isOpen={showCreateClub} onClose={() => setShowCreateClub(false)} title="Establish New Node">
                <form onSubmit={handleCreateClub} className="space-y-6">
                    <Input label="Callsign (Name)" value={newClub.name} onChange={(e) => setNewClub({ ...newClub, name: e.target.value })} required />
                    <Input label="Sector (Location)" value={newClub.location} onChange={(e) => setNewClub({ ...newClub, location: e.target.value })} required />
                    <Button type="submit" className="w-full py-4">Initialize Node</Button>
                </form>
            </AdminModal>

            <AdminModal isOpen={showForceMatch} onClose={() => setShowForceMatch(false)} title="Force Operational Link">
                <form onSubmit={handleForceMatch} className="space-y-4">
                    <Input label="Target Squad A ID" value={forceMatchData.teamA} onChange={(e) => setForceMatchData({ ...forceMatchData, teamA: e.target.value })} required />
                    <Input label="Target Squad B ID" value={forceMatchData.teamB} onChange={(e) => setForceMatchData({ ...forceMatchData, teamB: e.target.value })} required />
                    <Input label="Combat Sector (Club ID)" value={forceMatchData.club} onChange={(e) => setForceMatchData({ ...forceMatchData, club: e.target.value })} required />
                    <select
                        className="w-full bg-light-surface border border-light-border rounded-xl px-4 py-3 text-xs font-bold focus:border-padel-blue outline-none"
                        value={forceMatchData.mode}
                        onChange={(e) => setForceMatchData({ ...forceMatchData, mode: e.target.value })}
                    >
                        <option value="COMPETITIVE">COMPETITIVE</option>
                        <option value="FRIENDLY">FRIENDLY</option>
                    </select>
                    <Button type="submit" className="w-full py-4">Initiate Override</Button>
                </form>
            </AdminModal>

            <AdminModal isOpen={showResolveDispute} onClose={() => setShowResolveDispute(false)} title="Resolve Intel Conflict">
                <form onSubmit={handleResolveDispute} className="space-y-4">
                    <p className="text-[10px] text-text-tertiary font-bold mb-4">Conflict: {selectedDispute?.match_id?.team_a_id?.name} vs {selectedDispute?.match_id?.team_b_id?.name}</p>
                    <Input label="Victory Party ID" value={resolveData.winner} onChange={(e) => setResolveData({ ...resolveData, winner: e.target.value })} required />
                    <Input label="Verified Scorecard" value={resolveData.score} onChange={(e) => setResolveData({ ...resolveData, score: e.target.value })} required />
                    <Button type="submit" className="w-full py-4 bg-padel-blue text-white font-black">Finalize Resolution</Button>
                </form>
            </AdminModal>

            <AdminModal isOpen={showOverrideResult} onClose={() => setShowOverrideResult(false)} title="Reality Correction">
                <form onSubmit={handleOverrideResult} className="space-y-4">
                    <Input label="New Victory Party ID" value={overrideData.winner} onChange={(e) => setOverrideData({ ...overrideData, winner: e.target.value })} required />
                    <Input label="Adjusted Scorecard" value={overrideData.score} onChange={(e) => setOverrideData({ ...overrideData, score: e.target.value })} required />
                    <Button type="submit" className="w-full py-4 bg-padel-blue text-white font-black">Commit Calibration</Button>
                </form>
            </AdminModal>
        </div>
    );
};

// Simplified UI Helpers
const QuickStat = ({ label, value, pulse }) => (
    <div className="bg-white p-4 md:p-6 rounded-[1.5rem] border border-light-border shadow-lg flex-1 min-w-[120px] transition-transform hover:-translate-y-1 glass-card">
        <div className="flex items-center justify-between mb-2">
            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-text-tertiary">{label}</span>
            {pulse && <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>}
        </div>
        <span className={`text-2xl md:text-3xl font-black italic tracking-tighter text-text-primary uppercase`}>{value}</span>
    </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white text-padel-blue shadow-lg shadow-padel-blue/10 border border-light-border' : 'text-text-tertiary hover:text-text-primary'}`}
    >
        {icon} <span className="hidden sm:inline">{label}</span>
    </button>
);

const DataCard = ({ type, data, onDelete, onOverride, onResolve }) => {
    if (type === 'clubs') return (
        <div className="bg-white p-6 rounded-3xl border border-light-border shadow-sm group hover:border-padel-blue transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-padel-blue/10 rounded-xl text-padel-blue"><Layout size={20} /></div>
                <button onClick={() => onDelete(data._id)} className="p-2 text-text-tertiary hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
            </div>
            <h5 className="text-sm font-black uppercase text-text-primary mb-1">{data.name}</h5>
            <p className="text-[10px] text-text-tertiary font-bold tracking-widest mb-4 flex items-center gap-1"><Search size={10} /> {data.location}</p>
            <div className="pt-4 border-t border-light-border flex items-center justify-between">
                <span className="text-[8px] font-black uppercase text-text-tertiary tracking-[0.2em]">Live Node</span>
                <ChevronRight size={14} className="text-padel-blue opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </div>
    );

    if (type === 'teams') return (
        <div className="bg-white p-6 rounded-3xl border border-light-border shadow-sm group hover:border-padel-blue transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-sky-500/10 rounded-xl text-sky-500"><Users size={20} /></div>
                <div className="text-[8px] font-black px-2 py-1 bg-light-surface border border-light-border rounded-full text-text-tertiary">{data.points} PTS</div>
            </div>
            <h5 className="text-sm font-black uppercase text-text-primary mb-1">{data.name}</h5>
            <p className="text-[10px] text-text-tertiary font-mono mb-4 break-all">ID: {data._id}</p>
            <div className="pt-4 border-t border-light-border flex items-center gap-4">
                <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white" />
                    <div className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white" />
                </div>
                <span className="text-[8px] font-black uppercase text-text-tertiary tracking-widest">Squad Active</span>
            </div>
        </div>
    );

    if (type === 'matches') return (
        <div className="bg-white p-6 rounded-3xl border border-light-border shadow-sm group hover:border-padel-blue transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 px-3 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded-lg transform -rotate-1 italic uppercase tracking-widest">{data.status}</div>
                <button onClick={() => onOverride(data)} className="p-2 text-text-tertiary hover:text-padel-blue transition-colors"><Settings size={16} /></button>
            </div>
            <div className="flex items-center justify-between gap-2 mb-4">
                <div className="text-center flex-1">
                    <p className="text-[10px] font-black uppercase text-text-primary truncate">{data.team_a_id?.name || '---'}</p>
                    <p className="text-[8px] text-text-tertiary uppercase">Home</p>
                </div>
                <div className="text-emerald-500 font-black italic">VS</div>
                <div className="text-center flex-1">
                    <p className="text-[10px] font-black uppercase text-text-primary truncate">{data.team_b_id?.name || '---'}</p>
                    <p className="text-[8px] text-text-tertiary uppercase">Away</p>
                </div>
            </div>
            <div className="pt-4 border-t border-light-border flex justify-between items-center text-[8px] font-bold text-text-tertiary uppercase tracking-widest">
                <span>{data.mode} OPS</span>
                <span>{new Date(data.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
    );

    if (type === 'disputes') return (
        <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm shadow-rose-500/5 group hover:border-rose-500 transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500 animate-pulse"><AlertCircle size={20} /></div>
                <button onClick={() => onResolve(data)} className="px-4 py-2 bg-rose-500 text-white text-[8px] font-black rounded-lg uppercase tracking-widest hover:bg-rose-600 transition-colors">Action</button>
            </div>
            <h5 className="text-sm font-black uppercase text-text-primary mb-1">INTEL CONFLICT</h5>
            <p className="text-[10px] text-text-tertiary font-medium mb-4">{data.reason}</p>
            <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
                <div className="flex justify-between text-[8px] font-bold text-rose-700 uppercase">
                    <span>{data.match_id?.team_a_id?.name}</span>
                    <span>VS</span>
                    <span>{data.match_id?.team_b_id?.name}</span>
                </div>
            </div>
        </div>
    );
};

const AdminModal = ({ isOpen, onClose, title, children }) => (
    <AnimatePresence>
        {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-text-primary/60 backdrop-blur-md"
                />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden glass-card p-8 md:p-10"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-padel-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-padel-blue/20">
                            <Settings size={20} />
                        </div>
                        <h3 className="text-sm md:text-base font-black uppercase italic tracking-tighter text-text-primary">{title}</h3>
                    </div>
                    {children}
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

export default AdminDashboard;
