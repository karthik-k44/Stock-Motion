import { Button } from '@/frontend/components/button';
import { Icon } from '@/frontend/components/icon';

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => {
  return (
    <div className="empty empty-error" role="alert">
      <span className="empty-icon" aria-hidden>
        <Icon name="alert" size={22} />
      </span>
      <p className="empty-title">Couldn’t load this</p>
      <p className="empty-text">{message}</p>
      {onRetry && (
        <Button icon="refresh" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
};
