import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BackButton from '../components/BackButton';
import { Activity, Trophy, Shield, Zap, ArrowLeft, Target, Eye, Ruler } from 'lucide-react';
import Button from '../components/Button';

const About = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-light-bg min-h-screen relative overflow-hidden font-sans">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-padel-green/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-10 w-96 h-96 bg-padel-green/5 blur-[120px] rounded-full" />

            <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10">
                <BackButton className="absolute top-6 left-6 z-20" />
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
                        <div>
                            <span className="text-padel-green text-xs font-black uppercase tracking-[0.4em] mb-4 block">The Foundation</span>
                            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase text-text-primary leading-none mb-8">
                                Ultimate <br /> <span className="text-padel-green">Ambition.</span>
                            </h1>
                            <p className="text-text-secondary text-lg font-medium leading-relaxed italic border-l-4 border-light-border pl-8">
                                "Padel Vault was born from a single realization: progress cannot be measured without data. Excellence cannot be achieved without competition."
                            </p>
                        </div>
                        <div className="aspect-[4/5] rounded-[4rem] overflow-hidden border border-light-border shadow-2xl relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-padel-green/20 to-lime-600/10 mix-blend-overlay" />
                            <img
                                src="/assets/stats.png"
                                alt="Elite Padel"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.src = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=2070&auto=format&fit=crop';
                                }}
                            />
                        </div>
                    </div>

                    {/* Mission & Vision */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="bg-white/60 backdrop-blur-xl p-12 rounded-[3.5rem] border border-light-border shadow-xl"
                        >
                            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-8">
                                <Target className="text-emerald-600" size={32} />
                            </div>
                            <h2 className="text-3xl font-black italic uppercase text-text-primary mb-6">The Mission</h2>
                            <p className="text-text-secondary font-medium leading-relaxed">
                                To provide Padel players with a professional infrastructure that mirrors international circuit standards. We automate the logistics of matchmaking and ranking, allowing athletes to focus purely on performance.
                            </p>
                        </motion.div>
                        <motion.div
                            whileHover={{ y: -10 }}
                            className="bg-white/60 backdrop-blur-xl p-12 rounded-[3.5rem] border border-light-border shadow-xl"
                        >
                            <div className="w-16 h-16 bg-sky-100 rounded-2xl flex items-center justify-center mb-8">
                                <Eye className="text-sky-600" size={32} />
                            </div>
                            <h2 className="text-3xl font-black italic uppercase text-text-primary mb-6">The Vision</h2>
                            <p className="text-text-secondary font-medium leading-relaxed">
                                To become the authoritative source of padel intelligence. We aim to bridge the gap between local talent and global visibility through data-driven performance tracking and competitive integrity.
                            </p>
                        </motion.div>
                    </div>

                    {/* Engagement Protocol */}
                    <div className="mb-32">
                        <div className="flex items-center gap-4 mb-12">
                            <div className="p-3 bg-padel-green rounded-xl">
                                <Shield className="text-white" size={24} />
                            </div>
                            <h2 className="text-4xl font-black italic uppercase text-text-primary tracking-tighter">Engagement <span className="text-padel-green">Protocol</span></h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { title: '48h Confirmation', desc: 'Every result is subject to mutual verification. Failure to act within 48h triggers automated Vault seal (Finalization).', icon: <Shield size={24} className="text-sky-500" />, bg: 'bg-sky-50' },
                                { title: '7-Day Cooldown', desc: 'To prevent league saturation, teams enter a mandatory 7-day tactical cooldown after every completed match.', icon: <Zap size={24} className="text-amber-500" />, bg: 'bg-amber-50' },
                                { title: 'Points Weighted', desc: 'Our ranking engine uses Elo-inspired logic. Wins against higher-ranked teams grant exponential growth.', icon: <Trophy size={24} className="text-padel-green" />, bg: 'bg-emerald-50' }
                            ].map((rule, i) => (
                                <div key={i} className="p-10 bg-white rounded-[3rem] border border-light-border group hover:border-padel-green/30 transition-all shadow-lg hover:shadow-xl">
                                    <div className={`w-14 h-14 ${rule.bg} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                                        {rule.icon}
                                    </div>
                                    <h3 className="text-xl font-black uppercase italic text-text-primary mb-4">{rule.title}</h3>
                                    <p className="text-text-secondary text-sm font-semibold leading-relaxed">{rule.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-center py-20 border-t border-light-border">
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-light-surface border border-light-border text-[10px] font-black uppercase tracking-widest text-text-secondary mb-12">
                            System Status: <span className="text-padel-green">Operational</span>
                        </div>
                        <p className="text-text-tertiary text-xs font-black uppercase tracking-[0.4em]">Built for the Elite. Powered by Padel Vault Intelligence.</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default About;
