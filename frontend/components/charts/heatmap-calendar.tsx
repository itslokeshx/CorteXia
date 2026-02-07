"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface HeatmapCalendarProps {
  data: Array<{ date: string; value: number; label?: string }>;
  title?: string;
  colorScale?: "green" | "blue" | "purple" | "orange";
  onDayClick?: (date: string) => void;
}

export function HeatmapCalendar({
  data,
  title = "Activity Heatmap",
  colorScale = "green",
  onDayClick,
}: HeatmapCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const colorClasses = {
    green: [
      "bg-emerald-900/30",
      "bg-emerald-700/50",
      "bg-emerald-500/70",
      "bg-emerald-400",
      "bg-emerald-300",
    ],
    blue: [
      "bg-blue-900/30",
      "bg-blue-700/50",
      "bg-blue-500/70",
      "bg-blue-400",
      "bg-blue-300",
    ],
    purple: [
      "bg-purple-900/30",
      "bg-purple-700/50",
      "bg-purple-500/70",
      "bg-purple-400",
      "bg-purple-300",
    ],
    orange: [
      "bg-orange-900/30",
      "bg-orange-700/50",
      "bg-orange-500/70",
      "bg-orange-400",
      "bg-orange-300",
    ],
  };

  const colors = colorClasses[colorScale];

  // Build data map
  const dataMap = useMemo(() => {
    const map = new Map<string, { value: number; label?: string }>();
    data.forEach((d) => {
      map.set(d.date, { value: d.value, label: d.label });
    });
    return map;
  }, [data]);

  // Calculate max value for scaling
  const maxValue = useMemo(() => {
    return Math.max(...data.map((d) => d.value), 1);
  }, [data]);

  // Get color level (0-4) based on value
  const getColorLevel = (value: number): number => {
    if (value === 0) return 0;
    const percentage = value / maxValue;
    if (percentage <= 0.25) return 1;
    if (percentage <= 0.5) return 2;
    if (percentage <= 0.75) return 3;
    return 4;
  };

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();

    const days: Array<{ date: Date | null; value: number; label?: string }> =
      [];

    // Add padding for days before the first of the month
    for (let i = 0; i < startPadding; i++) {
      days.push({ date: null, value: 0 });
    }

    // Add actual days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const dateStr = date.toISOString().split("T")[0];
      const dayData = dataMap.get(dateStr);
      days.push({
        date,
        value: dayData?.value || 0,
        label: dayData?.label,
      });
    }

    return days;
  }, [currentMonth, dataMap]);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-medium">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)),
              )
            }
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              setCurrentMonth(
                new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)),
              )
            }
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          if (!day.date) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }

          const colorLevel = getColorLevel(day.value);
          const isToday = day.date.toDateString() === new Date().toDateString();
          const dateStr = day.date.toISOString().split("T")[0];

          return (
            <motion.div
              key={dateStr}
              className={cn(
                "aspect-square rounded-md flex items-center justify-center text-xs cursor-pointer relative group",
                colors[colorLevel],
                isToday &&
                  "ring-2 ring-primary ring-offset-1 ring-offset-background",
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDayClick?.(dateStr)}
            >
              <span
                className={cn(
                  "font-medium",
                  colorLevel >= 3 ? "text-background" : "text-foreground",
                )}
              >
                {day.date.getDate()}
              </span>

              {/* Tooltip */}
              {day.value > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border rounded-lg shadow-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {day.label || `Value: ${day.value}`}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
        <span>Less</span>
        {colors.map((color, i) => (
          <div key={i} className={cn("w-3 h-3 rounded-sm", color)} />
        ))}
        <span>More</span>
      </div>
    </Card>
  );
}
