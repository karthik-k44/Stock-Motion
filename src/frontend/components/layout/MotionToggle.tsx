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
        className="h-[34px] max-w-[210px] gap-1.5 rounded-lg bg-surface px-2.5 text-[13px] text-ink-2 shadow-none max-[760px]:max-w-[150px]"
      >
        <Icon name="motion" size={16} />
        <SelectValue />
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
