import { Icon } from '@/frontend/components/icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/frontend/components/ui/select';
import { useMotion } from '@/frontend/hooks/use-motion';
import { MotionPreferenceTypeEnum } from '@/frontend/types';

const LABEL: Record<MotionPreferenceTypeEnum, string> = {
  SYSTEM: 'Motion: system',
  ON: 'Motion: on',
  OFF: 'Motion: off',
};

/** Lets people turn warehouse animations off regardless of their OS setting. */
export const MotionToggle = () => {
  const { preference, reduced, setPreference } = useMotion();
  return (
    <Select value={preference} onValueChange={(v) => setPreference(v as MotionPreferenceTypeEnum)}>
      <SelectTrigger
        aria-label="Animation preference"
        title={reduced ? 'Animations are reduced' : 'Animations are on'}
        className="grid size-[38px] flex-none place-items-center rounded-full border-line bg-surface p-0 text-ink-2 shadow-none hover:bg-sunken [&>svg:last-child]:hidden"
      >
        <Icon name="motion" size={17} />
        <span className="sr-only">
          <SelectValue />
        </span>
      </SelectTrigger>
      {/* Above modals and drawers (z-index 100–150 in overlay.css) */}
      <SelectContent position="popper" align="end" className="z-300">
        {Object.values(MotionPreferenceTypeEnum).map((p) => (
          <SelectItem key={p} value={p}>
            {LABEL[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
