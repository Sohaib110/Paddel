import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Button from '../components/Button';
import Input from '../components/Input';
import { CheckCircle, XCircle, Activity, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import BackButton from '../components/BackButton';
import toast from 'react-hot-toast';

const AcceptInvite = () => {
    const [searchParams] = useSearchParams();
    const urlToken = searchParams.get('token');
    const navigate = useNavigate();
    const [token, setToken] = useState(urlToken || '');
    const [status, setStatus] = useState(urlToken ? 'READY' : 'MANUAL_ENTRY'); // VERIFYING, READY, MANUAL_ENTRY, PROCESSING, SUCCESS, ERROR
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (urlToken) {
            setToken(urlToken);
            setStatus('READY');
        } else {
            setStatus('MANUAL_ENTRY');
        }
    }, [urlToken]);

    const handleAccept = async (manualToken) => {
      let tokenToUse = manualToken || token;
      if (!tokenToUse || typeof tokenToUse !== "string") {
        toast.error("Token is required");
        return;
      }

      // If user pasted a full URL (e.g. http://localhost:5173/accept-invite?token=abc123),
      // extract just the token parameter from it
      tokenToUse = tokenToUse.trim();
      if (tokenToUse.includes("token=")) {
        try {
          const urlObj = new URL(tokenToUse);
          const extracted = urlObj.searchParams.get("token");
          if (extracted) tokenToUse = extracted;
        } catch {
          // Not a valid URL — try a simple regex extraction
          const match = tokenToUse.match(/[?&]token=([a-fA-F0-9]+)/);
          if (match) tokenToUse = match[1];
        }
      }

      // Normalize token to lowercase
      tokenToUse = tokenToUse.toLowerCase();

      setStatus("PROCESSING");
      setLoading(true);
      try {
        const { data } = await api.post("/teams/accept-invite", {
          token: tokenToUse,
        });
        setStatus("SUCCESS");
        setMessage(`You are now part of ${data.team.name}!`);
        setTimeout(() => navigate("/dashboard"), 2500);
      } catch (err) {
        setStatus("ERROR");
        const errorMessage =
          err.response?.data?.message || "Failed to process invitation.";
        const errorDetail = err.response?.data?.error
          ? ` (${err.response.data.error})`
          : "";
        setMessage(`${errorMessage}${errorDetail}`);
      } finally {
        setLoading(false);
      }
    };;

    return (
        <div className="min-h-screen bg-light-bg flex items-center justify-center p-6 relative overflow-hidden font-sans">
            <BackButton className="absolute top-6 left-6 z-20" />
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-padel-green/10 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-sky-400/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white p-10 rounded-[3rem] border border-light-border shadow-2xl relative z-10 text-center"
            >
                {status === 'MANUAL_ENTRY' && (
                    <>
                        <div className="w-20 h-20 bg-light-surface rounded-3xl flex items-center justify-center mx-auto mb-8">
                            <Star className="text-padel-green w-10 h-10" />
                        </div>
                        <h2 className="text-4xl font-black italic tracking-tighter text-text-primary uppercase mb-4 leading-none">
                            Enter <br /> <span className="text-padel-green">Vault.</span>
                        </h2>
                        <p className="text-text-secondary mb-8 font-medium leading-relaxed italic">
                            "Paste your recruitment token below to re-engage with your squad."
                        </p>
                        <div className="space-y-4">
                            <Input
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="HEX-TOKEN-ID"
                                className="text-center font-mono uppercase tracking-[0.2em]"
                            />
                            <Button onClick={() => handleAccept()} size="xl" className="w-full">
                                Establish Link
                            </Button>
                        </div>
                    </>
                )}

                {status === 'READY' && (
                    <>
                        <div className="w-20 h-20 bg-padel-green rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-padel-green/20">
                            <Star className="text-white w-10 h-10" fill="currentColor" />
                        </div>
                        <h2 className="text-4xl font-black italic tracking-tighter text-text-primary uppercase mb-4 leading-none">
                            Join the <br /> <span className="text-padel-green">Squad.</span>
                        </h2>
                        <p className="text-text-secondary mb-10 font-medium leading-relaxed italic border-l-4 border-light-border pl-4 text-left">
                            "Excellence is not an act, but a habit. Your team is waiting for you in the Vault."
                        </p>
                        <Button onClick={() => handleAccept()} size="xl" className="w-full">
                            Accept Challenge
                        </Button>
                    </>
                )}

                {status === 'PROCESSING' && (
                    <div className="py-16 flex flex-col items-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-16 h-16 border-[6px] border-padel-green border-t-transparent rounded-full mb-8"
                        />
                        <p className="text-text-primary font-black uppercase tracking-[0.2em] text-[10px]">Syncing with Vault Core...</p>
                    </div>
                )}

                {status === 'SUCCESS' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20"
                        >
                            <CheckCircle className="text-white w-10 h-10" />
                        </motion.div>
                        <h2 className="text-3xl font-black italic tracking-tighter text-text-primary uppercase mb-4 leading-none">
                            Welcome <br /> <span className="text-padel-green">Aboard.</span>
                        </h2>
                        <p className="text-text-secondary font-medium mb-6 italic">{message}</p>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-light-surface rounded-full text-[10px] font-black uppercase tracking-widest text-text-tertiary">
                            Redirecting to Base Hub...
                        </div>
                    </>
                )}

                {status === 'ERROR' && (
                    <>
                        <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-200">
                            <XCircle className="text-red-500 w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-black italic tracking-tighter text-text-primary uppercase mb-4 leading-none">
                            Invite <br /> <span className="text-red-500">Failed.</span>
                        </h2>
                        <p className="text-text-secondary mb-10 font-medium">{message}</p>
                        <Button variant="secondary" onClick={() => navigate('/dashboard')} size="lg" className="w-full">
                            Return to Base
                        </Button>
                    </>
                )}
            </motion.div>
            <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-text-tertiary text-[10px] font-black uppercase tracking-[0.4em]">
                Padel Vault Security Protocol // Encrypted Link
            </p>
        </div>
    );
};

export default AcceptInvite;
