"use client";

import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import {
  Flame,
  Trophy,
  Star,
  Zap,
  Target,
  Crown,
  Award,
  Sparkles,
  PartyPopper,
  X,
} from "lucide-react";

// Achievement Types
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: "flame" | "trophy" | "star" | "zap" | "target" | "crown" | "award";
  color: string;
  unlockedAt?: string;
}

// Celebration Types
export type CelebrationType =
  | "streak"
  | "achievement"
  | "milestone"
  | "goal_complete"
  | "habit_perfect"
  | "task_batch";

interface CelebrationEvent {
  id: string;
  type: CelebrationType;
  title: string;
  subtitle?: string;
  value?: number;
  icon?: string;
}

// Context for celebrations
interface CelebrationContextType {
  celebrate: (event: CelebrationEvent) => void;
  triggerConfetti: (
    type?: "default" | "streak" | "achievement" | "epic",
  ) => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export function useCelebration() {
  const ctx = useContext(CelebrationContext);
  if (!ctx) {
    throw new Error("useCelebration must be used within CelebrationProvider");
  }
  return ctx;
}

// Icon mapping
const ICONS: Record<string, React.ElementType> = {
  flame: Flame,
  trophy: Trophy,
  star: Star,
  zap: Zap,
  target: Target,
  crown: Crown,
  award: Award,
  sparkles: Sparkles,
  party: PartyPopper,
};

// Confetti configurations
const confettiDefaults = {
  spread: 360,
  ticks: 100,
  gravity: 0.8,
  decay: 0.94,
  startVelocity: 30,
  colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#A855F7", "#3B82F6"],
};

// Streak Celebration Toast
function StreakToast({
  event,
  onClose,
}: {
  event: CelebrationEvent;
  onClose: () => void;
}) {
  const Icon = event.icon ? ICONS[event.icon] || Flame : Flame;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="fixed bottom-4 right-4 z-50 max-w-sm"
    >
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-1 shadow-2xl">
        <div className="rounded-lg bg-gray-900/95 backdrop-blur-sm p-4">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>

          <div className="flex items-center gap-4">
            {/* Animated Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-red-600 flex items-center justify-center">
                <Icon className="w-7 h-7 text-white" />
              </div>
              {/* Pulse ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-orange-400"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </motion.div>

            {/* Content */}
            <div className="flex-1">
              <motion.h3
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="font-bold text-white text-lg"
              >
                {event.title}
              </motion.h3>
              {event.subtitle && (
                <motion.p
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-gray-300 text-sm"
                >
                  {event.subtitle}
                </motion.p>
              )}
              {event.value && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-sm font-bold"
                >
                  <Flame className="w-3 h-3" />
                  {event.value} days
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Achievement Unlock Modal
function AchievementModal({
  event,
  onClose,
}: {
  event: CelebrationEvent;
  onClose: () => void;
}) {
  const Icon = event.icon ? ICONS[event.icon] || Trophy : Trophy;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-2xl blur-xl opacity-50" />

        {/* Content */}
        <div className="relative overflow-hidden rounded-2xl bg-gray-900 border border-purple-500/30 p-6 text-center">
          {/* Background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                initial={{
                  x: "50%",
                  y: "50%",
                  opacity: 0,
                }}
                animate={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-800 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {/* Achievement icon */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="relative mx-auto mb-4"
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-1">
              <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                <Icon className="w-12 h-12 text-yellow-400" />
              </div>
            </div>
            {/* Sparkle effects */}
            <motion.div
              className="absolute -top-2 -right-2"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-purple-400 text-sm font-semibold mb-1">
              🎉 Achievement Unlocked!
            </p>
            <h2 className="text-2xl font-bold text-white mb-2">
              {event.title}
            </h2>
            {event.subtitle && (
              <p className="text-gray-400 text-sm">{event.subtitle}</p>
            )}
          </motion.div>

          {/* Action button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={onClose}
            className="mt-6 px-6 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Awesome!
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Milestone Celebration
function MilestoneToast({
  event,
  onClose,
}: {
  event: CelebrationEvent;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed top-20 right-4 z-50 max-w-sm"
    >
      <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 p-1 shadow-2xl">
        <div className="rounded-lg bg-gray-900/95 backdrop-blur-sm p-4">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>

          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center"
            >
              <Target className="w-6 h-6 text-emerald-400" />
            </motion.div>

            <div>
              <h3 className="font-bold text-white">{event.title}</h3>
              {event.subtitle && (
                <p className="text-gray-400 text-sm">{event.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Celebration Provider Component
export function CelebrationProvider({ children }: { children: ReactNode }) {
  const [activeEvent, setActiveEvent] = useState<CelebrationEvent | null>(null);
  const [eventType, setEventType] = useState<CelebrationType | null>(null);

  const triggerConfetti = useCallback(
    (type: "default" | "streak" | "achievement" | "epic" = "default") => {
      const count = type === "epic" ? 400 : type === "achievement" ? 200 : 100;
      const spread = type === "epic" ? 180 : type === "achievement" ? 120 : 80;

      // Fire confetti from multiple positions
      const fireConfetti = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...confettiDefaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
          spread,
        });
      };

      if (type === "epic") {
        // Epic celebration - confetti from all directions
        fireConfetti(0.25, { origin: { x: 0.2, y: 0.6 } });
        fireConfetti(0.25, { origin: { x: 0.8, y: 0.6 } });
        fireConfetti(0.25, { origin: { x: 0.5, y: 0.3 } });
        fireConfetti(0.25, { origin: { x: 0.5, y: 0.9 } });

        // Additional burst after delay
        setTimeout(() => {
          confetti({
            ...confettiDefaults,
            particleCount: 150,
            spread: 360,
            origin: { x: 0.5, y: 0.5 },
            startVelocity: 45,
          });
        }, 300);
      } else if (type === "streak") {
        // Streak celebration - fire emoji style
        fireConfetti(0.5, { origin: { x: 0.3, y: 0.7 } });
        fireConfetti(0.5, { origin: { x: 0.7, y: 0.7 } });
      } else if (type === "achievement") {
        // Achievement celebration - center burst
        fireConfetti(1, { origin: { x: 0.5, y: 0.6 } });
      } else {
        // Default celebration
        fireConfetti(1, { origin: { x: 0.5, y: 0.7 } });
      }
    },
    [],
  );

  const celebrate = useCallback(
    (event: CelebrationEvent) => {
      setActiveEvent(event);
      setEventType(event.type);

      // Trigger appropriate confetti
      switch (event.type) {
        case "streak":
          if (event.value && event.value >= 30) {
            triggerConfetti("epic");
          } else if (event.value && event.value >= 7) {
            triggerConfetti("streak");
          } else {
            triggerConfetti("default");
          }
          break;
        case "achievement":
        case "goal_complete":
          triggerConfetti("achievement");
          break;
        case "milestone":
          triggerConfetti("default");
          break;
        case "habit_perfect":
          triggerConfetti("streak");
          break;
        default:
          triggerConfetti("default");
      }

      // Auto-dismiss after delay for toasts
      if (event.type !== "achievement") {
        setTimeout(() => {
          setActiveEvent(null);
          setEventType(null);
        }, 5000);
      }
    },
    [triggerConfetti],
  );

  const handleClose = useCallback(() => {
    setActiveEvent(null);
    setEventType(null);
  }, []);

  return (
    <CelebrationContext.Provider value={{ celebrate, triggerConfetti }}>
      {children}

      <AnimatePresence>
        {activeEvent && eventType === "streak" && (
          <StreakToast event={activeEvent} onClose={handleClose} />
        )}
        {activeEvent && eventType === "achievement" && (
          <AchievementModal event={activeEvent} onClose={handleClose} />
        )}
        {activeEvent &&
          (eventType === "milestone" || eventType === "goal_complete") && (
            <MilestoneToast event={activeEvent} onClose={handleClose} />
          )}
        {activeEvent && eventType === "habit_perfect" && (
          <StreakToast event={activeEvent} onClose={handleClose} />
        )}
      </AnimatePresence>
    </CelebrationContext.Provider>
  );
}

// Streak Counter Component for displaying in UI
export function StreakCounter({
  streak,
  label,
  size = "default",
  showFire = true,
  className,
}: {
  streak: number;
  label?: string;
  size?: "sm" | "default" | "lg";
  showFire?: boolean;
  className?: string;
}) {
  const sizeClasses = {
    sm: "text-lg",
    default: "text-2xl",
    lg: "text-4xl",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    default: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showFire && (
        <motion.div
          initial={{ scale: 1 }}
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut",
          }}
        >
          <Flame
            className={cn(
              iconSizes[size],
              streak > 0 ? "text-orange-500" : "text-gray-400",
            )}
          />
        </motion.div>
      )}
      <div className="flex flex-col">
        <span
          className={cn(
            "font-bold",
            sizeClasses[size],
            streak > 0 ? "text-orange-500" : "text-gray-400",
          )}
        >
          {streak}
        </span>
        {label && (
          <span className="text-xs text-muted-foreground">{label}</span>
        )}
      </div>
    </div>
  );
}

// Achievement Badge Component
export function AchievementBadge({
  achievement,
  unlocked = false,
  onClick,
}: {
  achievement: Achievement;
  unlocked?: boolean;
  onClick?: () => void;
}) {
  const Icon = ICONS[achievement.icon] || Trophy;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl cursor-pointer transition-all",
        unlocked
          ? "bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30"
          : "bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 opacity-50 grayscale",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            unlocked ? achievement.color : "bg-gray-300 dark:bg-gray-700",
          )}
        >
          <Icon
            className={cn("w-6 h-6", unlocked ? "text-white" : "text-gray-500")}
          />
        </div>
        <div>
          <h4 className="font-semibold text-sm">{achievement.title}</h4>
          <p className="text-xs text-muted-foreground">
            {achievement.description}
          </p>
        </div>
      </div>

      {/* Locked overlay */}
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-900/10 dark:bg-gray-900/30">
          <span className="text-2xl">🔒</span>
        </div>
      )}
    </motion.div>
  );
}

// Default achievements
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-task",
    title: "Getting Started",
    description: "Complete your first task",
    icon: "star",
    color: "bg-blue-500",
  },
  {
    id: "streak-7",
    title: "Week Warrior",
    description: "Maintain a 7-day streak",
    icon: "flame",
    color: "bg-orange-500",
  },
  {
    id: "streak-30",
    title: "Monthly Master",
    description: "Maintain a 30-day streak",
    icon: "flame",
    color: "bg-red-500",
  },
  {
    id: "streak-100",
    title: "Century Club",
    description: "Maintain a 100-day streak",
    icon: "crown",
    color: "bg-yellow-500",
  },
  {
    id: "habit-perfect",
    title: "Perfect Week",
    description: "Complete all habits for 7 days straight",
    icon: "trophy",
    color: "bg-emerald-500",
  },
  {
    id: "goal-complete",
    title: "Goal Getter",
    description: "Complete your first goal",
    icon: "target",
    color: "bg-purple-500",
  },
  {
    id: "task-10",
    title: "Task Tackler",
    description: "Complete 10 tasks",
    icon: "zap",
    color: "bg-blue-500",
  },
  {
    id: "task-100",
    title: "Productivity Pro",
    description: "Complete 100 tasks",
    icon: "award",
    color: "bg-indigo-500",
  },
  {
    id: "early-bird",
    title: "Early Bird",
    description: "Log time before 7 AM",
    icon: "star",
    color: "bg-amber-500",
  },
  {
    id: "night-owl",
    title: "Night Owl",
    description: "Log time after 10 PM",
    icon: "star",
    color: "bg-violet-500",
  },
];
