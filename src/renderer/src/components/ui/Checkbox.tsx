import { Check } from 'lucide-react';
import { cn } from '../../lib/cn';

interface Props {
	checked: boolean;
	onChange: () => void;
	className?: string;
}

export function Checkbox({ checked, onChange, className }: Props): JSX.Element {
	return (
		<button
			onClick={onChange}
			aria-checked={checked}
			role="checkbox"
			className={cn(
				'flex-shrink-0 w-4 h-4 rounded flex items-center justify-center transition-colors duration-150',
				'border focus:outline-none',
				checked
					? 'bg-[#2563EB] dark:bg-[#EAB308] border-[#2563EB] dark:border-[#EAB308]'
					: 'border-[#E5E5E5] dark:border-[#2A2A2A] hover:border-[#2563EB] dark:hover:border-[#EAB308]',
				className,
			)}
		>
			{checked && <Check size={10} className="text-white dark:text-[#141414]" strokeWidth={3} />}
		</button>
	);
}
