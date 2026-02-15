"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { toast } from "sonner";

interface TourContextType {
    run: boolean;
    stepIndex: number;
    setRun: (run: boolean) => void;
    setStepIndex: (index: number) => void;
    handleTourFinish: () => Promise<void>;
    restartTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, refreshProfile } = useAuth();
    const [run, setRun] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);

    // Check onboarding status on load
    useEffect(() => {
        if (isAuthenticated && user && !user.onboardingCompleted && !hasStarted) {
            // Small delay to ensure UI is ready
            const timer = setTimeout(() => {
                setRun(true);
                setHasStarted(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, user, hasStarted]);

    const handleTourFinish = async () => {
        setRun(false);

        // Optimistic update - user context update might happen later
        // Call API to update onboarding status
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = localStorage.getItem("cortexia_token");

            const response = await fetch(`${API_URL}/api/user/onboarding`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ completed: true }),
            });

            if (!response.ok) throw new Error("Failed to update status");

            toast.success("You're all set! Enjoy CorteXia. 🚀");

            // Refresh local user context to reflect the change
            await refreshProfile();
        } catch (error) {
            console.error("Failed to save tour progress:", error);
        }
    };

    const restartTour = async () => {
        setStepIndex(0);
        setRun(true);

        // Optionally reset backend status if needed, but for "Restart" 
        // usually just running it locally is enough. 
        // If we want to persist "not completed" again:
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const token = localStorage.getItem("cortexia_token");
            await fetch(`${API_URL}/api/user/onboarding`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ completed: false }),
            });
        } catch (e) {
            console.error("Failed to reset tour status", e);
        }
    };

    return (
        <TourContext.Provider
            value={{
                run,
                stepIndex,
                setRun,
                setStepIndex,
                handleTourFinish,
                restartTour,
            }}
        >
            {children}
        </TourContext.Provider>
    );
}

export function useTour() {
    const context = useContext(TourContext);
    if (context === undefined) {
        throw new Error("useTour must be used within a TourProvider");
    }
    return context;
}
