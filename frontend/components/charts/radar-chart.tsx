"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RadarChartProps {
  data: Array<{ label: string; value: number; maxValue?: number }>;
  title?: string;
  size?: number;
  showValues?: boolean;
  color?: string;
}

export function RadarChart({
  data,
  title,
  size = 280,
  showValues = true,
  color = "#3b82f6",
}: RadarChartProps) {
  const center = size / 2;
  const radius = size * 0.4;
  const levels = 5;

  // Calculate points for each data item
  const points = useMemo(() => {
    const angleStep = (2 * Math.PI) / data.length;
    return data.map((item, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const maxVal = item.maxValue || 100;
      const normalizedValue = Math.min(item.value / maxVal, 1);
      const r = radius * normalizedValue;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        labelX: center + (radius + 25) * Math.cos(angle),
        labelY: center + (radius + 25) * Math.sin(angle),
        ...item,
      };
    });
  }, [data, center, radius]);

  // Generate polygon path
  const polygonPath = useMemo(() => {
    return (
      points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") +
      " Z"
    );
  }, [points]);

  // Generate level circles
  const levelPaths = useMemo(() => {
    return Array.from({ length: levels }, (_, levelIndex) => {
      const levelRadius = (radius / levels) * (levelIndex + 1);
      const angleStep = (2 * Math.PI) / data.length;
      return (
        data
          .map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = center + levelRadius * Math.cos(angle);
            const y = center + levelRadius * Math.sin(angle);
            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
          })
          .join(" ") + " Z"
      );
    });
  }, [data.length, center, radius, levels]);

  // Generate axis lines
  const axisLines = useMemo(() => {
    const angleStep = (2 * Math.PI) / data.length;
    return data.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      return {
        x1: center,
        y1: center,
        x2: center + radius * Math.cos(angle),
        y2: center + radius * Math.sin(angle),
      };
    });
  }, [data.length, center, radius]);

  return (
    <Card className="p-4">
      {title && <h3 className="font-medium mb-4 text-center">{title}</h3>}
      <div className="flex justify-center">
        <svg width={size} height={size} className="overflow-visible">
          {/* Background levels */}
          {levelPaths.map((path, i) => (
            <path
              key={`level-${i}`}
              d={path}
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
          ))}

          {/* Axis lines */}
          {axisLines.map((axis, i) => (
            <line
              key={`axis-${i}`}
              {...axis}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeWidth={1}
            />
          ))}

          {/* Data polygon */}
          <motion.path
            d={polygonPath}
            fill={color}
            fillOpacity={0.2}
            stroke={color}
            strokeWidth={2}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          />

          {/* Data points */}
          {points.map((point, i) => (
            <motion.circle
              key={`point-${i}`}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={color}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
            />
          ))}

          {/* Labels */}
          {points.map((point, i) => (
            <g key={`label-${i}`}>
              <text
                x={point.labelX}
                y={point.labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-foreground text-xs font-medium"
              >
                {point.label}
              </text>
              {showValues && (
                <text
                  x={point.labelX}
                  y={point.labelY + 14}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-muted-foreground text-[10px]"
                >
                  {Math.round(point.value)}%
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </Card>
  );
}
