import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import { motion } from 'framer-motion';
import BackButton from '../components/BackButton';
import { Activity, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            toast.error('Access Denied: Invalid Credentials');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-light-bg via-light-surface to-blue-50 flex items-center justify-center p-6 relative overflow-hidden">
            <BackButton className="absolute top-6 left-6 z-20" />
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-padel-green/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-400/10 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white p-10 rounded-3xl border border-light-border shadow-2xl shadow-slate-200/50 relative z-10"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-16 h-16 bg-gradient-to-br from-padel-green to-lime-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-padel-green/30"
                    >
                        <Activity className="text-white w-8 h-8" />
                    </motion.div>
                    <h2 className="text-4xl font-black italic tracking-tighter text-text-primary uppercase mb-2">
                        Padel<span className="text-padel-green">Vault</span>
                    </h2>
                    <p className="text-text-tertiary font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Dominate the Court
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                        label="Email Address"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="captain@paddel.com"
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                    />
                    <Button type="submit" size="lg" className="w-full">
                        Enter Vault
                    </Button>
                </form>

                <p className="mt-8 text-center text-text-secondary text-sm font-medium">
                    New to the league? {' '}
                    <button onClick={() => navigate('/register')} className="text-padel-green font-bold hover:underline">
                        Create Account
                    </button>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
