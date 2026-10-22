export type ImportRowResultType = {
  /** 1-based line number in the file (the header is line 1) */
  line: number;
  sku: string;
  name: string;
  action: 'CREATE' | 'UPDATE';
  errors: string[];
};

export type ImportPreviewResponseType = {
  rows: ImportRowResultType[];
  creates: number;
  updates: number;
  errorCount: number;
  /** Categories and suppliers that will be added because the file mentions them */
  newCategories: string[];
  newSuppliers: string[];
};

export type ImportResultResponseType = {
  created: number;
  updated: number;
};
