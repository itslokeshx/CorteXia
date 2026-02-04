"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface CorrelationMatrixProps {
  domains: Array<{ id: string; label: string; color: string }>;
  correlations: Array<{
    from: string;
    to: string;
    value: number;
    insight?: string;
  }>;
  title?: string;
}

export function CorrelationMatrix({
  domains,
  correlations,
  title = "Correlation Matrix",
}: CorrelationMatrixProps) {
  const [selectedCell, setSelectedCell] = useState<{
    from: string;
    to: string;
  } | null>(null);

  // Build correlation map
  const correlationMap = useMemo(() => {
    const map = new Map<string, { value: number; insight?: string }>();
    correlations.forEach((c) => {
      map.set(`${c.from}-${c.to}`, { value: c.value, insight: c.insight });
      map.set(`${c.to}-${c.from}`, { value: c.value, insight: c.insight });
    });
    return map;
  }, [correlations]);

  // Get color for correlation value
  const getCorrelationColor = (value: number) => {
    if (value > 0.6) return "bg-emerald-500";
    if (value > 0.3) return "bg-emerald-400/70";
    if (value > 0) return "bg-emerald-300/50";
    if (value > -0.3) return "bg-red-300/50";
    if (value > -0.6) return "bg-red-400/70";
    return "bg-red-500";
  };

  // Get selected correlation insight
  const selectedInsight = useMemo(() => {
    if (!selectedCell) return null;
    const key = `${selectedCell.from}-${selectedCell.to}`;
    return correlationMap.get(key);
  }, [selectedCell, correlationMap]);

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-medium">{title}</h3>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span>Positive</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>Negative</span>
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <div className="min-w-fit">
          {/* Column headers */}
          <div className="flex">
            <div className="w-20 h-8 flex-shrink-0" /> {/* Empty corner cell */}
            {domains.map((domain) => (
              <div
                key={`col-${domain.id}`}
                className="w-14 h-8 flex items-center justify-center text-xs font-medium truncate px-1"
                title={domain.label}
              >
                {domain.label.slice(0, 6)}
              </div>
            ))}
          </div>

          {/* Rows */}
          {domains.map((rowDomain) => (
            <div key={`row-${rowDomain.id}`} className="flex">
              {/* Row header */}
              <div className="w-20 h-14 flex items-center text-xs font-medium truncate pr-2">
                {rowDomain.label}
              </div>

              {/* Cells */}
              {domains.map((colDomain) => {
                const key = `${rowDomain.id}-${colDomain.id}`;
                const correlation = correlationMap.get(key);
                const value = correlation?.value || 0;
                const isDiagonal = rowDomain.id === colDomain.id;
                const isSelected =
                  selectedCell?.from === rowDomain.id &&
                  selectedCell?.to === colDomain.id;

                return (
                  <motion.div
                    key={key}
                    className={cn(
                      "w-14 h-14 p-1 cursor-pointer",
                      isDiagonal ? "opacity-0 pointer-events-none" : "",
                    )}
                    whileHover={{ scale: isDiagonal ? 1 : 1.05 }}
                    onClick={() =>
                      !isDiagonal &&
                      setSelectedCell(
                        isSelected
                          ? null
                          : { from: rowDomain.id, to: colDomain.id },
                      )
                    }
                  >
                    <div
                      className={cn(
                        "w-full h-full rounded-lg flex items-center justify-center text-xs font-medium transition-all",
                        getCorrelationColor(value),
                        isSelected && "ring-2 ring-primary ring-offset-1",
                        Math.abs(value) > 0.3
                          ? "text-white"
                          : "text-foreground",
                      )}
                    >
                      {isDiagonal
                        ? ""
                        : (value >= 0 ? "+" : "") + value.toFixed(1)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Insight */}
      <AnimatePresence>
        {selectedInsight && selectedCell && (
          <motion.div
            className="mt-4 p-3 bg-muted rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">
                  {domains.find((d) => d.id === selectedCell.from)?.label} →{" "}
                  {domains.find((d) => d.id === selectedCell.to)?.label}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedInsight.insight ||
                    `${Math.abs(selectedInsight.value * 100).toFixed(0)}% ${
                      selectedInsight.value > 0 ? "positive" : "negative"
                    } correlation`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
