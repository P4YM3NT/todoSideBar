import { cn } from '../../lib/cn';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'primary' | 'ghost';
	size?: 'sm' | 'md';
}

export function Button({ variant = 'ghost', size = 'sm', className, children, ...props }: Props): JSX.Element {
	return (
		<button
			{...props}
			className={cn(
				'inline-flex items-center justify-center rounded-pill font-sans transition-colors duration-150 focus:outline-none disabled:opacity-40',
				size === 'sm' && 'px-3 py-1 text-xs',
				size === 'md' && 'px-4 py-1.5 text-sm',
				variant === 'primary' && 'bg-[#2563EB] dark:bg-[#EAB308] text-white dark:text-[#141414] hover:opacity-90',
				variant === 'ghost' && 'text-[#8A8A8A] hover:text-[#1A1A1A] dark:hover:text-[#F0F0F0] hover:bg-[#F7F7F7] dark:hover:bg-[#1E1E1E]',
				className,
			)}
		>
			{children}
		</button>
	);
}
