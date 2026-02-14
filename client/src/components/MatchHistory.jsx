import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { History, Trophy, Calendar } from 'lucide-react';

const MatchHistory = ({ teamId }) => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // In a real app, we'd have a specific history endpoint
                // For now, let's fetch all finalized matches for the club or team
                // Logic: Search matches where team_a or team_b is our team and status is FINALIZED
                const { data } = await api.get(`/matches/history/${teamId}`);
                setMatches(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [teamId]);

    if (loading) return null;
    if (matches.length === 0) return null;

    return (
        <div className="bg-white rounded-[2rem] overflow-hidden">
            <div className="space-y-4 p-4">
                {matches.map((match, index) => {
                    const isTeamA = match.team_a_id._id === teamId;
                    const isWin = isTeamA ? match.result === 'WIN' : match.result === 'LOSS';
                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={match._id}
                            className="flex justify-between items-center p-5 bg-light-surface rounded-[1.5rem] border border-light-border hover:border-padel-green/50 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${isWin ? 'bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-200' : 'bg-rose-100 text-rose-600 shadow-sm shadow-rose-200'}`}>
                                    {isWin ? 'VIC' : 'DEF'}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-black text-text-primary uppercase italic">{match.team_a_id.name}</p>
                                        <span className="text-[10px] text-text-tertiary">VS</span>
                                        <p className="text-sm font-black text-text-primary uppercase italic">{match.team_b_id.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] text-text-tertiary font-black uppercase tracking-[0.2em]">{match.score || 'NO SCORE RECORDED'}</p>
                                        {isWin && <Trophy size={12} className="text-amber-500" />}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-sm font-black italic tracking-tighter ${isWin ? 'text-emerald-600' : 'text-text-tertiary'}`}>
                                    {isWin ? '+15 PTS' : '+5 PTS'}
                                </p>
                                <p className="text-[8px] text-text-tertiary font-bold uppercase tracking-[0.1em]">Battle Log Entry</p>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            {matches.length === 0 && (
                <div className="p-12 text-center">
                    <History className="w-12 h-12 text-light-border mx-auto mb-4" />
                    <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">No Historical Intel Found</p>
                </div>
            )}
        </div>
    );
};

export default MatchHistory;
