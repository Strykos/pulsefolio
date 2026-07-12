export const spring = { type: "spring" as const, stiffness: 300, damping: 30 };
export const springBouncy = { type: "spring" as const, stiffness: 400, damping: 25 };

export const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06 },
  },
};

export const cardReveal = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
};
