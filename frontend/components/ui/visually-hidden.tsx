"use client";

import * as VisuallyHiddenPrimitive from "@radix-ui/react-visually-hidden";

function VisuallyHidden({
  children,
  ...props
}: React.ComponentProps<typeof VisuallyHiddenPrimitive.Root>) {
  return (
    <VisuallyHiddenPrimitive.Root {...props}>
      {children}
    </VisuallyHiddenPrimitive.Root>
  );
}

export { VisuallyHidden };
