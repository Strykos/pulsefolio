"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

interface TradeCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
}

const COLORS = ["var(--color-gain)", "var(--color-accent)", "#8B5CF6", "#F59E0B"];

export function TradeCelebration({ trigger, onComplete }: TradeCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    const newParticles: Particle[] = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 300,
      color: COLORS[i % COLORS.length],
      size: Math.random() * 6 + 3,
    }));

    setParticles(newParticles);
    setShow(true);

    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 1200);

    return () => clearTimeout(timer);
  }, [trigger, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 8px ${p.color}`,
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          ))}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.2, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 0.8 }}
            className="text-2xl font-bold text-gain"
            style={{ textShadow: "0 0 20px var(--color-pulse-glow)" }}
          >
            Trade Executed!
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
