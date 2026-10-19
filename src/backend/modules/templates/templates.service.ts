import { BadRequest } from '@/backend/common/errors';
import type { BusinessTypeEnum, OrderStageType, TemplateResponseType } from '@/backend/types/template';
import { CAFE } from './definitions/cafe';
import type { TemplateDefinitionType } from './definitions/definition-type';
import { RETAIL } from './definitions/retail';
import { TRADES } from './definitions/trades';

const DEFINITIONS: Record<BusinessTypeEnum, TemplateDefinitionType> = { RETAIL, CAFE, TRADES };

function Definition(type: string): TemplateDefinitionType {
  const definition = DEFINITIONS[type as BusinessTypeEnum];
  if (!definition) throw BadRequest(`Unknown business type ${type}`);
  return definition;
}

const Get = (type: string): TemplateResponseType => Definition(type).template;
const List = (): TemplateResponseType[] => Object.values(DEFINITIONS).map((d) => d.template);

/** Every storage location a template's zones describe, e.g. A-1-1 (aisle/shelf/bin) or FRIDGE-2 (zone/shelf). */
function Locations(template: TemplateResponseType): { code: string; zone: string; name: string; position: number }[] {
  const out: { code: string; zone: string; name: string; position: number }[] = [];
  for (const z of template.zones) {
    for (let level = 1; level <= z.levels; level++) {
      for (let bin = 1; bin <= z.bins; bin++) {
        const code = z.bins > 1 ? `${z.code}-${level}-${bin}` : z.levels > 1 ? `${z.code}-${level}` : z.code;
        const parts = [z.name];
        if (z.levels > 1) parts.push(`${z.levelLabel} ${level}`);
        if (z.bins > 1) parts.push(`${z.binLabel} ${bin}`);
        out.push({ code, zone: z.code, name: parts.join(' · '), position: out.length });
      }
    }
  }
  return out;
}

function Stage(template: TemplateResponseType, status: string): OrderStageType {
  const stage = template.orderFlow.find((s) => s.status === status);
  if (!stage) throw BadRequest(`${status} is not a stage of the ${template.name} order flow`);
  return stage;
}

function RoleLabel(template: TemplateResponseType, role: string): string {
  return template.roles.find((r) => r.code === role)?.label ?? role;
}

export const templatesService = { Definition, Get, List, Locations, Stage, RoleLabel };
