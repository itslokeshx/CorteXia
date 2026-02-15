import { TooltipRenderProps } from "react-joyride";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

export function TourTooltip({
    continuous,
    index,
    step,
    backProps,
    closeProps,
    primaryProps,
    tooltipProps,
    isLastStep,
}: TooltipRenderProps) {
    return (
        <Card
            {...tooltipProps}
            className="max-w-[300px] sm:max-w-[400px] border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl z-[1000] relative rounded-xl"
        >
            <button
                {...closeProps}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors p-1"
            >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <CardHeader className="pb-1 sm:pb-2 pt-3 px-3 sm:pt-6 sm:px-6">
                {step.title && (
                    <CardTitle className="text-sm sm:text-lg font-bold text-[var(--color-text-primary)] flex items-center justify-between gap-2">
                        <span>{step.title}</span>
                        <span className="text-[10px] sm:text-xs font-normal text-[var(--color-text-tertiary)] bg-[var(--color-bg-primary)] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            {index + 1} / {5}
                        </span>
                    </CardTitle>
                )}
            </CardHeader>

            <CardContent className="pb-2 sm:pb-4 px-3 sm:px-6">
                <div className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {step.content}
                </div>
            </CardContent>

            <CardFooter className="flex justify-between items-center pt-1 pb-3 px-3 sm:pt-0 sm:pb-4 sm:px-6">
                {/* Only show skip if not last step */}
                {!isLastStep ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={closeProps.onClick}
                        className="text-[10px] sm:text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] h-7 px-2"
                    >
                        Skip
                    </Button>
                ) : <div />}

                <div className="flex gap-2">
                    {index > 0 && (
                        <Button
                            {...backProps}
                            variant="outline"
                            size="sm"
                            className="text-[10px] sm:text-xs h-7 sm:h-8 px-2.5 sm:px-4"
                        >
                            Back
                        </Button>
                    )}

                    <Button
                        {...primaryProps}
                        size="sm"
                        className="text-[10px] sm:text-xs h-7 sm:h-8 px-3 sm:px-4"
                    >
                        {isLastStep ? "Finish" : "Next"}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
