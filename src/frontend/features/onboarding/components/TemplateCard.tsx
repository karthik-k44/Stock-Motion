import { Icon, type IconName } from '@/frontend/components/icon';
import type { BusinessTypeEnum, TemplateResponseType } from '@/frontend/features/businesses/types';
import { Cn } from '@/frontend/lib/utils';

const ICON: Record<BusinessTypeEnum, IconName> = { RETAIL: 'warehouse', CAFE: 'store', TRADES: 'truck' };

type Props = { template: TemplateResponseType; selected: boolean; onSelect: () => void };

/** One business type to choose from, previewing how the app will talk about the work. */
export const TemplateCard = ({ template, selected, onSelect }: Props) => {
  const { labels } = template;
  return (
    <button type="button" role="radio" aria-checked={selected} className={Cn('template-card', selected && 'template-card-on')} onClick={onSelect}>
      <span className="template-icon" aria-hidden>
        <Icon name={ICON[template.type]} size={22} />
      </span>
      <span className="template-name">{template.name}</span>
      <span className="template-tagline">{template.tagline}</span>
      <span className="template-facts">
        <span>
          <strong>{labels.items}</strong> in {template.zones.map((z) => z.name).slice(0, 3).join(', ')}
          {template.zones.length > 3 ? '…' : ''}
        </span>
        <span>
          <strong>{labels.orders}</strong>: {template.orderFlow.map((s) => s.label).join(' → ')}
        </span>
        <span>
          <strong>{labels.madePlural}</strong> built from your stock · {labels.deliveries.toLowerCase()} from {labels.suppliers.toLowerCase()}
        </span>
      </span>
    </button>
  );
};
