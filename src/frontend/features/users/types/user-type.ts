export const UserRoleTypeEnum = {
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  PICKER: 'PICKER',
  FORKLIFT_OPERATOR: 'FORKLIFT_OPERATOR',
  RECEIVING_LEAD: 'RECEIVING_LEAD',
  PACKER: 'PACKER',
} as const;
export type UserRoleTypeEnum = (typeof UserRoleTypeEnum)[keyof typeof UserRoleTypeEnum];

export type UserResponseType = {
  id: string;
  name: string;
  role: UserRoleTypeEnum;
  initials: string;
  vest: string;
  skin: string;
  hat: string;
};

/** Every user type under one name. */
export type TUserType = {
  Response: UserResponseType;
  Role: UserRoleTypeEnum;
};
