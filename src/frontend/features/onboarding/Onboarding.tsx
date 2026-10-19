import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/frontend/components/button';
import { ErrorState, SkeletonRows } from '@/frontend/components/feedback';
import { describedBy, Field } from '@/frontend/components/form';
import { paths } from '@/frontend/config/paths';
import { AuthLayout } from '@/frontend/features/auth/components/AuthLayout';
import { businessesService } from '@/frontend/features/businesses/services';
import { CreateBusinessSchema, type BusinessTypeEnum } from '@/frontend/features/businesses/types';
import { SessionGate } from '@/frontend/features/shell/components/SessionGate';
import { useDocumentTitle } from '@/frontend/hooks/use-document-title';
import { FieldErrors } from '@/frontend/lib/form';
import { StartChoice } from './components/StartChoice';
import { TemplateCard } from './components/TemplateCard';

const STEPS = ['Kind of business', 'Name', 'Start'];

function Wizard() {
  const navigate = useNavigate();
  const templates = businessesService.useTemplates();
  const mine = businessesService.useMyBusinesses();
  const create = businessesService.useCreateBusinessMutation();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<BusinessTypeEnum | null>(null);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [sampleData, setSampleData] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const template = templates.data?.find((t) => t.type === type);

  const next = () => {
    if (step === 0 && !type) return setErrors({ type: 'Choose the kind of business you run' });
    if (step === 1) {
      const parsed = CreateBusinessSchema.safeParse({ name, type, currency, sampleData });
      if (!parsed.success) return setErrors(FieldErrors(parsed.error));
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const finish = () => {
    const parsed = CreateBusinessSchema.safeParse({ name, type, currency, sampleData });
    if (!parsed.success) return setErrors(FieldErrors(parsed.error));
    create.mutate(parsed.data, { onSuccess: () => navigate(paths.world, { replace: true }) });
  };

  return (
    <AuthLayout wide title="Set up your business" subtitle="StockMotion adapts its screens, words and live 3D world to the kind of business you run.">
      <ol className="steps" aria-label="Setup progress">
        {STEPS.map((s, i) => (
          <li key={s} className={`step step-${i < step ? 'done' : i === step ? 'current' : 'todo'}`} aria-current={i === step ? 'step' : undefined}>
            {s}
          </li>
        ))}
      </ol>

      {step === 0 &&
        (templates.isPending ? (
          <SkeletonRows rows={3} height={120} label="Loading business types" />
        ) : templates.isError ? (
          <ErrorState message={templates.error.message} onRetry={() => templates.refetch()} />
        ) : (
          <div className="template-grid" role="radiogroup" aria-label="Kind of business">
            {templates.data.map((t) => (
              <TemplateCard key={t.type} template={t} selected={t.type === type} onSelect={() => (setType(t.type), setErrors({}))} />
            ))}
          </div>
        ))}
      {errors.type && <p className="form-error" role="alert">{errors.type}</p>}

      {step === 1 && template && (
        <div className="form">
          <Field id="biz-name" label={`Name of your ${template.name.toLowerCase()}`} error={errors.name}>
            <input id="biz-name" data-autofocus className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={describedBy('biz-name', errors.name)} />
          </Field>
          <Field id="biz-currency" label="Currency" error={errors.currency} hint="3-letter code: USD, EUR, GBP, INR, AUD …">
            <input id="biz-currency" className="input input-short" value={currency} maxLength={3} onChange={(e) => setCurrency(e.target.value.toUpperCase())} aria-invalid={Boolean(errors.currency)} aria-describedby={describedBy('biz-currency', errors.currency, true)} />
          </Field>
        </div>
      )}

      {step === 2 && template && <StartChoice template={template} sampleData={sampleData} onChange={setSampleData} />}
      {create.error && <p className="form-error" role="alert">{create.error.message}</p>}

      <div className="form-actions auth-actions">
        {step > 0 ? <Button onClick={() => setStep((s) => s - 1)}>Back</Button> : mine.data?.length ? <Link className="btn btn-secondary" to={paths.dashboard}>Back to my business</Link> : <span />}
        {step < STEPS.length - 1 ? (
          <Button variant="primary" onClick={next}>Continue</Button>
        ) : (
          <Button variant="primary" icon="check" loading={create.isPending} onClick={finish}>Create {name.trim() || 'business'}</Button>
        )}
      </div>
    </AuthLayout>
  );
}

export function Onboarding() {
  useDocumentTitle('Set up your business');
  return (
    <SessionGate>
      <Wizard />
    </SessionGate>
  );
}
