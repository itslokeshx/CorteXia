import { Step } from "react-joyride";

export const getDashboardSteps = (isMobile: boolean): Step[] => {
    const steps: Step[] = [
        {
            target: "body",
            content: "Welcome to CorteXia! Your AI-powered productivity workspace. Let's take a quick tour to help you get started.",
            placement: "center",
            title: "🧠 Welcome to CorteXia!",
            disableBeacon: true,
        },
        {
            target: ".sidebar-nav",
            content: "Navigate between all features here. Tasks, Habits, Goals, Focus, and more—everything is one click away.",
            placement: "right",
            title: "Navigation",
        },
        {
            target: "[data-tour='tasks-widget']",
            content: "See your daily tasks at a glance. create your first task here!",
            placement: "bottom",
            title: "Today's Tasks",
        },
        {
            target: "[data-tour='habits-widget']",
            content: "Track daily habits with streaks. Mark as complete with one click! 🔥",
            placement: isMobile ? "top" : "left",
            title: "Habit Tracking",
        },
        {
            target: "[data-tour='expenses-widget']",
            content: "Track your daily expenses and stay on budget. Visual breakdowns make finance easy.",
            placement: "top",
            title: "Expense Tracking",
        },
        {
            target: ".ai-chat-trigger",
            content: "Meet Jarvis—your AI assistant. Ask anything, create tasks by voice, get insights.",
            placement: "left",
            title: "Jarvis AI",
        },
    ];

    if (isMobile) {
        // Filter or modify steps for mobile if needed in future
        return steps.filter(s => s.target !== ".sidebar-nav"); // Example adjustment
    }

    return steps;
};
