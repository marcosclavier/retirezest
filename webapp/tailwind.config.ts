import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Plan Health Score dynamic classes
    'bg-blue-600',
    'bg-blue-700',
    'bg-green-600',
    'bg-green-700',
    'bg-yellow-100',
    'bg-yellow-200',
    'bg-red-100',
    'bg-red-200',
    'text-white',
    'text-gray-900',
    'text-gray-700',
    'text-gray-800',
    'text-gray-600',
    'text-white/90',
    'text-white/75',
    'bg-white/20',
    'border-white/20',
    'border-white/30',
    'bg-gray-900/10',
    'border-gray-900/20',
    'border-gray-800/30',
    'dark:bg-blue-700',
    'dark:bg-green-700',
    'dark:bg-yellow-200',
    'dark:bg-red-200',
    'dark:text-gray-900',
    'dark:text-gray-800',
    'dark:text-gray-700',
    'dark:border-gray-800/30',
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;
