import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User, Loader2, CheckCircle2, XCircle, Clock, Trophy, RefreshCw, LogOut } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import BackButton from '../components/BackButton';

/* ─────────────────────────────────────────────────────────────────────────────
 *  HELPERS
 * ───────────────────────────────────────────────────────────────────────────── */
const STATUS_COLORS = {
  AVAILABLE: 'text-green-700 bg-green-100',
  IN_MATCH:  'text-blue-700  bg-blue-100',
  COOLDOWN:  'text-orange-700 bg-orange-100',
  WAITING:   'text-yellow-700 bg-yellow-100',
  MATCHED:   'text-green-700  bg-green-100',
};

/* ─────────────────────────────────────────────────────────────────────────────
 *  COMPONENT
 * ───────────────────────────────────────────────────────────────────────────── */
const FriendlyMode = () => {
  const { user } = useAuth();

  // Tab: 'solo' | 'team'
  const [mode, setMode] = useState('solo');

  /* Solo state */
  const [poolStatus, setPoolStatus] = useState(null);   // API response
  const [poolLoading, setPoolLoading] = useState(true);

  /* Team state */
  const [myTeam, setMyTeam] = useState(null);
  const [teamLoading, setTeamLoading] = useState(true);
  const [findingMatch, setFindingMatch] = useState(false);

  /* History */
  const [history, setHistory] = useState({ soloHistory: [], teamHistory: [] });
  const [historyLoading, setHistoryLoading] = useState(true);

  /* ── Fetch pool status ─────────────────────────────────────────────────── */
  const fetchPoolStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/friendly/pool-status');
      setPoolStatus(data);
    } catch (err) {
      console.error('[Friendly] pool status err:', err);
    } finally {
      setPoolLoading(false);
    }
  }, []);

  /* ── Fetch user's team ─────────────────────────────────────────────────── */
  const fetchMyTeam = useCallback(async () => {
    try {
      const { data } = await api.get('/teams/me');
      setMyTeam(data || null);
    } catch {
      setMyTeam(null);
    } finally {
      setTeamLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await api.get('/friendly/history');
      setHistory(data);
    } catch {
      /* ignore */
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPoolStatus();
    fetchMyTeam();
    fetchHistory();
  }, []);

  /* ── Pool Actions ──────────────────────────────────────────────────────── */
  const handleJoinPool = async () => {
    try {
      const { data } = await api.post('/friendly/join-pool');
      toast.success(data.message);
      await fetchPoolStatus();
      if (data.status === 'MATCHED') fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join pool');
    }
  };

  const handleLeavePool = async () => {
    try {
      await api.delete('/friendly/leave-pool');
      toast('Left the friendly pool', { icon: '👋' });
      await fetchPoolStatus();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error leaving pool');
    }
  };

  const handleRefreshStatus = async () => {
    setPoolLoading(true);
    await fetchPoolStatus();
    toast('Status refreshed', { duration: 1500 });
  };

  /* ── Solo Result ───────────────────────────────────────────────────────── */
  const handleSubmitResult = async (result) => {
    try {
      await api.post('/friendly/submit-result', { result });
      toast.success('Result recorded! Great game 🎾');
      await fetchPoolStatus();
      await fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit result');
    }
  };

  /* ── Team Match ────────────────────────────────────────────────────────── */
  const handleFindTeamMatch = async () => {
    if (!myTeam) return;
    setFindingMatch(true);
    try {
      const { data } = await api.post('/friendly/find-team-match', { teamId: myTeam._id });
      toast.success(`Friendly match found vs ${data.opponent?.name || 'opponent'}! 🎾`);
      await fetchMyTeam();
      await fetchHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No opponent available right now');
    } finally {
      setFindingMatch(false);
    }
  };

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-light-bg pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <BackButton />
          <h1 className="text-3xl font-black mt-4">Friendly Mode <span className="text-padel-green">🎾</span></h1>
          <p className="text-text-secondary mt-1">
            Play casual games — <strong>no cooldown</strong>, no league points. Just fun.
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex bg-light-surface rounded-2xl p-1 mb-8 border border-light-border">
          {[
            { id: 'solo', label: 'Solo Entry', icon: User },
            { id: 'team', label: 'Team Entry', icon: Users },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${mode === id
                  ? 'bg-white shadow text-padel-blue border border-light-border'
                  : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ──────────── SOLO MODE ──────────── */}
          {mode === 'solo' && (
            <motion.div
              key="solo"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {/* Pool Status Card */}
              <div className="bg-white rounded-2xl border border-light-border p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="font-bold text-lg text-text-primary">Solo Pool</h2>
                  <button
                    onClick={handleRefreshStatus}
                    className="p-1.5 text-text-secondary hover:text-padel-blue transition-colors rounded-lg hover:bg-light-surface"
                    title="Refresh"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>

                {poolLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-padel-blue" />
                  </div>
                ) : !poolStatus?.inPool ? (
                  /* Not in pool */
                  <div>
                    <p className="text-text-secondary text-sm mb-6">
                      Join the solo pool to get paired with a compatible player in your club.
                      Matching criteria: <strong>same level</strong>, <strong>availability overlap</strong>,
                      and <strong>mixed-gender preference</strong>.
                    </p>
                    <div className="bg-light-surface rounded-xl p-4 mb-4 text-sm space-y-1">
                      <p><span className="text-text-tertiary">Your level:</span> <strong>{user?.experience_level || '—'}</strong></p>
                      <p><span className="text-text-tertiary">Availability:</span> <strong>{(user?.availability || []).join(', ') || '—'}</strong></p>
                      <p><span className="text-text-tertiary">Mixed play:</span> <strong>{user?.play_mixed || '—'}</strong></p>
                    </div>
                    <button
                      onClick={handleJoinPool}
                      className="w-full py-3 bg-padel-green text-black font-bold rounded-xl hover:bg-padel-green/90 transition-colors"
                    >
                      Join Friendly Pool
                    </button>
                  </div>
                ) : poolStatus.status === 'WAITING' ? (
                  /* In pool, waiting */
                  <div className="text-center py-4">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                      <Loader2 className="w-16 h-16 animate-spin text-padel-blue/20 absolute inset-0" />
                      <div className="w-16 h-16 rounded-full border-4 border-padel-blue border-dashed animate-spin absolute inset-0" style={{ animationDuration: '3s' }} />
                      <User className="w-8 h-8 text-padel-blue absolute inset-0 m-auto" />
                    </div>
                    <h3 className="font-bold text-lg text-text-primary mb-1">Looking for a partner…</h3>
                    <p className="text-sm text-text-secondary mb-6">
                      You'll be notified the moment someone compatible joins.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800 mb-4">
                      ⏳ You've been waiting since{' '}
                      {new Date(poolStatus.entry?.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <button
                      onClick={handleLeavePool}
                      className="w-full py-2.5 border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <LogOut size={14} /> Leave Pool
                    </button>
                  </div>
                ) : poolStatus.status === 'MATCHED' ? (
                  /* Matched! */
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="text-padel-green w-5 h-5" />
                      <span className="font-bold text-padel-green">Partner Found!</span>
                    </div>
                    {poolStatus.partner && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                        <p className="font-bold text-text-primary text-lg">{poolStatus.partner.full_name}</p>
                        <p className="text-sm text-text-secondary">{poolStatus.partner.experience_level}</p>
                        {poolStatus.partner.phone_number && (
                          <a
                            href={`https://wa.me/${poolStatus.partner.phone_number.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
                          >
                            📱 WhatsApp to Schedule
                          </a>
                        )}
                      </div>
                    )}

                    <p className="text-sm text-text-secondary mb-4">
                      After your game, optionally record the result — it doesn't affect league points.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleSubmitResult('WIN')}
                        className="py-3 bg-padel-green text-black font-bold rounded-xl hover:bg-padel-green/90 transition-colors flex items-center justify-center gap-2"
                      >
                        <Trophy size={16} /> I Won
                      </button>
                      <button
                        onClick={() => handleSubmitResult('LOSS')}
                        className="py-3 border border-light-border text-text-secondary font-bold rounded-xl hover:bg-light-surface transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle size={16} /> I Lost
                      </button>
                    </div>
                    <button
                      onClick={handleLeavePool}
                      className="w-full mt-3 py-2 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
                    >
                      Skip result & reset
                    </button>
                  </div>
                ) : (
                  /* Completed */
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-12 h-12 text-padel-green mx-auto mb-2" />
                    <h3 className="font-bold text-lg">Game Complete!</h3>
                    <p className="text-sm text-text-secondary mb-4">Ready for another game?</p>
                    <button
                      onClick={handleJoinPool}
                      className="w-full py-3 bg-padel-green text-black font-bold rounded-xl hover:bg-padel-green/90 transition-colors"
                    >
                      Join Pool Again
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ──────────── TEAM MODE ──────────── */}
          {mode === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl border border-light-border p-6 shadow-sm">
                <h2 className="font-bold text-lg text-text-primary mb-1">Team Friendly Match</h2>
                <p className="text-sm text-text-secondary mb-5">
                  Your 2v2 team plays a casual match against another team. No cooldown after the game.
                </p>

                {teamLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-padel-blue" />
                  </div>
                ) : !myTeam ? (
                  <div className="text-center py-6">
                    <Users className="w-12 h-12 text-text-tertiary mx-auto mb-3 opacity-40" />
                    <p className="text-text-secondary font-medium">You don't have a team yet</p>
                    <p className="text-sm text-text-tertiary mt-1">Create a team on your Dashboard first.</p>
                  </div>
                ) : myTeam.status === 'IN_MATCH' ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="font-semibold text-blue-800">Your team is currently in a match.</p>
                    <p className="text-sm text-blue-600 mt-1">Complete your current match before starting a friendly.</p>
                  </div>
                ) : !myTeam.player_2_id ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="font-semibold text-yellow-800">Partner Required</p>
                    <p className="text-sm text-yellow-700 mt-1">Invite a partner to your team before playing.</p>
                  </div>
                ) : (
                  <div>
                    <div className="bg-light-surface rounded-xl p-4 mb-5">
                      <p className="text-xs text-text-tertiary uppercase tracking-widest font-bold mb-2">Your Team</p>
                      <p className="font-bold text-text-primary text-lg">{myTeam.name}</p>
                      <p className="text-sm text-text-secondary">{myTeam.experience_level}</p>
                      <span className={`mt-2 inline-block text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[myTeam.status] || 'text-text-tertiary bg-light-surface'}`}>
                        {myTeam.status}
                      </span>
                    </div>
                    <button
                      onClick={handleFindTeamMatch}
                      disabled={findingMatch || myTeam.status !== 'AVAILABLE'}
                      className="w-full py-3 bg-padel-blue text-white font-bold rounded-xl hover:bg-padel-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {findingMatch ? (
                        <><Loader2 size={16} className="animate-spin" /> Finding opponent…</>
                      ) : (
                        <><Users size={16} /> Find Friendly Opponent</>
                      )}
                    </button>
                    {myTeam.status !== 'AVAILABLE' && (
                      <p className="text-center text-xs text-text-tertiary mt-2">
                        Team must be AVAILABLE to find a match. Current: {myTeam.status}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─────────── HISTORY SECTION ─────────── */}
        <div className="mt-10">
          <h2 className="font-bold text-xl text-text-primary mb-4 flex items-center gap-2">
            <Clock size={20} className="text-text-tertiary" /> Friendly History
          </h2>

          {historyLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-padel-blue" /></div>
          ) : history.soloHistory.length === 0 && history.teamHistory.length === 0 ? (
            <div className="bg-white rounded-2xl border border-light-border p-8 text-center text-text-tertiary">
              <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No friendly games yet. Play your first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Solo history */}
              {history.soloHistory.map((entry) => (
                <div key={entry._id} className="bg-white rounded-2xl border border-light-border p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-text-primary text-sm">
                      Solo vs <span className="text-padel-blue">{entry.matched_with_id?.full_name || 'Unknown'}</span>
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {new Date(entry.matched_at || entry.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.result ? (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${entry.result === 'WIN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {entry.result}
                      </span>
                    ) : (
                      <span className="text-xs text-text-tertiary">No result</span>
                    )}
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">Solo</span>
                  </div>
                </div>
              ))}

              {/* Team history */}
              {history.teamHistory.map((match) => (
                <div key={match._id} className="bg-white rounded-2xl border border-light-border p-4 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-text-primary text-sm">
                      {match.team_a_id?.name} <span className="text-text-tertiary">vs</span> {match.team_b_id?.name}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {new Date(match.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${match.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {match.status}
                    </span>
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-semibold">Team</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default FriendlyMode;
