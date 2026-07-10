// packages/glossary/src/index.ts
// Deterministic glossary override logic. No ML — pure TypeScript string matching.
// Applied after base translation, before returning results to the user.

export interface GlossaryTerm {
  id: string;
  sourceLang: string;
  targetLang: string;
  domain: string;
  sourceTerm: string;
  targetTerm: string;
  baseModelTerm: string;
  notes: string | null;
}

export interface GlossaryOverride {
  sourceTerm: string;
  baseModelTerm: string;
  overrideTerm: string;
  glossaryId: string;
  domain: string;
}

export interface ApplyOverridesInput {
  text: string;
  terms: GlossaryTerm[];
  sourceLang: string;
  targetLang: string;
}

export interface ApplyOverridesResult {
  result: string;
  overrides: GlossaryOverride[];
}

export function applyGlossaryOverrides(input: ApplyOverridesInput): ApplyOverridesResult {
  const { text, terms } = input;
  const overrides: GlossaryOverride[] = [];
  let result = text;

  const sorted = [...terms].sort((a, b) => b.sourceTerm.length - a.sourceTerm.length);

  for (const term of sorted) {
    const escaped = term.sourceTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    let match: RegExpExecArray | null;
    const found: Array<{ index: number; match: string }> = [];

    const re = new RegExp(escaped, 'gi');
    while ((match = re.exec(result)) !== null) {
      found.push({ index: match.index, match: match[0] });
    }

    if (found.length > 0) {
      overrides.push({
        sourceTerm: term.sourceTerm,
        baseModelTerm: term.baseModelTerm,
        overrideTerm: term.targetTerm,
        glossaryId: term.id,
        domain: term.domain,
      });
      result = result.replace(regex, term.targetTerm);
    }
  }

  return { result, overrides };
}
