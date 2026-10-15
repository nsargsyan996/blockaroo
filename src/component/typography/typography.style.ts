import { cva } from "class-variance-authority";

export const typographyVariants = cva("", {
    variants: {
        variant: {
            hero: "font-display text-5xl leading-[56px]",
            title: "font-display text-3xl leading-[38px]",
            subtitle: "font-display text-xl leading-7",
            body: "font-body text-lg leading-6",
            caption: "font-body text-sm uppercase leading-5 tracking-widest",
        },
        tone: {
            ink: "text-ink",
            soft: "text-ink-soft",
            white: "text-white",
            sun: "text-sun",
        },
        align: {
            left: "text-left",
            center: "text-center",
        },
    },
    defaultVariants: {
        variant: "body",
        tone: "ink",
        align: "left",
    },
});
