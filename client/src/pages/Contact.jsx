import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BackButton from '../components/BackButton';
import { MessageSquare, Mail, Phone, MapPin, ArrowLeft, Send, Globe, Zap, Clock } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import toast from 'react-hot-toast';

const Contact = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', message: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        toast.success('Transmission Received. Secure uplink established.', {
            style: {
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #84cc16'
            }
        });
        setForm({ name: '', email: '', message: '' });
    };

    return (
        <div className="bg-light-bg min-h-screen relative overflow-hidden font-sans">
            <BackButton className="absolute top-6 left-6 z-20" />
            {/* Background Decor */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-padel-green/5 blur-[120px] rounded-full" />

            <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
                        <div>
                            <span className="text-padel-green text-xs font-black uppercase tracking-[0.4em] mb-4 block">Communication Protocol</span>
                            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase text-text-primary mb-8 leading-none">
                                Support <br /> <span className="text-padel-green">Uplink.</span>
                            </h1>
                            <p className="text-text-secondary font-medium text-lg mb-12 max-w-md italic border-l-2 border-light-border pl-6">
                                Professional league coordination for premier padel clubs. Dispatch your inquiries via our secure channel.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                                <div className="p-8 bg-white rounded-3xl border border-light-border shadow-md">
                                    <div className="p-3 bg-padel-green/10 rounded-xl w-fit mb-4">
                                        <Mail className="text-padel-green" size={20} />
                                    </div>
                                    <div className="text-[10px] font-black uppercase text-text-tertiary tracking-widest mb-1">Digital Mail</div>
                                    <div className="text-sm font-black italic text-text-primary">ops@padelvault.pro</div>
                                </div>
                                <div className="p-8 bg-white rounded-3xl border border-light-border shadow-md">
                                    <div className="p-3 bg-sky-500/10 rounded-xl w-fit mb-4">
                                        <Phone className="text-sky-500" size={20} />
                                    </div>
                                    <div className="text-[10px] font-black uppercase text-text-tertiary tracking-widest mb-1">Co-ordination</div>
                                    <div className="text-sm font-black italic text-text-primary">+92 300 1234567</div>
                                </div>
                            </div>

                            <div className="bg-light-surface p-8 rounded-[2.5rem] border border-light-border space-y-6 mb-12">
                                <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary mb-6 flex items-center gap-2">
                                    <Globe size={14} className="text-padel-green" /> Operations Hubs
                                </h3>
                                <div className="flex items-start gap-4">
                                    <MapPin size={18} className="text-padel-green shrink-0 mt-1" />
                                    <div>
                                        <div className="text-sm font-black uppercase text-text-primary">Lahore Central</div>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Lahore Padel Centre, Gulberg III</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <MapPin size={18} className="text-sky-500 shrink-0 mt-1" />
                                    <div>
                                        <div className="text-sm font-black uppercase text-text-primary">Islamabad North</div>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">Smash Oasis, F-6 Sector</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-[4rem] overflow-hidden border border-light-border aspect-video relative group shadow-2xl">
                                <img
                                    src="/assets/contact.png"
                                    alt="Lounge"
                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                                    onError={(e) => {
                                        e.target.src = 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=2070&auto=format&fit=crop';
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent opacity-60" />
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-3xl p-10 md:p-14 rounded-[4rem] border border-light-border shadow-2xl sticky top-32">
                            <div className="flex items-center justify-between mb-10">
                                <h2 className="text-2xl font-black uppercase italic flex items-center gap-3 text-text-primary">
                                    <MessageSquare size={24} className="text-padel-green animate-pulse" /> Dispatch
                                </h2>
                                <div className="px-3 py-1 bg-padel-green/10 rounded-full text-[10px] font-black uppercase text-padel-green tracking-[0.2em] border border-padel-green/20">
                                    Encrypted
                                </div>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <Input
                                    label="Unit Callsign / Name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                    className="bg-light-surface border-light-border h-14"
                                />
                                <Input
                                    label="Communication Frequency (Email)"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    required
                                    className="bg-light-surface border-light-border h-14"
                                />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-text-tertiary tracking-widest ml-1"> Intelligence Report (Message)</label>
                                    <textarea
                                        className="w-full bg-light-surface border border-light-border rounded-2xl px-6 py-6 text-text-primary focus:border-padel-green focus:ring-4 focus:ring-padel-green/5 transition-all outline-none min-h-[180px] resize-none text-sm font-medium"
                                        placeholder="Briefing details..."
                                        value={form.message}
                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex items-center gap-4 p-4 bg-light-surface rounded-2xl border border-light-border text-text-tertiary">
                                    <Clock size={16} />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Average Response Window: 2.5h (Tactical Hours)</p>
                                </div>
                                <Button type="submit" className="w-full py-6 rounded-3xl font-black uppercase flex items-center justify-center gap-4 shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-lg">
                                    <Send size={20} /> Initiate Uplink
                                </Button>
                            </form>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Contact;
