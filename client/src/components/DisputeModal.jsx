import React, { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import Button from './Button';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const DisputeModal = ({ match, onClose, onSuccess }) => {
    const [reason, setReason] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error('Please provide a reason for the dispute');
            return;
        }

        setIsLoading(true);
        try {
            await api.post(`/matches/${match._id}/dispute`, { reason });
            toast.success('Dispute submitted. Admin will review.');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit dispute');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <>
                <div
                    className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-light-border"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-text-primary">Dispute Match Result</h3>
                                <p className="text-sm text-text-secondary mt-1">
                                    Explain why you disagree with the result
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-text-tertiary" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-text-secondary block mb-2">
                                Reason for Dispute
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-2.5 bg-white border border-light-border rounded-xl text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all resize-none"
                                placeholder="Describe the issue with the submitted result..."
                            />
                            <p className="text-xs text-text-tertiary mt-1">
                                Be specific. Admin will review and make a final decision.
                            </p>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                            <p className="text-xs text-amber-800">
                                <strong>Note:</strong> Frivolous disputes may result in penalties. Only dispute if there's a genuine error.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="secondary"
                                onClick={onClose}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleSubmit}
                                isLoading={isLoading}
                                className="flex-1"
                            >
                                Submit Dispute
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </>
        </AnimatePresence>
    );
};

export default DisputeModal;
