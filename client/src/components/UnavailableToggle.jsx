import React, { useState } from 'react';
import ReactDOM from "react-dom";
import { Calendar, X } from "lucide-react";
import Button from "./Button";
import api from "../api/axios";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const UnavailableToggle = ({ team, onUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [returnDate, setReturnDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (team.status === "IN_MATCH") {
      toast.error("Cannot change availability during active match");
      return;
    }

    if (team.status === "UNAVAILABLE") {
      // Going back to available
      setIsLoading(true);
      try {
        const { data } = await api.post("/teams/toggle-unavailable");
        toast.success(data.message);
        onUpdate();
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to update status");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Going to unavailable - show date picker
      setIsOpen(true);
    }
  };

  const handleSetUnavailable = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.post("/teams/toggle-unavailable", {
        unavailable_return_date: returnDate || undefined,
      });
      toast.success(data.message);
      setIsOpen(false);
      setReturnDate("");
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant={team.status === "UNAVAILABLE" ? "primary" : "secondary"}
        size="sm"
        onClick={handleToggle}
        isLoading={isLoading}
        disabled={team.status === "IN_MATCH"}
        className="w-full sm:w-auto"
      >
        <Calendar className="w-3.5 h-3.5 mr-2" />
        {team.status === "UNAVAILABLE" ? "Set Active" : "Go Stealth"}
      </Button>

      {ReactDOM.createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/60 z-40 backdrop-blur-md"
                onClick={() => setIsOpen(false)}
              />
              <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="pointer-events-auto bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-sm border border-light-border mx-4"
                >
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-light-surface rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-padel-green" />
                    </div>
                    <h3 className="text-2xl font-black italic tracking-tighter text-text-primary uppercase">
                      Going Stealth
                    </h3>
                    <p className="text-xs text-text-tertiary font-medium mt-2">
                      When will you re-engage with the league?
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-text-tertiary block mb-2">
                        Return to Duty (Optional)
                      </label>
                      <input
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-5 py-3.5 bg-light-surface border-2 border-transparent rounded-xl text-text-primary font-bold focus:outline-none focus:border-padel-green transition-all"
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button
                        variant="secondary"
                        onClick={() => setIsOpen(false)}
                        className="flex-1"
                        size="md"
                      >
                        Abort
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleSetUnavailable}
                        isLoading={isLoading}
                        className="flex-1"
                        size="md"
                      >
                        Confirm
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
};

export default UnavailableToggle;
