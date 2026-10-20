import { Icon } from '@/frontend/components/icon';

export const ConnectionStatus = ({ connected }: { connected: boolean }) => {
  return (
    <p className={connected ? 'conn conn-on' : 'conn conn-off'} role="status">
      <Icon name="wifi" size={14} />
      {connected ? 'Live — synced across tabs' : 'Reconnecting…'}
    </p>
  );
};
