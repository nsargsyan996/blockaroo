/** 12345 -> "12,345". Formatted by hand so every platform (including Hermes without Intl data) matches. */
export const formatScore = (value: number) =>
    Math.round(value)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
