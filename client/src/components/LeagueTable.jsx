import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Trophy, Medal, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const LeagueTable = ({ clubId }) => {
    const { user } = useAuth();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (clubId) {
            fetchLeague();
        }
    }, [clubId]);

    const fetchLeague = async () => {
        try {
            const { data } = await api.get(`/teams/league/${clubId}`);
            setTeams(data);
        } catch (err) {
            console.error('Failed to fetch league table');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-slate-500 text-xs font-black uppercase animate-pulse">Scanning Grid...</div>;

    return (
        <div className="bg-white rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] text-text-tertiary uppercase font-black tracking-widest bg-light-surface/50">
                            <th className="px-6 py-4">Rank</th>
                            <th className="px-6 py-4">Squad</th>
                            <th className="px-6 py-4 text-center">W / L</th>
                            <th className="px-6 py-4 text-right">Points</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-light-border">
                        {teams.map((team, index) => {
                            const isFirst = index === 0;
                            const isSecond = index === 1;
                            const isThird = index === 2;
                            const isUserTeam = user && (team.captain_id === user._id || team.player_2_id === user._id);

                            return (
                                <motion.tr
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={team._id}
                                    className={`group hover:bg-light-surface/50 transition-colors ${isUserTeam ? 'bg-padel-green/5' : ''}`}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {isFirst ? <Medal size={16} className="text-amber-500" /> :
                                                isSecond ? <Medal size={16} className="text-slate-400" /> :
                                                    isThird ? <Medal size={16} className="text-amber-700" /> :
                                                        <span className="text-[10px] font-black text-text-tertiary ml-1">#{index + 1}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-black uppercase italic group-hover:text-padel-green transition-colors ${isUserTeam ? 'text-padel-green' : 'text-text-primary'}`}>
                                                {team.name}
                                            </span>
                                            <span className="text-[8px] text-text-tertiary font-bold uppercase tracking-widest">{team.matches_played} Missions</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2 font-black text-[10px]">
                                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{team.wins}</span>
                                            <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">{team.losses}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-sm font-black ${isFirst ? 'text-padel-green' : 'text-text-primary'}`}>{team.points}</span>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {teams.length === 0 && (
                <div className="p-12 text-center">
                    <Target className="w-12 h-12 text-light-border mx-auto mb-4" />
                    <p className="text-text-tertiary text-[10px] font-black uppercase tracking-widest">No Active Squads Detected</p>
                </div>
            )}
        </div>
    );
};

export default LeagueTable;
