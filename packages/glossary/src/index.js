// packages/glossary/src/index.ts
// Deterministic glossary override logic. No ML, no async, no side effects.
// Applied after base translation, before returning results to the user.
export function applyGlossaryOverrides(baseTranslation, terms, sourceLang, targetLang, domain) {
    const applicable = getApplicableTerms(terms, sourceLang, targetLang, domain);
    const overrides = [];
    let result = baseTranslation;
    for (const term of applicable) {
        const searchPattern = term.baseModelTerm;
        const escaped = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'gi');
        const replaced = result.replace(regex, term.targetTerm);
        if (replaced !== result) {
            overrides.push({
                sourceTerm: term.sourceTerm,
                baseModelTerm: term.baseModelTerm,
                overrideTerm: term.targetTerm,
                glossaryId: term.id,
                domain: term.domain,
            });
            result = replaced;
        }
    }
    return { result, overrides };
}
export function getApplicableTerms(allTerms, sourceLang, targetLang, domain) {
    const filtered = allTerms.filter((t) => t.isActive &&
        t.sourceLang === sourceLang &&
        t.targetLang === targetLang &&
        (t.domain === domain || t.domain === 'general'));
    // Group by sourceTerm to apply domain-specific preference
    const grouped = new Map();
    for (const term of filtered) {
        const key = term.sourceTerm.toLowerCase();
        if (!grouped.has(key))
            grouped.set(key, []);
        grouped.get(key).push(term);
    }
    const resolved = [];
    for (const [, group] of grouped) {
        if (group.length === 1) {
            resolved.push(group[0]);
        }
        else {
            const domainMatch = group.find((t) => t.domain === domain);
            if (domainMatch) {
                resolved.push(domainMatch);
            }
            else {
                resolved.push(group[0]);
            }
        }
    }
    // Sort by baseModelTerm length descending (longest first) to prevent partial matches
    resolved.sort((a, b) => b.baseModelTerm.length - a.baseModelTerm.length);
    return resolved;
}
//# sourceMappingURL=index.js.map