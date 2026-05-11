import type { Config } from 'tailwindcss';

export default {
	content: ['./src/renderer/src/**/*.{ts,tsx}'],
	darkMode: 'class',
	theme: {
		extend: {
			fontFamily: {
				sans: [
					'-apple-system',
					'BlinkMacSystemFont',
					'Segoe UI',
					'Helvetica',
					'Arial',
					'sans-serif',
				],
			},
			colors: {
				surface: {
					light: '#F7F7F7',
					dark: '#1E1E1E',
				},
				border: {
					light: '#E5E5E5',
					dark: '#2A2A2A',
				},
				accent: {
					light: '#2563EB',
					dark: '#EAB308',
				},
				muted: {
					light: '#8A8A8A',
					dark: '#6B6B6B',
				},
			},
			fontSize: {
				xs: ['11px', '16px'],
				sm: ['13px', '20px'],
				base: ['13px', '20px'],
				md: ['15px', '22px'],
			},
			borderRadius: {
				card: '6px',
				input: '4px',
				pill: '12px',
			},
			transitionDuration: {
				fast: '150ms',
				DEFAULT: '200ms',
			},
		},
	},
	plugins: [],
} satisfies Config;
