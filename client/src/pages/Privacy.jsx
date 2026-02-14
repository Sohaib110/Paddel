import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BackButton from '../components/BackButton';
import { Shield, ArrowLeft, Lock, EyeOff, UserCheck, Database, Fingerprint } from 'lucide-react';

const Privacy = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-light-bg min-h-screen relative overflow-hidden font-sans">
            <BackButton className="absolute top-6 left-6 z-20" />
            {/* Background Decor */}
            <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-padel-green/5 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="max-w-4xl mx-auto px-6 pt-32 pb-24 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="mb-16">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-padel-green rounded-xl">
                                <Shield className="text-white" size={32} />
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase text-text-primary leading-none">
                                Data <span className="text-padel-green">Protocol.</span>
                            </h1>
                        </div>
                        <p className="text-text-tertiary font-black uppercase text-[10px] tracking-[0.4em] italic border-l-2 border-light-border pl-4">Standardized Security Manifest v2.6.4 // Padel Vault Core</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                        <div className="p-10 bg-white shadow-xl rounded-[3rem] border border-light-border space-y-6">
                            <Lock className="text-sky-500" size={24} />
                            <h3 className="text-xl font-black uppercase italic text-text-primary leading-tight">Encryption & <br /> Authorization</h3>
                            <p className="text-text-secondary text-sm font-medium leading-relaxed">
                                All user credentials undergo salt-rotation hashing. Authentication tokens are transient and expire after 24h of inactivity.
                            </p>
                        </div>
                        <div className="p-10 bg-white shadow-xl rounded-[3rem] border border-light-border space-y-6">
                            <Database className="text-amber-500" size={24} />
                            <h3 className="text-xl font-black uppercase italic text-text-primary leading-tight">Intelligence <br /> Retention</h3>
                            <p className="text-text-secondary text-sm font-medium leading-relaxed">
                                Match data remains in the permanent ledger for ranking integrity. Personal identifiers are accessible only to authorized league administrators.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-12 mb-20 bg-light-surface p-10 rounded-[3rem] border border-light-border">
                        {[
                            { title: 'Information Acquisition', icon: <UserCheck size={18} className="text-padel-green" />, text: 'We acquire only mission-critical data: Full Name, Active Email, and Communication Frequency (Phone). This is purely for league coordination and ranking verification.' },
                            { title: 'Zero Third-Party Propagation', icon: <Fingerprint size={18} className="text-padel-green" />, text: 'Padel Vault does not share or sell intelligence to external entities. Your data exists purely within the ecosystem of our partnered clubs.' },
                            { title: 'User Rights & Deletion', icon: <EyeOff size={18} className="text-padel-green" />, text: 'Units may request profile extraction or permanent deletion via the Support Uplink. Note: Match history remains anonymized to preserve league leaderboard integrity.' }
                        ].map((section, i) => (
                            <section key={i} className="space-y-4">
                                <h3 className="flex items-center gap-3 text-text-primary font-black uppercase italic text-sm tracking-widest">
                                    {section.icon}
                                    {section.title}
                                </h3>
                                <p className="text-text-secondary text-sm font-medium leading-relaxed max-w-2xl px-8 border-l border-light-border">
                                    {section.text}
                                </p>
                            </section>
                        ))}
                    </div>

                    <div className="pt-16 border-t border-light-border flex justify-between items-center text-text-tertiary">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em]">Vault Security Group © 2026</p>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em]">Last Update: FEB.11.26</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Privacy;
