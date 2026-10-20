import { Icon } from '@/frontend/components/icon';
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
    <label className="topbar-control" title={reduced ? 'Animations are reduced' : 'Animations are on'}>
      <Icon name="motion" size={16} />
      <span className="sr-only">Animation preference</span>
      <select
        className="topbar-select"
        value={preference}
        onChange={(e) => setPreference(e.target.value as MotionPreferenceTypeEnum)}
      >
        {Object.values(MotionPreferenceTypeEnum).map((p) => (
          <option key={p} value={p}>
            {LABEL[p]}
          </option>
        ))}
      </select>
    </label>
  );
};
