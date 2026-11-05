export const MotionPreferenceTypeEnum = {
  SYSTEM: 'SYSTEM',
  ON: 'ON',
  OFF: 'OFF',
} as const;
export type MotionPreferenceTypeEnum = (typeof MotionPreferenceTypeEnum)[keyof typeof MotionPreferenceTypeEnum];
