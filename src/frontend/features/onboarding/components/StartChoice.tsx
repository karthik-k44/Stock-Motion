import { Cn } from '@/frontend/lib/utils';
import type { TemplateResponseType } from '@/frontend/features/businesses/types';

type Props = { template: TemplateResponseType; sampleData: boolean; onChange: (sample: boolean) => void };

/** Start with a realistic example business, or with nothing. */
export const StartChoice = ({ template, sampleData, onChange }: Props) => {
  const { labels } = template;
  const options = [
    {
      value: true,
      title: 'Start with sample data',
      text: `A working ${template.name.toLowerCase()}: ${labels.items.toLowerCase()}, ${labels.madePlural.toLowerCase()}, open ${labels.orders.toLowerCase()} and ${labels.deliveries.toLowerCase()} on the way. Clear it any time in Settings.`,
    },
    {
      value: false,
      title: 'Start empty',
      text: `Your ${labels.locations.toLowerCase()} and categories are ready; add ${labels.items.toLowerCase()} one by one or import a CSV from your spreadsheet.`,
    },
  ];
  return (
    <div className="choice-list" role="radiogroup" aria-label="How to start">
      {options.map((o) => (
        <button
          key={o.title}
          type="button"
          role="radio"
          aria-checked={sampleData === o.value}
          className={Cn('choice', sampleData === o.value && 'choice-on')}
          onClick={() => onChange(o.value)}
        >
          <span className="strong">{o.title}</span>
          <span className="muted small">{o.text}</span>
        </button>
      ))}
    </div>
  );
};
