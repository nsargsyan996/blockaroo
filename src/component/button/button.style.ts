import { cva } from "class-variance-authority";

/** The colored face of the chunky button. The darker "edge" under it is drawn by the wrapper. */
export const buttonFaceVariants = cva(
    "flex-row items-center justify-center gap-3 rounded-3xl border-[3px] border-ink",
    {
        variants: {
            variant: {
                primary: "bg-sun",
                success: "bg-leaf",
                secondary: "bg-white",
            },
            size: {
                lg: "min-h-[72px] px-10",
                md: "min-h-[58px] px-7",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "lg",
        },
    }
);

export const buttonEdgeVariants = cva("rounded-3xl border-[3px] border-ink", {
    variants: {
        variant: {
            primary: "bg-sun-shade",
            success: "bg-leaf-shade",
            secondary: "bg-sky-deep",
        },
    },
    defaultVariants: {
        variant: "primary",
    },
});

export const BUTTON_DEPTH = 6;
