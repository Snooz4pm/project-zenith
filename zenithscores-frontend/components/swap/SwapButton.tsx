import { Button } from '@/components/ui/Button';

interface SwapButtonProps {
    onClick: () => void;
    state: 'idle' | 'loading' | 'error' | 'success' | 'connect';
    disabled?: boolean;
}

export function SwapButton({ onClick, state, disabled }: SwapButtonProps) {
    const getLabel = () => {
        switch (state) {
            case 'loading': return 'Swapping...';
            case 'success': return 'Success!';
            case 'error': return 'Try Again';
            case 'connect': return 'Connect Wallet';
            default: return 'Swap';
        }
    };

    return (
        <Button
            onClick={onClick}
            disabled={disabled || state === 'loading'}
            variant={state === 'error' ? 'danger' : 'primary'}
            isLoading={state === 'loading'}
            className="w-full py-4 text-lg"
        >
            {getLabel()}
        </Button>
    );
}
