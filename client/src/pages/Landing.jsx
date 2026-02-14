import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { motion } from 'framer-motion';
import BackButton from '../components/BackButton';
import { Activity, Trophy, Users, Zap, Target, Award } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    const stats = [
        { label: 'Active Players', value: '2,400+', icon: <Users size={20} /> },
        { label: 'Matches Played', value: '15,800+', icon: <Activity size={20} /> },
        { label: 'Partner Clubs', value: '42', icon: <Target size={20} /> },
        { label: 'Leagues Live', value: '12', icon: <Trophy size={20} /> },
    ];

    return (
        <div className="bg-light-bg min-h-screen font-sans selection:bg-padel-blue selection:text-black">
            <BackButton className="absolute top-6 left-6 z-20" />
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-[-10%] w-[60%] h-[700px] bg-padel-blue/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[600px] bg-sky-400/5 blur-[120px] rounded-full" />
            </div>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-padel-blue/10 border border-padel-blue/20 text-padel-blue text-[10px] font-black uppercase tracking-widest mb-8">
                                <Zap size={14} className="animate-pulse" /> The Standard of Excellence
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-text-primary uppercase leading-[0.9] mb-8">
                                Find My <br /> <span className="text-padel-blue">Padel.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-text-secondary font-medium mb-12 max-w-lg leading-relaxed border-l-4 border-light-border pl-8 italic">
                                "The elite infrastructure for professional Padel leagues. Automated matchmaking, live performance analytics, and national rankings."
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button size="xl" onClick={() => navigate('/register')} className="shadow-xl shadow-padel-blue/20">
                                    <Zap className="w-5 h-5 mr-2" /> Start Playing
                                </Button>
                                <Button size="xl" variant="outline" onClick={() => navigate('/login')}>
                                    Member Login
                                </Button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="aspect-square rounded-[4rem] overflow-hidden border border-light-border shadow-2xl relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-padel-blue/20 to-sky-500/10 mix-blend-overlay group-hover:opacity-0 transition-opacity duration-1000" />
                                <img
                                    src="/assets/hero_padel.png"
                                    alt="Professional Find My Padel Court"
                                    className="w-full h-full object-cover transition-transform duration-[20s] linear animate-slow-zoom"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-text-primary/40 to-transparent" />
                                <div className="absolute bottom-10 left-10 text-white">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2">Venue of the Month</p>
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Elite Padel Arena</h3>
                                </div>
                            </div>
                            {/* Floating Card */}
                            <motion.div
                                animate={{ y: [0, -15, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -bottom-10 -left-10 bg-white/80 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-light-border shadow-2xl hidden md:block"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-padel-blue rounded-2xl flex items-center justify-center">
                                        <Trophy className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-text-primary">150+</div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Tournaments Hosted</div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-white border-y border-light-border relative z-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
                        {stats.map((stat, i) => (
                            <div key={i} className="text-center group">
                                <div className="inline-flex p-3 bg-light-surface rounded-xl text-text-tertiary group-hover:text-padel-blue group-hover:scale-110 transition-all mb-4">
                                    {stat.icon}
                                </div>
                                <div className="text-4xl font-black italic text-text-primary mb-1 tracking-tighter">{stat.value}</div>
                                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-text-tertiary">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Expanded */}
            <section className="py-32 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <span className="text-padel-blue text-xs font-black uppercase tracking-[0.4em] mb-4 block">Engineered for Performance</span>
                        <h2 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase text-text-primary leading-none">
                            League <span className="text-padel-blue">Intelligence.</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                title: 'Elo Matchmaking',
                                desc: 'Sophisticated skill-based pairing ensures every match is competitive and developmental.',
                                icon: <Target className="text-sky-500" />,
                                color: 'bg-sky-50'
                            },
                            {
                                title: 'Live Analytics',
                                desc: 'Track performance trends, set win rates, and tactical statistics across multiple seasons.',
                                icon: <Activity className="text-padel-blue" />,
                                color: 'bg-emerald-50'
                            },
                            {
                                title: 'Tournament Logic',
                                desc: 'Automated brackets, group stage calculations, and final-eight seedings.',
                                icon: <Award className="text-amber-500" />,
                                color: 'bg-amber-50'
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="p-12 bg-white rounded-[4rem] border border-light-border shadow-xl hover:shadow-2xl transition-all group"
                            >
                                <div className={`w-16 h-16 ${item.color} rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:rotate-6 transition-transform`}>
                                    {item.icon}
                                </div>
                                <h3 className="text-2xl font-black italic uppercase text-text-primary mb-4">{item.title}</h3>
                                <p className="text-text-secondary font-medium leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Partner Clubs */}
            <section className="py-32 bg-light-surface overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-20">
                        <div>
                            <span className="text-padel-blue text-xs font-black uppercase tracking-[0.4em] mb-4 block">Network Access</span>
                            <h2 className="text-5xl font-black italic tracking-tighter uppercase text-text-primary leading-none">
                                Premier <br /> <span className="text-text-tertiary">Locations.</span>
                            </h2>
                        </div>
                        <p className="max-w-md text-text-secondary font-medium italic border-l-2 border-light-border pl-6">
                            Join events across organized hubs. From rooftop courts to luxury clubs, Padel Vault is everywhere you play.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Realistic Mock Clubs with Images */}
                        {[
                            { name: "Skyline Padel Club", loc: "Downtown Layout", members: "1.2k", img: "/assets/location1.png" },
                            { name: "Harbor Padel Center", loc: "West Coast", members: "850+", img: "/assets/location2.png" },
                            { name: "Urban Court Arena", loc: "Central District", members: "2.4k", img: "/assets/hero_padel.png" },
                            { name: "Elite Padel Hub", loc: "North Hills", members: "900+", img: "/assets/location1.png" }
                        ].map((club, i) => (
                            <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-light-border shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 group cursor-pointer">
                                <div className="h-48 bg-slate-100 rounded-[2rem] mb-6 overflow-hidden relative">
                                    <img src={club.img} alt={club.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className={`absolute inset-0 bg-gradient-to-br from-padel-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                                </div>
                                <h4 className="text-xl font-black italic uppercase text-text-primary leading-tight mb-2">{club.name}</h4>
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-text-secondary">
                                    <span>{club.loc}</span>
                                    <span className="text-padel-blue font-black">{club.members}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-text-primary rounded-[5rem] p-16 md:p-32 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-padel-blue/10 blur-[120px] rounded-full" />
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-500/10 blur-[120px] rounded-full" />

                        <div className="relative z-10">
                            <h2 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase text-white leading-none mb-12">
                                Ready to <br /> <span className="text-padel-green">Deploy?</span>
                            </h2>
                            <Button size="xl" onClick={() => navigate('/register')} className="shadow-2xl shadow-padel-green/20">
                                Join the Elite Base
                            </Button>
                            <p className="mt-12 text-text-tertiary text-xs font-black uppercase tracking-[0.5em]">
                                V2.6.4 Stable // Secure Connection Established
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;
