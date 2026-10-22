import { useState } from 'react';
import { Button } from '@/frontend/components/button';
import { Field } from '@/frontend/components/form';
import { Modal } from '@/frontend/components/modal';
import { businessesService } from '@/frontend/features/businesses/services';
import { importsService } from '../services';
import type { ImportPreviewResponseType } from '../types';

const EXAMPLE = 'sku,name,category,unit,on_hand,reorder_level,cost,price,location,supplier';

/** Upload a spreadsheet export, check every row, then import it in one go (all or nothing). */
export const ImportModal = ({ onClose }: { onClose: () => void }) => {
  const { template } = businessesService.useBusiness();
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<ImportPreviewResponseType | null>(null);
  const check = importsService.usePreviewImportMutation();
  const commit = importsService.useCommitImportMutation();
  const error = check.error ?? commit.error;

  const load = async (file: File | undefined) => {
    if (!file) return;
    setFileName(file.name);
    setPreview(null);
    const text = await file.text();
    setCsv(text);
    check.mutate(text, { onSuccess: setPreview });
  };

  const bad = preview?.rows.filter((r) => r.errors.length) ?? [];
  return (
    <Modal
      open
      onClose={onClose}
      title={`Import ${template.labels.items.toLowerCase()} from CSV`}
      description={<>Columns: <span className="mono small">{EXAMPLE}</span>. Existing SKUs are updated; new ones are added; unknown categories and suppliers are created.</>}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon="upload" disabled={!preview || preview.errorCount > 0} loading={commit.isPending} onClick={() => commit.mutate(csv, { onSuccess: onClose })}>
            {preview ? `Import ${preview.creates + preview.updates} rows` : 'Import'}
          </Button>
        </>
      }
    >
      <Field id="import-file" label="CSV file" hint={fileName || 'Export from Excel or Google Sheets as CSV'}>
        <input id="import-file" type="file" accept=".csv,text/csv" className="input" onChange={(e) => void load(e.target.files?.[0])} />
      </Field>
      {check.isPending && <p className="muted" role="status">Checking every row…</p>}
      {error && <p className="form-error" role="alert">{error.message}</p>}
      {preview && (
        <div className="import-summary" role="status">
          <p>
            <strong>{preview.creates}</strong> new · <strong>{preview.updates}</strong> updated
            {preview.errorCount > 0 && <> · <strong className="text-critical">{preview.errorCount} with problems</strong></>}
          </p>
          {(preview.newCategories.length > 0 || preview.newSuppliers.length > 0) && (
            <p className="muted small">
              Will add {[...preview.newCategories.map((c) => `category “${c}”`), ...preview.newSuppliers.map((s) => `supplier “${s}”`)].join(', ')}.
            </p>
          )}
          {bad.length > 0 && (
            <ul className="import-errors">
              {bad.slice(0, 12).map((r) => (
                <li key={r.line}>
                  Line {r.line}{r.sku && <> · <span className="mono">{r.sku}</span></>}: {r.errors.join('; ')}
                </li>
              ))}
              {bad.length > 12 && <li>…and {bad.length - 12} more</li>}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
};
