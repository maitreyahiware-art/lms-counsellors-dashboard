/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                brand: {
                    light: "#00B6C1",
                    DEFAULT: "#00B6C1",
                    dark: "#0E5858",
                },
                accent: "#FFCC00",
                surface: "#FAFCEE",
            },
            fontFamily: {
                serif: ["var(--font-serif)", "serif"],
                sans: ["var(--font-sans)", "sans-serif"],
            },
            boxShadow: {
                'premium': '0 8px 32px rgba(14, 88, 88, 0.05)',
                'premium-hover': '0 20px 60px rgba(14, 88, 88, 0.08)',
                '3xl': '0 35px 60px -15px rgba(14, 88, 88, 0.3)',
            }
        },
    },
    plugins: [],
};
