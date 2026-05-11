import { cn } from '../../lib/cn';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
	className?: string;
}

export function Input({ className, ...props }: Props): JSX.Element {
	return (
		<input
			{...props}
			className={cn(
				'w-full bg-transparent text-sm text-[#1A1A1A] dark:text-[#F0F0F0]',
				'placeholder:text-[#8A8A8A] focus:outline-none',
				'border border-[#E5E5E5] dark:border-[#2A2A2A] rounded-input px-2 py-1',
				'focus:border-[#2563EB] dark:focus:border-[#EAB308] transition-colors duration-150',
				className,
			)}
		/>
	);
}
