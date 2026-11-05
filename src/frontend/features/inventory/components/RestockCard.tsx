import { Button } from '@/frontend/components/button';
import { Card } from '@/frontend/components/card';
import { Progress } from '@/frontend/components/ui/progress';
import { businessesService } from '@/frontend/features/businesses/services';
import { FormatMoney } from '@/frontend/utils/format';
import { RestockCost } from '../lib/inventory-stats';
import { ItemFilterStatusTypeEnum, StockStatusTypeEnum, type ItemResponseType } from '../types';

type Props = {
  items: ItemResponseType[];
  onReview: (status: ItemFilterStatusTypeEnum) => void;
  className?: string;
};

/** How far stock is from healthy: the money it takes to get there, and a way into the list of what is short. */
export const RestockCard = ({ items, onReview, className }: Props) => {
  const { currency, template } = businessesService.useBusiness();
  const out = items.filter((i) => i.status === StockStatusTypeEnum.OUT).length;
  const low = items.filter((i) => i.status === StockStatusTypeEnum.LOW).length;
  const healthy = items.length - out - low;
  const share = items.length ? Math.round((healthy / items.length) * 100) : 0;
  const cost = FormatMoney(RestockCost(items), currency);
  return (
    <Card title="Restock target" className={className}>
      <div className="restock">
        <div className="restock-panel">
          <p className="restock-value">
            {cost}
            <span className="restock-caption block">to reach reorder levels</span>
          </p>
          {items.length > 0 && (
            <div className="restock-meter">
              <p className="restock-meter-labels">
                <span>{share}% healthy</span>
                <strong>{healthy} of {items.length}</strong>
              </p>
              <Progress value={share} aria-label={`${healthy} of ${items.length} in stock`} className="meter-gradient bg-line" />
            </div>
          )}
        </div>
        <p className="restock-text">
          {!items.length
            ? `Nothing stocked yet. This fills in as you add ${template.labels.items.toLowerCase()}.`
            : out || low
              ? `${out} out of stock and ${low} running low. The target counts what is already on its way.`
              : 'Everything is above its reorder level.'}
        </p>
        {(out > 0 || low > 0) && (
          <Button variant="primary" className="cta-gradient w-full" onClick={() => onReview(out ? ItemFilterStatusTypeEnum.OUT : ItemFilterStatusTypeEnum.LOW)}>
            Review {out ? 'out of stock' : 'low stock'}
          </Button>
        )}
      </div>
    </Card>
  );
};
