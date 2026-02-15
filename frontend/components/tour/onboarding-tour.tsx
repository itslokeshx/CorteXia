"use client";

import React, { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS } from "react-joyride";
import { useTour } from "@/lib/context/tour-context";
import { TourTooltip } from "./tour-tooltip";
import { getDashboardSteps } from "./steps";
import { useTheme } from "next-themes";

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

    if (!isMounted) return null;

    const steps = getDashboardSteps(isMobile);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, type, index, action } = data;

        // Sync local step index with Joyride's
        if (type === "step:after") {
            setStepIndex(index + 1);
        } else if (type === "error:target_not_found") {
            // If target not found, skip to next step? or stop?
            // simple approach for now:
            console.warn("Tour target not found, skipping step");
            setStepIndex(index + 1);
        }

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            setRun(false);
            handleTourFinish();
        }
    };

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
                    primaryColor: "#8B5CF6",
                    arrowColor: theme === "dark" ? "#1a1b1e" : "#ffffff", // Match card bg
                },
                overlay: {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    mixBlendMode: 'hard-light'
                },
                spotlight: {
                    borderRadius: '12px',
                }
            }}
            disableOverlayClose={true} // Force user to use buttons
            scrollOffset={100}
        />
    );
}
