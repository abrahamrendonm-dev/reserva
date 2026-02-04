/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx}",
    ],
    theme: {
        extend: {
            colors: {
                'soft-pink': '#fdf2f8',
                'light-pink': '#fef5fa',
            },
        },
    },
    plugins: [],
}
