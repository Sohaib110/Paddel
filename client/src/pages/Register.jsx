import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Button from '../components/Button';
import Input from '../components/Input';
import { motion } from 'framer-motion';
import BackButton from '../components/BackButton';
import { Activity, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
    const [clubs, setClubs] = useState([]);
    const [formData, setFormData] = useState({
        full_name: '', email: '', phone_number: '', password: '',
        club_id: '', months_played: 0, gender: 'MALE',
        availability: 'EVENINGS', play_mixed: 'DOES_NOT_MATTER',
        mode_selection: 'COMPETITIVE'
    });
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchClubs = async () => {
            try {
                const { data } = await api.get('/clubs');
                setClubs(data);
            } catch (err) {
                console.error("Failed to fetch clubs", err);
            }
        };
        fetchClubs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', formData);
            await login(formData.email, formData.password);
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-light-bg via-light-surface to-emerald-50 flex items-center justify-center p-6 relative overflow-hidden">
            <BackButton className="absolute top-6 left-6 z-20" />
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-lime-400/10 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-3xl bg-white p-10 rounded-3xl border border-light-border shadow-2xl shadow-slate-200/50 relative z-10"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 bg-gradient-to-br from-padel-green to-lime-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-padel-green/30"
                    >
                        <UserPlus className="text-white w-8 h-8" />
                    </motion.div>
                    <h2 className="text-4xl font-black italic tracking-tighter text-text-primary uppercase mb-2">
                        Create<span className="text-padel-green">Profile</span>
                    </h2>
                    <p className="text-text-tertiary font-bold uppercase tracking-[0.2em] text-[10px]">
                        Join the elite padel circuit
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Input
                        label="Full Name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                    <Input
                        label="WhatsApp Number"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        placeholder="+34 600..."
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-text-secondary">Home Club</label>
                        <select
                            className="w-full bg-white border border-light-border rounded-xl px-4 py-3 text-text-primary focus:border-padel-green focus:ring-2 focus:ring-padel-green/20 transition-all outline-none"
                            value={formData.club_id}
                            onChange={(e) => setFormData({ ...formData, club_id: e.target.value })}
                            required
                        >
                            <option value="">Choose one</option>
                            {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-text-secondary">Gender</label>
                        <select
                            className="w-full bg-white border border-light-border rounded-xl px-4 py-3 text-text-primary focus:border-padel-green focus:ring-2 focus:ring-padel-green/20 transition-all outline-none"
                            value={formData.gender}
                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-text-secondary">Play Mixed?</label>
                        <select
                            className="w-full bg-white border border-light-border rounded-xl px-4 py-3 text-text-primary focus:border-padel-green focus:ring-2 focus:ring-padel-green/20 transition-all outline-none"
                            value={formData.play_mixed}
                            onChange={(e) => setFormData({ ...formData, play_mixed: e.target.value })}
                        >
                            <option value="YES">Yes</option>
                            <option value="NO">No</option>
                            <option value="DOES_NOT_MATTER">Doesn't Matter</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-text-secondary">Experience (Months)</label>
                        <Input
                            type="number"
                            value={formData.months_played}
                            onChange={(e) => setFormData({ ...formData, months_played: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-text-secondary">Availability</label>
                        <select
                            className="w-full bg-white border border-light-border rounded-xl px-4 py-3 text-text-primary focus:border-padel-green focus:ring-2 focus:ring-padel-green/20 transition-all outline-none"
                            value={formData.availability}
                            onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                        >
                            <option value="MORNINGS">Mornings</option>
                            <option value="EVENINGS">Evenings</option>
                            <option value="WEEKENDS">Weekends</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-text-secondary">Mode</label>
                        <select
                            className="w-full bg-white border border-light-border rounded-xl px-4 py-3 text-text-primary focus:border-padel-green focus:ring-2 focus:ring-padel-green/20 transition-all outline-none"
                            value={formData.mode_selection}
                            onChange={(e) => setFormData({ ...formData, mode_selection: e.target.value })}
                        >
                            <option value="COMPETITIVE">Competitive</option>
                            <option value="FRIENDLY">Friendly</option>
                        </select>
                    </div>

                    <div className="md:col-span-2 lg:col-span-3 pt-4">
                        <Button type="submit" size="lg" className="w-full">
                            Complete Onboarding
                        </Button>
                    </div>
                </form>

                <p className="mt-8 text-center text-text-secondary text-sm font-medium">
                    Already registered? {' '}
                    <button onClick={() => navigate('/login')} className="text-padel-green font-bold hover:underline">
                        Log In
                    </button>
                </p>
            </motion.div>
        </div>
    );
};

export default Register;
