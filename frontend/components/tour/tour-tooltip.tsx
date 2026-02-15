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
            className="max-w-[400px] border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-xl z-[1000] relative"
        >
            <button
                {...closeProps}
                className="absolute top-3 right-3 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            >
                <X className="w-4 h-4" />
            </button>

            <CardHeader className="pb-2">
                {step.title && (
                    <CardTitle className="text-lg font-bold text-[var(--color-text-primary)] flex items-center justify-between">
                        {step.title}
                        <span className="text-xs font-normal text-[var(--color-text-tertiary)] ml-4">
                            {index + 1}
                        </span>
                    </CardTitle>
                )}
            </CardHeader>

            <CardContent className="pb-4">
                <div className="text-sm text-[var(--color-text-secondary)]">
                    {step.content}
                </div>
            </CardContent>

            <CardFooter className="flex justify-between pt-0 pb-4">
                {!isLastStep && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={closeProps.onClick} // Skip
                        className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] px-2"
                    >
                        Skip Tour
                    </Button>
                )}

                <div className="flex gap-2 ml-auto">
                    {index > 0 && (
                        <Button
                            {...backProps}
                            variant="outline"
                            size="sm"
                            className="text-xs h-8"
                        >
                            Back
                        </Button>
                    )}

                    <Button
                        {...primaryProps}
                        size="sm"
                        className="text-xs h-8"
                    >
                        {isLastStep ? "Finish" : "Next"}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
