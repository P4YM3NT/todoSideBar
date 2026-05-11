import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
	state: State = { hasError: false };

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo): void {
		console.error('ErrorBoundary caught:', error, info.componentStack);
	}

	render(): ReactNode {
		if (this.state.hasError) {
			return this.props.fallback ?? (
				<div className="p-4 text-xs text-[#8A8A8A]">Etwas ist schiefgelaufen.</div>
			);
		}
		return this.props.children;
	}
}
