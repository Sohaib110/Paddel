import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Menu, X, Shield, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'About', path: '/about' },
        { name: 'Contact', path: '/contact' },
    ];

    const isPublic = ['/', '/about', '/contact', '/privacy'].includes(location.pathname);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-300 ${isScrolled || mobileMenuOpen
            ? 'bg-white shadow-md border-b border-light-border py-2'
            : 'bg-white border-b border-light-border py-3'
            }`}>
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <img
                        src="/assets/logo.jpg"
                        alt="Find My Padel"
                        className="h-12 w-auto object-contain mix-blend-multiply transition-transform group-hover:scale-105"
                    />
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`text-sm font-bold uppercase tracking-widest transition-colors ${location.pathname === link.path
                                ? 'text-padel-blue'
                                : 'text-text-secondary hover:text-padel-blue'
                                }`}
                        >
                            {link.name}
                        </Link>
                    ))}

                    <div className="h-6 w-[1px] bg-light-border mx-2" />

                    {user ? (
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4">
                                <NotificationBell />
                                {user.role === 'ADMIN' && (
                                    <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                                        Admin
                                    </Button>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-text-primary hidden lg:block">
                                    {user.full_name.split(' ')[0]}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" onClick={() => navigate('/dashboard')}>
                                        Dashboard
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={() => { logout(); navigate('/login'); }}>
                                        Logout
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                                Sign In
                            </Button>
                            <Button size="sm" onClick={() => navigate('/register')}>
                                Join League
                            </Button>
                        </div>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden p-2 text-text-primary hover:bg-light-surface rounded-xl transition-colors"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-b border-light-border overflow-hidden"
                    >
                        <div className="px-6 py-8 flex flex-col gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`text-lg font-black uppercase tracking-tighter italic ${location.pathname === link.path
                                        ? 'text-padel-blue'
                                        : 'text-text-primary'
                                        }`}
                                >
                                    {link.name}
                                </Link>
                            ))}
                            <div className="h-[1px] bg-light-border w-full" />
                            {user ? (
                                <div className="flex flex-col gap-3">
                                    {user.role === 'ADMIN' && (
                                        <Button onClick={() => navigate('/admin')} className="w-full">
                                            Admin
                                        </Button>
                                    )}
                                    <Button onClick={() => navigate('/dashboard')} className="w-full">
                                        Dashboard
                                    </Button>
                                    <Button variant="secondary" onClick={() => { logout(); navigate('/login'); }} className="w-full">
                                        Logout
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={() => navigate('/login')} className="w-full">
                                        Sign In
                                    </Button>
                                    <Button onClick={() => navigate('/register')} className="w-full">
                                        Join League
                                    </Button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
