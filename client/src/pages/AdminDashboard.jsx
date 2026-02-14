import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Button from '../components/Button';
import Input from '../components/Input';
import NotificationBell from '../components/NotificationBell';
import {
    Shield, BarChart3, Building2, Users, Trophy, AlertCircle,
    Plus, Edit, Trash2, Check, X, ArrowLeft, Eye, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import BackButton from '../components/BackButton';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('stats');
    const [stats, setStats] = useState(null);
    const [clubs, setClubs] = useState([]);
    const [teams, setTeams] = useState([]);
    const [matches, setMatches] = useState([]);
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modals
    const [showCreateClub, setShowCreateClub] = useState(false);
    const [showForceMatch, setShowForceMatch] = useState(false);
    const [showResolveDispute, setShowResolveDispute] = useState(false);
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [showOverrideResult, setShowOverrideResult] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [editingClub, setEditingClub] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user?.role !== 'ADMIN') {
            navigate('/dashboard');
            return;
        }
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'stats') {
                const { data } = await api.get('/admin/stats');
                setStats(data);
            } else if (activeTab === 'clubs') {
                const { data } = await api.get('/admin/clubs');
                setClubs(data);
            } else if (activeTab === 'teams') {
                const { data } = await api.get('/admin/teams');
                setTeams(data);
            } else if (activeTab === 'matches') {
                const { data } = await api.get('/admin/matches');
                setMatches(data);
            } else if (activeTab === 'disputes') {
                const { data } = await api.get('/admin/disputes');
                setDisputes(data);
            }
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClub = async (id) => {
        if (!confirm('Delete this club? This cannot be undone.')) return;
        try {
            await api.delete(`/admin/clubs/${id}`);
            toast.success('Club deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete club');
        }
    };

    const handleToggleTeam = async (id) => {
        try {
            await api.post(`/admin/teams/${id}/toggle-active`);
            toast.success('Team status updated');
            fetchData();
        } catch (error) {
            toast.error('Failed to update team');
        }
    };

    const handleRemoveInactive = async () => {
        if (!confirm('Remove ALL inactive teams? This cannot be undone.')) return;
        try {
            const { data } = await api.delete('/admin/teams/remove-inactive');
            toast.success(data.message);
            fetchData();
        } catch (error) {
            toast.error('Failed to remove inactive teams');
        }
    };

    const handleDeleteMatch = async (id) => {
        if (!confirm('Delete this match?')) return;
        try {
            await api.delete(`/admin/matches/${id}`);
            toast.success('Match deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete match');
        }
    };

    const tabs = [
        { id: 'stats', label: 'Statistics', icon: BarChart3 },
        { id: 'clubs', label: 'Clubs', icon: Building2 },
        { id: 'teams', label: 'Teams', icon: Users },
        { id: 'matches', label: 'Matches', icon: Trophy },
        { id: 'disputes', label: 'Disputes', icon: AlertCircle }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-light-bg via-light-surface to-slate-50">
            <main className="max-w-7xl mx-auto px-4 md:px-6 pt-32 pb-8 font-sans">
                {/* Tactical Header */}
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <BackButton />
                        
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-padel-blue mb-2">Operator: {user.full_name}</p>
                        <h1 className="text-5xl font-black italic tracking-tighter text-text-primary uppercase">Central <span className="text-padel-blue">Command</span></h1>
                    </div>
                    <div className="flex gap-3">
                        <NotificationBell />
                    </div>
                </div>
                {/* Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-padel-green text-white shadow-lg shadow-padel-green/30'
                                    : 'bg-white border border-light-border text-text-secondary hover:border-padel-green'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content area with bottom margin for breathing room */}
                <div className="bg-white rounded-3xl p-8 border border-light-border shadow-lg mb-20 min-h-[60vh]">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-12 h-12 border-4 border-padel-green border-t-transparent rounded-full"
                            />
                        </div>
                    ) : (
                        <>
                            {/* Statistics Tab */}
                            {activeTab === 'stats' && stats && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-black text-text-primary mb-6">Platform Statistics</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <StatCard label="Total Clubs" value={stats.totalClubs} color="blue" />
                                        <StatCard label="Total Teams" value={stats.totalTeams} color="green" />
                                        <StatCard label="Active Teams" value={stats.activeTeams} color="emerald" />
                                        <StatCard label="Total Matches" value={stats.totalMatches} color="purple" />
                                        <StatCard label="Active Matches" value={stats.activeMatches} color="orange" />
                                        <StatCard label="Total Disputes" value={stats.totalDisputes} color="red" />
                                        <StatCard label="Pending Disputes" value={stats.pendingDisputes} color="amber" />
                                        <StatCard label="Total Users" value={stats.totalUsers} color="indigo" />
                                    </div>
                                </div>
                            )}

                            {/* Clubs Tab */}
                            {activeTab === 'clubs' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-black text-text-primary">Club Management</h2>
                                        <Button onClick={() => setShowCreateClub(true)}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Club
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {clubs.map(club => (
                                            <div key={club._id} className="p-4 border border-light-border rounded-xl hover:border-padel-green transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-bold text-text-primary">{club.name}</h3>
                                                        <p className="text-sm text-text-secondary">{club.location}</p>
                                                        {club.phone_number && (
                                                            <p className="text-xs text-text-tertiary mt-1">{club.phone_number}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => setEditingClub(club)}>
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                        <Button variant="danger" size="sm" onClick={() => handleDeleteClub(club._id)}>
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Teams Tab */}
                            {activeTab === 'teams' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-black text-text-primary uppercase italic">Active Squads</h2>
                                        <div className="flex gap-4">
                                            <Input
                                                placeholder="Search teams..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-64"
                                            />
                                            <Button variant="danger" onClick={handleRemoveInactive}>
                                                Purge Inactive
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {teams.filter(t =>
                                            t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            t.captain_id?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map(team => (
                                            <div key={team._id} className="p-4 border border-light-border rounded-xl hover:border-padel-green transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-bold text-text-primary">{team.name}</h3>
                                                        <p className="text-sm text-text-secondary">
                                                            Captain: {team.captain_id?.full_name || 'N/A'}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${team.status === 'INACTIVE' ? 'bg-red-100 text-red-700' :
                                                                team.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                                                                    'bg-blue-100 text-blue-700'
                                                                }`}>
                                                                {team.status}
                                                            </span>
                                                            <span className="text-xs text-text-tertiary">{team.points || 0} points</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant={team.status === 'INACTIVE' ? 'primary' : 'danger'}
                                                        size="sm"
                                                        onClick={() => handleToggleTeam(team._id)}
                                                    >
                                                        {team.status === 'INACTIVE' ? 'Enable' : 'Disable'}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Matches Tab */}
                            {activeTab === 'matches' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h2 className="text-2xl font-black text-text-primary uppercase italic">Intelligence Archive</h2>
                                        <div className="flex gap-4">
                                            <Input
                                                placeholder="Search callsigns..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-64"
                                            />
                                            <Button onClick={() => setShowForceMatch(true)}>
                                                <Plus className="w-4 h-4 mr-2" />
                                                Force Entry
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {matches.filter(m =>
                                            m.team_a_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            m.team_b_id?.name?.toLowerCase().includes(searchTerm.toLowerCase())
                                        ).map(match => (
                                            <div key={match._id} className="p-4 border border-light-border rounded-xl hover:border-padel-green transition-colors">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="font-bold text-text-primary">
                                                                {match.team_a_id?.name || 'Team A'}
                                                            </span>
                                                            <span className="text-text-tertiary font-bold">VS</span>
                                                            <span className="font-bold text-text-primary">
                                                                {match.team_b_id?.name || 'Team B'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${match.status === 'PROPOSED' ? 'bg-amber-100 text-amber-700' :
                                                                match.status === 'ACCEPTED' ? 'bg-padel-blue/10 text-padel-blue' :
                                                                    match.status === 'SCHEDULED' ? 'bg-padel-green/10 text-padel-green' :
                                                                        match.status === 'AWAITING_CONFIRMATION' ? 'bg-purple-100 text-purple-700' :
                                                                            match.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                                                'bg-red-100 text-red-700'
                                                                }`}>
                                                                {match.status}
                                                            </span>
                                                            {match.score && (
                                                                <span className="text-xs text-text-tertiary">{match.score}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => {
                                                            setSelectedMatch(match);
                                                            setShowOverrideResult(true);
                                                        }}>
                                                            <Edit className="w-3 h-3" />
                                                        </Button>
                                                        <Button variant="danger" size="sm" onClick={() => handleDeleteMatch(match._id)}>
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Disputes Tab */}
                            {activeTab === 'disputes' && (
                                <div className="space-y-6">
                                    <h2 className="text-2xl font-black text-text-primary">Dispute Resolution</h2>
                                    <div className="space-y-3">
                                        {disputes.length === 0 ? (
                                            <p className="text-center text-text-tertiary py-10">No disputes to review</p>
                                        ) : (
                                            disputes.map(dispute => (
                                                <div key={dispute._id} className="p-4 border-2 border-amber-200 bg-amber-50 rounded-xl">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <h3 className="font-bold text-text-primary">
                                                                {dispute.match_id?.team_a_id?.name} vs {dispute.match_id?.team_b_id?.name}
                                                            </h3>
                                                            <p className="text-sm text-text-secondary">
                                                                Disputed by: {dispute.disputed_by?.full_name}
                                                            </p>
                                                        </div>
                                                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${dispute.status === 'PENDING' ? 'bg-amber-200 text-amber-800' :
                                                            dispute.status === 'RESOLVED' ? 'bg-green-200 text-green-800' :
                                                                'bg-red-200 text-red-800'
                                                            }`}>
                                                            {dispute.status}
                                                        </span>
                                                    </div>
                                                    <div className="bg-white rounded-lg p-3 mb-3">
                                                        <p className="text-sm text-text-secondary"><strong>Reason:</strong> {dispute.reason}</p>
                                                    </div>
                                                    {dispute.status === 'PENDING' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedDispute(dispute);
                                                                setShowResolveDispute(true);
                                                            }}
                                                        >
                                                            Resolve Dispute
                                                        </Button>
                                                    )}
                                                    {dispute.status === 'RESOLVED' && (
                                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                            <p className="text-xs text-green-800">
                                                                <strong>Resolution:</strong> {dispute.resolution}
                                                            </p>
                                                            {dispute.admin_notes && (
                                                                <p className="text-xs text-green-700 mt-1">
                                                                    <strong>Notes:</strong> {dispute.admin_notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Modals */}
            <CreateClubModal
                show={showCreateClub || !!editingClub}
                onClose={() => { setShowCreateClub(false); setEditingClub(null); }}
                onSuccess={fetchData}
                club={editingClub}
            />
            <ForceMatchModal show={showForceMatch} onClose={() => setShowForceMatch(false)} onSuccess={fetchData} teams={teams} />
            <ResolveDisputeModal
                show={showResolveDispute}
                onClose={() => { setShowResolveDispute(false); setSelectedDispute(null); }}
                onSuccess={fetchData}
                dispute={selectedDispute}
            />
            <OverrideResultModal
                show={showOverrideResult}
                onClose={() => { setShowOverrideResult(false); setSelectedMatch(null); }}
                onSuccess={fetchData}
                match={selectedMatch}
            />
        </div>
    );
};

// Stat Card Component
const StatCard = ({ label, value, color }) => {
    const colors = {
        blue: 'from-blue-500 to-blue-600',
        green: 'from-green-500 to-green-600',
        emerald: 'from-emerald-500 to-emerald-600',
        purple: 'from-purple-500 to-purple-600',
        orange: 'from-orange-500 to-orange-600',
        red: 'from-red-500 to-red-600',
        amber: 'from-amber-500 to-amber-600',
        indigo: 'from-indigo-500 to-indigo-600'
    };

    return (
        <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-6 text-white shadow-lg`}>
            <p className="text-sm opacity-90 mb-2">{label}</p>
            <p className="text-4xl font-black">{value}</p>
        </div>
    );
};

// Create Club Modal
const CreateClubModal = ({ show, onClose, onSuccess, club }) => {
    const [formData, setFormData] = useState({ name: '', location: '', phone_number: '' });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (club) {
            setFormData({
                name: club.name || '',
                location: club.location || '',
                phone_number: club.phone_number || ''
            });
        } else {
            setFormData({ name: '', location: '', phone_number: '' });
        }
    }, [club, show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (club) {
                await api.put(`/admin/clubs/${club._id}`, formData);
                toast.success('Club updated successfully');
            } else {
                await api.post('/admin/clubs', formData);
                toast.success('Club created successfully');
            }
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save club');
        } finally {
            setIsLoading(false);
        }
    };

    if (!show) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-light-border">
                <h3 className="text-xl font-black text-text-primary mb-4">{club ? 'Edit Club' : 'Create New Club'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Club Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                    />
                    <Input
                        label="Phone Number"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    />
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button type="submit" isLoading={isLoading} className="flex-1">{club ? 'Save Changes' : 'Create'}</Button>
                    </div>
                </form>
            </div>
        </>
    );
};

// Force Match Modal
const ForceMatchModal = ({ show, onClose, onSuccess, teams }) => {
    const [teamA, setTeamA] = useState('');
    const [teamB, setTeamB] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (teamA === teamB) {
            toast.error('Please select different teams');
            return;
        }
        setIsLoading(true);
        try {
            await api.post('/admin/matches/force-create', { team_a_id: teamA, team_b_id: teamB });
            toast.success('Match created successfully');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create match');
        } finally {
            setIsLoading(false);
        }
    };

    if (!show) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-light-border">
                <h3 className="text-xl font-black text-text-primary mb-4">Force Create Match</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-text-secondary block mb-2">Team A</label>
                        <select
                            value={teamA}
                            onChange={(e) => setTeamA(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-light-border rounded-xl text-text-primary focus:border-padel-green focus:ring-2 focus:ring-padel-green/20"
                            required
                        >
                            <option value="">Select team...</option>
                            {teams.filter(t => t.status !== 'INACTIVE').map(t => (
                                <option key={t._id} value={t._id}>{t.name} ({t.points || 0} pts)</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-text-secondary block mb-2">Team B</label>
                        <select
                            value={teamB}
                            onChange={(e) => setTeamB(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-light-border rounded-xl text-text-primary focus:border-padel-green focus:ring-2 focus:ring-padel-green/20"
                            required
                        >
                            <option value="">Select team...</option>
                            {teams.filter(t => t.status !== 'INACTIVE' && t._id !== teamA).map(t => (
                                <option key={t._id} value={t._id}>{t.name} ({t.points || 0} pts)</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button type="submit" isLoading={isLoading} className="flex-1">Create Match</Button>
                    </div>
                </form>
            </div>
        </>
    );
};

// Resolve Dispute Modal
const ResolveDisputeModal = ({ show, onClose, onSuccess, dispute }) => {
    const [resolution, setResolution] = useState('UPHOLD_ORIGINAL');
    const [adminNotes, setAdminNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.put(`/admin/disputes/${dispute._id}/resolve`, {
                resolution,
                admin_notes: adminNotes
            });
            toast.success('Dispute resolved');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Failed to resolve dispute');
        } finally {
            setIsLoading(false);
        }
    };

    if (!show || !dispute) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-light-border">
                <h3 className="text-xl font-black text-text-primary mb-4">Resolve Dispute</h3>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                    <p className="text-sm text-amber-900"><strong>Reason:</strong> {dispute.reason}</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-text-secondary block mb-2">Resolution</label>
                        <select
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-light-border rounded-xl text-text-primary"
                        >
                            <option value="UPHOLD_ORIGINAL">Uphold Original Result</option>
                            <option value="REVERSE_RESULT">Reverse Result</option>
                            <option value="VOID_MATCH">Void Match</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-text-secondary block mb-2">Admin Notes</label>
                        <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 bg-white border border-light-border rounded-xl text-text-primary resize-none"
                            placeholder="Add explanation for resolution..."
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button type="submit" isLoading={isLoading} className="flex-1">Resolve</Button>
                    </div>
                </form>
            </div>
        </>
    );
};

// Override Result Modal
const OverrideResultModal = ({ show, onClose, onSuccess, match }) => {
    const [result, setResult] = useState('WIN');
    const [score, setScore] = useState('');
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (match) {
            setResult(match.result || 'WIN');
            setScore(match.score || '');
        }
    }, [match, show]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.put(`/admin/matches/${match._id}/override`, {
                result,
                score,
                reason
            });
            toast.success('Match result overridden');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Failed to override result');
        } finally {
            setIsLoading(false);
        }
    };

    if (!show || !match) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-light-border">
                <h3 className="text-xl font-black text-text-primary mb-2">Override Match Result</h3>
                <p className="text-xs text-text-tertiary mb-6 uppercase font-bold tracking-widest italic">
                    {match.team_a_id?.name} vs {match.team_b_id?.name}
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-text-secondary block mb-2">Winner (relative to {match.team_a_id?.name})</label>
                        <select
                            value={result}
                            onChange={(e) => setResult(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-light-border rounded-xl text-text-primary"
                        >
                            <option value="WIN">Team A Victory</option>
                            <option value="LOSS">Team B Victory</option>
                        </select>
                    </div>
                    <Input
                        label="Final Score"
                        value={score}
                        onChange={(e) => setScore(e.target.value)}
                        placeholder="6-4, 6-4"
                        required
                    />
                    <div>
                        <label className="text-sm font-semibold text-text-secondary block mb-2">Override Reason</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={2}
                            className="w-full px-4 py-2.5 bg-white border border-light-border rounded-xl text-text-primary resize-none"
                            placeholder="Why are you overriding this result?"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
                        <Button type="submit" isLoading={isLoading} className="flex-1">Apply Override</Button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default AdminDashboard;
