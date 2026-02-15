"use client";

import React, { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useTour } from "@/lib/context/tour-context";
import { TourTooltip } from "./tour-tooltip";
import {
    getDashboardSteps,
    getTasksSteps,
    getHabitsSteps,
    getFinanceSteps,
    getJournalSteps,
    getGoalsSteps,
    getDayPlannerSteps,
    getFocusSteps
} from "./steps";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

export function OnboardingTour() {
    const { run, stepIndex, setStepIndex, setRun, handleTourFinish } = useTour();
    const [isMounted, setIsMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        setIsMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const pathname = usePathname();
    const [steps, setSteps] = useState<Step[]>([]);
    const [pageKey, setPageKey] = useState<string>("");

    useEffect(() => {
        setIsMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        let currentSteps: Step[] = [];
        let key = "";
        let shouldShow = false;

        // Determine steps and key based on path
        switch (pathname) {
            case "/":
            case "/dashboard":
                currentSteps = getDashboardSteps(isMobile);
                key = "dashboard";
                // Dashboard tour is controlled by context "run" state which checks backend
                shouldShow = run;
                break;
            case "/tasks":
                currentSteps = getTasksSteps();
                key = "tasks";
                shouldShow = !localStorage.getItem(`cortexia_tour_${key}_seen`);
                break;
            case "/habits":
                currentSteps = getHabitsSteps();
                key = "habits";
                shouldShow = !localStorage.getItem(`cortexia_tour_${key}_seen`);
                break;
            case "/finance":
                currentSteps = getFinanceSteps();
                key = "finance";
                shouldShow = !localStorage.getItem(`cortexia_tour_${key}_seen`);
                break;
            case "/journal":
                currentSteps = getJournalSteps();
                key = "journal";
                shouldShow = !localStorage.getItem(`cortexia_tour_${key}_seen`);
                break;
            case "/goals":
                currentSteps = getGoalsSteps();
                key = "goals";
                shouldShow = !localStorage.getItem(`cortexia_tour_${key}_seen`);
                break;
            case "/day-planner":
                currentSteps = getDayPlannerSteps();
                key = "day-planner";
                shouldShow = !localStorage.getItem(`cortexia_tour_${key}_seen`);
                break;
            case "/time-tracker":
                currentSteps = getFocusSteps();
                key = "time-tracker";
                shouldShow = !localStorage.getItem(`cortexia_tour_${key}_seen`);
                break;
            default:
                currentSteps = [];
        }

        // Reset step index if switching pages/contexts
        if (key !== pageKey) {
            setStepIndex(0);
        }

        setSteps(currentSteps);
        setPageKey(key);

        // For dashboard, we rely on the Context's "run" state. 
        // For others, we trigger it locally if not seen.
        if (key !== "dashboard" && shouldShow && currentSteps.length > 0) {
            setRun(true);
        }

    }, [pathname, isMobile, isMounted, run, setRun, pageKey, setStepIndex]);

    if (!isMounted) return null;

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, type, index } = data;

        if (type === "step:after") {
            setStepIndex(index + 1);
        } else if (type === "error:target_not_found") {
            console.warn("Tour target not found, skipping step");
            setStepIndex(index + 1);
        }

        // Fix lint error by casting array to string[] or checking individually
        if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
            setRun(false);

            if (pageKey === "dashboard") {
                handleTourFinish(); // Updates backend
            } else {
                // Save local persistence
                localStorage.setItem(`cortexia_tour_${pageKey}_seen`, "true");
            }
        }
    };

    // Don't render Joyride if no steps
    if (steps.length === 0) return null;

    return (
        <Joyride
            steps={steps}
            run={run}
            stepIndex={stepIndex}
            continuous
            showProgress
            showSkipButton
            tooltipComponent={TourTooltip}
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    zIndex: 10000,
                    primaryColor: "var(--color-text-primary)",
                    arrowColor: "var(--color-bg-secondary)",
                    backgroundColor: "var(--color-bg-secondary)",
                    textColor: "var(--color-text-primary)",
                    overlayColor: 'rgba(0, 0, 0, 0.6)',
                },
                overlay: {
                    mixBlendMode: 'normal'
                },
                spotlight: {
                    borderRadius: '12px',
                    backgroundColor: 'transparent',
                }
            }}
            disableOverlayClose={true}
            scrollOffset={100}
        />
    );
}
