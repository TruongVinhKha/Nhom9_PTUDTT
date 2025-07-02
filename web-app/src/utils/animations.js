// Unified Animation Variants for Framer Motion
// Sử dụng cho tất cả các trang và component

// ===== UNIFIED MOTION EFFECT =====
export const unifiedMotionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

// ===== UNIFIED ENTRANCE ANIMATION =====
export const unifiedEntranceVariants = {
  hidden: { 
    opacity: 0, 
    y: 30, 
    scale: 0.95 
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

// ===== CONTAINER VARIANTS =====
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      staggerChildren: 0.15,
      ease: "easeOut"
    }
  }
};

// ===== ITEM VARIANTS =====
export const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

// ===== BUTTON VARIANTS =====
export const buttonVariants = {
  hover: {
    scale: 1.05,
    y: -3,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  }
};

// ===== FORM VARIANTS =====
export const formItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

// ===== CARD VARIANTS =====
export const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  },
  hover: {
    y: -8,
    scale: 1.02,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

// ===== MODAL VARIANTS =====
export const modalVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.8,
    y: 20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 20,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

// ===== NOTIFICATION VARIANTS =====
export const notificationVariants = {
  hidden: { 
    opacity: 0, 
    x: -50,
    scale: 0.9
  },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    x: 50,
    scale: 0.9,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
};

// ===== LIST ITEM VARIANTS =====
export const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  hover: {
    x: 8,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  }
};

// ===== PAGE TRANSITION VARIANTS =====
export const pageVariants = {
  initial: {
    opacity: 0,
    x: -20
  },
  in: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  },
  out: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.4,
      ease: "easeIn"
    }
  }
};

// ===== LOADING SPINNER VARIANTS =====
export const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

// ===== FLOAT ANIMATION VARIANTS =====
export const floatVariants = {
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// ===== STAGGER CHILDREN CONFIG =====
export const staggerConfig = {
  staggerChildren: 0.1,
  delayChildren: 0.1
};

// ===== COMMON TRANSITION CONFIGS =====
export const transitions = {
  smooth: {
    duration: 0.3,
    ease: "easeOut"
  },
  fast: {
    duration: 0.15,
    ease: "easeOut"
  },
  slow: {
    duration: 0.6,
    ease: "easeOut"
  }
}; 