"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   NEURAL BRAIN PRELOADER — Brand experience from second one
   ═══════════════════════════════════════════════════════════════ */

// Generate deterministic neural node positions in a brain-like shape
function generateNodes(count: number) {
    const nodes: { x: number; y: number; delay: number }[] = [];
    const cx = 100, cy = 100;

    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const layer = Math.floor(i / 8);
        const radius = 20 + layer * 16 + (Math.sin(i * 1.7) * 8);
        const x = cx + Math.cos(angle + layer * 0.3) * radius;
        const y = cy + Math.sin(angle + layer * 0.3) * radius * 0.85;
        nodes.push({ x, y, delay: i * 0.04 });
    }
    return nodes;
}

// Generate neural connection paths between nearby nodes
function generateConnections(nodes: { x: number; y: number }[]) {
    const connections: { x1: number; y1: number; x2: number; y2: number; delay: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[j].x - nodes[i].x;
            const dy = nodes[j].y - nodes[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 40 && connections.length < 60) {
                connections.push({
                    x1: nodes[i].x,
                    y1: nodes[i].y,
                    x2: nodes[j].x,
                    y2: nodes[j].y,
                    delay: (i + j) * 0.02,
                });
            }
        }
    }
    return connections;
}

const STATUS_MESSAGES = [
    "Initializing AI…",
    "Loading your workspace…",
    "Syncing data…",
    "Almost ready…",
];

interface PreloaderProps {
    onComplete: () => void;
}

export function Preloader({ onComplete }: PreloaderProps) {
    const [phase, setPhase] = useState(0); // 0=nodes, 1=connections, 2=logo, 3=exit
    const [msgIndex, setMsgIndex] = useState(0);

    const nodes = useMemo(() => generateNodes(32), []);
    const connections = useMemo(() => generateConnections(nodes), [nodes]);

    // Phase progression
    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 600),    // Show connections
            setTimeout(() => setPhase(2), 1400),   // Show logo + progress
            setTimeout(() => setPhase(3), 2800),   // Start exit
            setTimeout(() => onComplete(), 3400),  // Done
        ];
        return () => timers.forEach(clearTimeout);
    }, [onComplete]);

    // Cycle status messages
    useEffect(() => {
        if (phase < 2) return;
        const interval = setInterval(() => {
            setMsgIndex((i) => Math.min(i + 1, STATUS_MESSAGES.length - 1));
        }, 400);
        return () => clearInterval(interval);
    }, [phase]);

    return (
        <AnimatePresence>
            {phase < 3 && (
                <motion.div
                    className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
                    style={{ background: "var(--color-bg-primary)" }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                    {/* Neural network visualization */}
                    <div className="relative w-52 h-52 sm:w-64 sm:h-64">
                        <svg
                            viewBox="0 0 200 200"
                            className="w-full h-full"
                            fill="none"
                        >
                            {/* Connection lines — draw in */}
                            {phase >= 1 &&
                                connections.map((conn, i) => (
                                    <motion.line
                                        key={`c-${i}`}
                                        x1={conn.x1}
                                        y1={conn.y1}
                                        x2={conn.x2}
                                        y2={conn.y2}
                                        stroke="var(--color-text-tertiary)"
                                        strokeWidth="0.5"
                                        strokeOpacity={0.4}
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        animate={{ pathLength: 1, opacity: 1 }}
                                        transition={{
                                            pathLength: { duration: 0.8, delay: conn.delay, ease: "easeOut" },
                                            opacity: { duration: 0.3, delay: conn.delay },
                                        }}
                                    />
                                ))}

                            {/* Neural nodes — scale in */}
                            {nodes.map((node, i) => (
                                <motion.circle
                                    key={`n-${i}`}
                                    cx={node.x}
                                    cy={node.y}
                                    r="2"
                                    fill="var(--color-text-secondary)"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{
                                        scale: [0, 1.4, 1],
                                        opacity: [0, 1, 0.7],
                                    }}
                                    transition={{
                                        duration: 0.5,
                                        delay: node.delay,
                                        ease: "easeOut",
                                    }}
                                />
                            ))}

                            {/* Central glow node */}
                            <motion.circle
                                cx="100"
                                cy="100"
                                r="4"
                                fill="var(--color-accent-primary)"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{
                                    scale: phase >= 1 ? [0, 1.5, 1] : 0,
                                    opacity: phase >= 1 ? [0, 1, 0.9] : 0,
                                }}
                                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                            />

                            {/* Pulse ring around center */}
                            {phase >= 1 && (
                                <motion.circle
                                    cx="100"
                                    cy="100"
                                    r="12"
                                    fill="none"
                                    stroke="var(--color-accent-primary)"
                                    strokeWidth="0.5"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{
                                        scale: [0.5, 1.5, 2],
                                        opacity: [0.6, 0.2, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeOut",
                                    }}
                                />
                            )}
                        </svg>
                    </div>

                    {/* Logo text */}
                    <motion.h1
                        className="mt-6 text-3xl sm:text-4xl font-light tracking-wide"
                        style={{ color: "var(--color-text-primary)" }}
                        initial={{ opacity: 0, y: 16, letterSpacing: "0.2em" }}
                        animate={{
                            opacity: phase >= 2 ? 1 : 0,
                            y: phase >= 2 ? 0 : 16,
                            letterSpacing: phase >= 2 ? "0.08em" : "0.2em",
                        }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                    >
                        CorteXia
                    </motion.h1>

                    {/* Progress bar */}
                    <motion.div
                        className="mt-8 w-48 sm:w-56 h-[2px] rounded-full overflow-hidden"
                        style={{ background: "var(--color-border)" }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: phase >= 2 ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            className="h-full rounded-full"
                            style={{ background: "var(--color-accent-primary)" }}
                            initial={{ width: "0%" }}
                            animate={{ width: phase >= 2 ? "100%" : "0%" }}
                            transition={{ duration: 1.4, ease: "easeInOut" }}
                        />
                    </motion.div>

                    {/* Status text */}
                    <div className="mt-4 h-5 overflow-hidden">
                        <AnimatePresence mode="wait">
                            {phase >= 2 && (
                                <motion.p
                                    key={msgIndex}
                                    className="text-xs sm:text-sm"
                                    style={{ color: "var(--color-text-tertiary)" }}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {STATUS_MESSAGES[msgIndex]}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
