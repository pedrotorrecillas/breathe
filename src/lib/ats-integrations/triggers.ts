import type {
  ATSSyncEvent,
  ATSTriggerAction,
  ATSTriggerRule,
} from "@/domain/ats-integrations/types";

export type ATSTriggerMatch = {
  ruleId: string;
  actions: ATSTriggerAction[];
  requiresRecruiterApproval: boolean;
};

export function evaluateATSTriggerRules(input: {
  rules: ATSTriggerRule[];
  event: ATSSyncEvent;
}): ATSTriggerMatch[] {
  return input.rules
    .filter((rule) => {
      if (!rule.enabled) {
        return false;
      }

      if (rule.companyId !== input.event.companyId) {
        return false;
      }

      if (rule.connectionId !== input.event.connectionId) {
        return false;
      }

      if (rule.provider !== input.event.provider) {
        return false;
      }

      if (rule.externalStageId !== input.event.externalStageId) {
        return false;
      }

      if (rule.externalJobId && rule.externalJobId !== input.event.externalJobId) {
        return false;
      }

      return true;
    })
    .map((rule) => ({
      ruleId: rule.id,
      actions: rule.actions,
      requiresRecruiterApproval: rule.requiresRecruiterApproval,
    }));
}
