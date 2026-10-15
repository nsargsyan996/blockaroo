import { cva } from "class-variance-authority";

/** The face of the button. The darker "edge" under it is drawn by the wrapper and shows the press depth. */
export const buttonFaceVariants = cva("flex-row items-center justify-center gap-3 rounded-2xl", {
    variants: {
        variant: {
            primary: "bg-sun",
            success: "bg-leaf",
            secondary: "border border-white/15 bg-white/10",
        },
        size: {
            lg: "min-h-[64px] px-8",
            md: "min-h-[52px] px-6",
        },
    },
    defaultVariants: {
        variant: "primary",
        size: "lg",
    },
});

export const buttonEdgeVariants = cva("rounded-2xl", {
    variants: {
        variant: {
            primary: "bg-sun-shade",
            success: "bg-leaf-shade",
            secondary: "bg-white/5",
        },
    },
    defaultVariants: {
        variant: "primary",
    },
});

export const BUTTON_DEPTH = 5;
