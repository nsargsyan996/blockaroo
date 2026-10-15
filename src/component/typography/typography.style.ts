import { cva } from "class-variance-authority";

export const typographyVariants = cva("", {
    variants: {
        variant: {
            hero: "font-display text-5xl leading-[56px]",
            title: "font-display text-3xl leading-[38px]",
            subtitle: "font-body text-xl leading-7",
            body: "font-medium text-base leading-6",
            caption: "font-body text-xs uppercase leading-4 tracking-[2px]",
        },
        tone: {
            white: "text-white",
            soft: "text-soft",
            ink: "text-ink",
            sun: "text-sun",
        },
        align: {
            left: "text-left",
            center: "text-center",
        },
    },
    defaultVariants: {
        variant: "body",
        tone: "white",
        align: "left",
    },
});
