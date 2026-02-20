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
            <section className="relative pt-32 pb-16 md:pt-48 md:pb-32 px-4 md:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-padel-blue/10 border border-padel-blue/20 text-padel-blue text-[10px] font-black uppercase tracking-widest mb-6 md:mb-8">
                                <Zap size={14} className="animate-pulse" /> The Standard of Excellence
                            </div>
                            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black italic tracking-tighter text-text-primary uppercase leading-[0.9] mb-6 md:mb-8">
                                Find My <br className="hidden lg:block" /> <span className="text-padel-blue">Padel.</span>
                            </h1>
                            <p className="text-base sm:text-lg md:text-xl text-text-secondary font-medium mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed border-l-4 border-light-border pl-6 md:pl-8 italic text-left">
                                "The elite infrastructure for professional Padel leagues. Automated matchmaking, live performance analytics, and national rankings."
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <Button size="xl" onClick={() => navigate('/register')} className="shadow-xl shadow-padel-blue/20 w-full sm:w-auto">
                                    <Zap className="w-5 h-5 mr-2" /> Start Playing
                                </Button>
                                <Button size="xl" variant="outline" onClick={() => navigate('/login')} className="w-full sm:w-auto">
                                    Member Login
                                </Button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="relative mt-8 lg:mt-0"
                        >
                            <div className="aspect-square rounded-[3rem] md:rounded-[4rem] overflow-hidden border border-light-border shadow-2xl relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-padel-blue/20 to-sky-500/10 mix-blend-overlay group-hover:opacity-0 transition-opacity duration-1000" />
                                <img
                                    src="/assets/hero_padel.png"
                                    alt="Professional Find My Padel Court"
                                    className="w-full h-full object-cover transition-transform duration-[20s] linear animate-slow-zoom"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-text-primary/40 to-transparent" />
                                <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-white z-10 text-left">
                                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] mb-1 md:mb-2">Venue of the Month</p>
                                    <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter">Elite Padel Arena</h3>
                                </div>
                            </div>
                            {/* Floating Card - Hidden on very small screens, shown safely on md+ */}
                            <motion.div
                                animate={{ y: [0, -15, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -bottom-6 -left-6 md:-bottom-10 md:-left-10 bg-white/80 backdrop-blur-2xl p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-light-border shadow-2xl hidden sm:block z-20"
                            >
                                <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-padel-blue rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                                        <Trophy className="text-white w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xl md:text-2xl font-black text-text-primary leading-none mb-1">150+</div>
                                        <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-text-secondary leading-tight">Tournaments<br className="md:hidden" /> Hosted</div>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-12 md:py-20 bg-white border-y border-light-border relative z-10">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                        {stats.map((stat, i) => (
                            <div key={i} className="text-center group">
                                <div className="inline-flex p-3 bg-light-surface rounded-xl text-text-tertiary group-hover:text-padel-blue group-hover:scale-110 transition-all mb-3 md:mb-4">
                                    {stat.icon}
                                </div>
                                <div className="text-2xl sm:text-3xl md:text-4xl font-black italic text-text-primary mb-1 tracking-tighter">{stat.value}</div>
                                <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-text-tertiary">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Expanded */}
            <section className="py-16 md:py-32 px-4 md:px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 md:mb-24">
                        <span className="text-padel-blue text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em] mb-3 md:mb-4 block">Engineered for Performance</span>
                        <h2 className="text-4xl sm:text-5xl md:text-7xl font-black italic tracking-tighter uppercase text-text-primary leading-[1.1] md:leading-none">
                            League <span className="text-padel-blue">Intelligence.</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                        {[
                            {
                                title: 'Elo Matchmaking',
                                desc: 'Sophisticated skill-based pairing ensures every match is competitive and developmental.',
                                icon: <Target className="text-sky-500 w-6 h-6 md:w-8 md:h-8" />,
                                color: 'bg-sky-50'
                            },
                            {
                                title: 'Live Analytics',
                                desc: 'Track performance trends, set win rates, and tactical statistics across multiple seasons.',
                                icon: <Activity className="text-padel-blue w-6 h-6 md:w-8 md:h-8" />,
                                color: 'bg-emerald-50'
                            },
                            {
                                title: 'Tournament Logic',
                                desc: 'Automated brackets, group stage calculations, and final-eight seedings.',
                                icon: <Award className="text-amber-500 w-6 h-6 md:w-8 md:h-8" />,
                                color: 'bg-amber-50'
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -10 }}
                                className="p-8 md:p-12 bg-white rounded-[3rem] md:rounded-[4rem] border border-light-border shadow-xl hover:shadow-2xl transition-all group text-center md:text-left"
                            >
                                <div className={`w-14 h-14 md:w-16 md:h-16 mx-auto md:mx-0 ${item.color} rounded-[1.25rem] md:rounded-[1.5rem] flex items-center justify-center mb-6 md:mb-8 group-hover:rotate-6 transition-transform`}>
                                    {item.icon}
                                </div>
                                <h3 className="text-xl md:text-2xl font-black italic uppercase text-text-primary mb-3 md:mb-4 leading-tight">{item.title}</h3>
                                <p className="text-sm md:text-base text-text-secondary font-medium leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Partner Clubs */}
            <section className="py-16 md:py-32 bg-light-surface overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-8 mb-12 md:mb-20">
                        <div>
                            <span className="text-padel-blue text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em] mb-3 md:mb-4 block">Network Access</span>
                            <h2 className="text-4xl sm:text-5xl font-black italic tracking-tighter uppercase text-text-primary leading-[1.1] md:leading-none">
                                Premier <br className="hidden md:block" /> <span className="text-text-tertiary">Locations.</span>
                            </h2>
                        </div>
                        <p className="max-w-md text-sm md:text-base text-text-secondary font-medium italic border-l-2 border-light-border pl-4 md:pl-6 leading-relaxed">
                            Join events across organized hubs. From rooftop courts to luxury clubs, Padel Vault is everywhere you play.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                        {/* Realistic Mock Clubs with Images */}
                        {[
                            { name: "Skyline Padel Club", loc: "Downtown Layout", members: "1.2k", img: "/assets/location1.png" },
                            { name: "Harbor Padel Center", loc: "West Coast", members: "850+", img: "/assets/location2.png" },
                            { name: "Urban Court Arena", loc: "Central", members: "2.4k", img: "/assets/hero_padel.png" },
                            { name: "Elite Padel Hub", loc: "North Hills", members: "900+", img: "/assets/location1.png" }
                        ].map((club, i) => (
                            <div key={i} className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border border-light-border shadow-lg hover:shadow-xl transition-all hover:-translate-y-2 group cursor-pointer">
                                <div className="h-40 md:h-48 bg-slate-100 rounded-[1.5rem] md:rounded-[2rem] mb-5 md:mb-6 overflow-hidden relative">
                                    <img src={club.img} alt={club.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className={`absolute inset-0 bg-gradient-to-br from-padel-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                                </div>
                                <h4 className="text-lg md:text-xl font-black italic uppercase text-text-primary leading-tight mb-2 md:mb-3">{club.name}</h4>
                                <div className="flex justify-between items-center text-[10px] md:text-xs font-bold uppercase tracking-widest text-text-secondary">
                                    <span>{club.loc}</span>
                                    <span className="text-padel-blue font-black">{club.members}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-16 md:py-32 px-4 md:px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-text-primary rounded-[3rem] md:rounded-[5rem] p-10 sm:p-16 md:p-24 lg:p-32 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-padel-blue/10 blur-[80px] md:blur-[120px] rounded-full" />
                        <div className="absolute bottom-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-sky-500/10 blur-[80px] md:blur-[120px] rounded-full" />

                        <div className="relative z-10">
                            <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black italic tracking-tighter uppercase text-white leading-[1.1] md:leading-none mb-8 md:mb-12">
                                Ready to <br className="hidden sm:block" /> <span className="text-padel-green">Deploy?</span>
                            </h2>
                            <Button size="xl" onClick={() => navigate('/register')} className="shadow-2xl shadow-padel-green/20 w-full sm:w-auto text-sm sm:text-base md:text-lg">
                                Join the Elite Base
                            </Button>
                            <p className="mt-8 md:mt-12 text-text-tertiary text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.5em]">
                                V2.6.4 Stable <br className="sm:hidden" /> <span className="hidden sm:inline">//</span> Secure Connection Established
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Landing;
