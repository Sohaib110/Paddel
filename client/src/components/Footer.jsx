import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Instagram, Twitter, Mail, MapPin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-white border-t border-light-border pt-16 pb-8 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                {/* Branding */}
                <div className="col-span-1 md:col-span-1">
                    <Link to="/" className="flex items-center gap-2 mb-6 group">
                        <div className="p-2 bg-gradient-to-br from-padel-green to-lime-600 rounded-lg shadow-lg shadow-padel-green/20 group-hover:scale-110 transition-transform">
                            <Activity className="text-white w-5 h-5" />
                        </div>
                        <span className="text-xl font-black italic tracking-tighter text-text-primary uppercase">
                            Padel<span className="text-padel-green">Vault</span>
                        </span>
                    </Link>
                    <p className="text-text-secondary text-sm font-medium leading-relaxed mb-6">
                        The elite standard in Padel league management. Performance tracking, automated matchmaking, and national rankings.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 bg-light-surface rounded-xl flex items-center justify-center text-text-secondary hover:text-padel-green transition-all hover:scale-110">
                            <Instagram size={18} />
                        </a>
                        <a href="#" className="w-10 h-10 bg-light-surface rounded-xl flex items-center justify-center text-text-secondary hover:text-padel-green transition-all hover:scale-110">
                            <Twitter size={18} />
                        </a>
                        <a href="#" className="w-10 h-10 bg-light-surface rounded-xl flex items-center justify-center text-text-secondary hover:text-padel-green transition-all hover:scale-110">
                            <Mail size={18} />
                        </a>
                    </div>
                </div>

                {/* Operations */}
                <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-text-primary mb-6">Operations</h4>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3 text-sm text-text-secondary">
                            <MapPin size={16} className="text-padel-green shrink-0 mt-0.5" />
                            <span>Lahore Central <br /> Gulberg III Hub</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-text-secondary">
                            <MapPin size={16} className="text-sky-500 shrink-0 mt-0.5" />
                            <span>Islamabad North <br /> F-6 Sector Hub</span>
                        </li>
                    </ul>
                </div>

                {/* Navigation */}
                <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-text-primary mb-6">Quick Access</h4>
                    <ul className="space-y-4">
                        <li><Link to="/about" className="text-sm text-text-secondary hover:text-padel-green font-semibold transition-colors">About Mission</Link></li>
                        <li><Link to="/contact" className="text-sm text-text-secondary hover:text-padel-green font-semibold transition-colors">Support Uplink</Link></li>
                        <li><Link to="/login" className="text-sm text-text-secondary hover:text-padel-green font-semibold transition-colors">Unit Login</Link></li>
                        <li><Link to="/register" className="text-sm text-text-secondary hover:text-padel-green font-semibold transition-colors">Join League</Link></li>
                    </ul>
                </div>

                {/* Legal */}
                <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-text-primary mb-6">Intelligence</h4>
                    <ul className="space-y-4">
                        <li><Link to="/privacy" className="text-sm text-text-secondary hover:text-padel-green font-semibold transition-colors">Privacy Protocol</Link></li>
                        <li><span className="text-sm text-text-secondary font-semibold cursor-not-allowed opacity-50">League Rules</span></li>
                        <li><span className="text-sm text-text-secondary font-semibold cursor-not-allowed opacity-50">Terms of Engagement</span></li>
                    </ul>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="max-w-7xl mx-auto pt-8 border-t border-light-border flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-tertiary">
                    © 2026 Padel Vault Elite. All rights protected.
                </p>
                <div className="flex items-center gap-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-padel-green">System Status: Operational</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-tertiary">V2.6.4-Stable</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
