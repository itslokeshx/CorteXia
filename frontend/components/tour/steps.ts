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
        return steps.filter(s => s.target !== ".sidebar-nav");
    }

    return steps;
};

export const getTasksSteps = (): Step[] => [
    {
        target: "body",
        content: "Welcome to your Tasks workspace. Organize your life with ease.",
        placement: "center",
        title: "✅ Tasks Management",
        disableBeacon: true,
    },
    {
        target: "[data-tour='create-task-btn']",
        content: "Create a new task. You can add details, due dates, and priorities.",
        placement: "bottom",
        title: "Create Task",
    },
    {
        target: "[data-tour='task-filters']",
        content: "Filter tasks by status, priority, or category to focus on what matters.",
        placement: "bottom",
        title: "Filter & Sort",
    },
    {
        target: "[role='tablist']",
        content: "Switch between Today, Week, Month, or All Time views to plan your schedule.",
        placement: "bottom",
        title: "View Options",
    },
];

export const getHabitsSteps = (): Step[] => [
    {
        target: "body",
        content: "Build better habits and break bad ones. Consistency is key!",
        placement: "center",
        title: "🔥 Habit Tracker",
        disableBeacon: true,
    },
    {
        target: "[data-tour='create-habit-btn']",
        content: "Start a new habit. Define frequency and goals.",
        placement: "bottom",
        title: "New Habit",
    },
    {
        target: "[data-tour='habit-heatmap']",
        content: "Visualize your consistency over time with the heatmap.",
        placement: "bottom",
        title: "Consistency Heatmap",
    },
];

export const getFinanceSteps = (): Step[] => [
    {
        target: "body",
        content: "Take control of your finances. Track income, expenses, and savings.",
        placement: "center",
        title: "💰 Finance Tracker",
        disableBeacon: true,
    },
    {
        target: "[data-tour='add-transaction-btn']",
        content: "Log an expense or income. Categorize it for better insights.",
        placement: "bottom",
        title: "Add Transaction",
    },
    {
        target: "[data-tour='finance-overview']",
        content: "See your net worth, monthly spending, and budget status.",
        placement: "bottom",
        title: "Financial Overview",
    },
];

export const getJournalSteps = (): Step[] => [
    {
        target: "body",
        content: "Reflect on your day, track your mood, and clear your mind.",
        placement: "center",
        title: "📔 Journaling",
        disableBeacon: true,
    },
    {
        target: "[data-tour='new-entry-btn']",
        content: "Write a new entry. Use templates or free flow.",
        placement: "bottom",
        title: "New Entry",
    },
    {
        target: "[data-tour='mood-tracker']",
        content: "Track your emotional well-being over time.",
        placement: "bottom",
        title: "Mood Tracker",
    },
];
export const getGoalsSteps = (): Step[] => [
    {
        target: "body",
        content: "Turn your dreams into reality. Break big goals into manageable steps.",
        placement: "center",
        title: "🎯 Goals",
        disableBeacon: true,
    },
    {
        target: "[data-tour='create-goal-area']",
        content: "Type your goal here and select a timeframe. It's that simple.",
        placement: "bottom",
        title: "Quick Create",
    },
    {
        target: "[data-tour='goals-list']",
        content: "Track progress, see momentum, and celebrate milestones.",
        placement: "top",
        title: "Track Progress",
    },
];

export const getDayPlannerSteps = (): Step[] => [
    {
        target: "body",
        content: "Master your day with time blocking. Plan intentionally.",
        placement: "center",
        title: "📅 Day Planner",
        disableBeacon: true,
    },
    {
        target: "[data-tour='add-block-btn']",
        content: "Add a time block for tasks, meetings, or deep work.",
        placement: "bottom",
        title: "Add Block",
    },
    {
        target: "[data-tour='planner-view-toggle']",
        content: "Switch between Day to focus and Month to plan ahead.",
        placement: "bottom",
        title: "Views",
    },
    {
        target: "[data-tour='planner-stats']",
        content: "See your daily balance. Ensure you have enough deep work and breaks.",
        placement: "top",
        title: "Daily Balance",
    },
];

export const getFocusSteps = (): Step[] => [
    {
        target: "body",
        content: "Enter the flow state. Distraction-free focus sessions.",
        placement: "center",
        title: "🧘 Focus Mode",
        disableBeacon: true,
    },
    {
        target: "[data-tour='focus-presets']",
        content: "Start a scientifically-proven session like Pomodoro or Deep Work.",
        placement: "bottom",
        title: "Quick Start",
    },
    {
        target: "[data-tour='custom-timer']",
        content: "Need a specific duration? Set a custom timer here.",
        placement: "top",
        title: "Custom Timer",
    },
    {
        target: "[data-tour='recent-sessions']",
        content: "Track your focus history and see your productivity trends.",
        placement: "top",
        title: "History",
    },
];
