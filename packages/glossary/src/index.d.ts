export interface GlossaryTerm {
    id: string;
    orgId: string;
    sourceLang: string;
    targetLang: string;
    domain: string;
    sourceTerm: string;
    targetTerm: string;
    baseModelTerm: string;
    notes: string | null;
    approvedBy: string;
    approvedAt: Date;
    usageCount: number;
    isActive: boolean;
}
export interface GlossaryOverride {
    sourceTerm: string;
    baseModelTerm: string;
    overrideTerm: string;
    glossaryId: string;
    domain: string;
}
export interface ApplyOverridesResult {
    result: string;
    overrides: GlossaryOverride[];
}
export declare function applyGlossaryOverrides(baseTranslation: string, terms: GlossaryTerm[], sourceLang: string, targetLang: string, domain: string): ApplyOverridesResult;
export declare function getApplicableTerms(allTerms: GlossaryTerm[], sourceLang: string, targetLang: string, domain: string): GlossaryTerm[];
//# sourceMappingURL=index.d.ts.map