import { useState } from 'react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import { REGIONS, getLanguagesByRegion } from '@vernacular/shared';

interface GlossaryTermRow {
  id: string;
  sourceTerm: string;
  baseModelTerm: string;
  communityTerm: string;
  domain: string;
  usageCount: number;
  flagCount: number;
  isActive: boolean;
}

const mockTerms: GlossaryTermRow[] = [
  { id: '1', sourceTerm: 'blood pressure', baseModelTerm: 'presyon ng dugo', communityTerm: 'presyon sa dugo', domain: 'medical', usageCount: 47, flagCount: 0, isActive: true },
  { id: '2', sourceTerm: 'emergency room', baseModelTerm: 'silid pang-emergency', communityTerm: 'silid aksidente', domain: 'medical', usageCount: 32, flagCount: 1, isActive: true },
  { id: '3', sourceTerm: 'school district', baseModelTerm: 'distrito ng paaralan', communityTerm: 'distrito ng paaralan', domain: 'education', usageCount: 18, flagCount: 0, isActive: true },
  { id: '4', sourceTerm: 'consent form', baseModelTerm: 'porma ng pahintulot', communityTerm: 'pahayag ng pahintulot', domain: 'legal', usageCount: 12, flagCount: 0, isActive: true },
  { id: '5', sourceTerm: 'deductible', baseModelTerm: 'mababawas', communityTerm: 'halagang mababawas', domain: 'medical', usageCount: 8, flagCount: 0, isActive: false },
];

const DOMAINS = ['all', 'medical', 'legal', 'education', 'civic', 'general'];

export default function OrgGlossary() {
  const [domain, setDomain] = useState('all');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);

  const filtered = mockTerms.filter((t) => {
    if (domain !== 'all' && t.domain !== domain) return false;
    if (status === 'active' && !t.isActive) return false;
    if (status === 'inactive' && t.isActive) return false;
    if (search && !t.sourceTerm.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-container mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Glossary</h1>
        <Button onClick={() => setAddOpen(true)}>Add term</Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
        >
          {DOMAINS.map((d) => (
            <option key={d} value={d}>{d === 'all' ? 'All domains' : d.charAt(0).toUpperCase() + d.slice(1)}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="bg-surface-2 border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search terms..."
          className="max-w-xs"
        />
      </div>

      {/* Table */}
      <div className="bg-surface-1 border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-secondary text-xs uppercase tracking-wider">
              <th className="text-left p-4 font-medium">Source term</th>
              <th className="text-left p-4 font-medium">Base model</th>
              <th className="text-left p-4 font-medium">Community term</th>
              <th className="text-left p-4 font-medium">Domain</th>
              <th className="text-center p-4 font-medium">Usage</th>
              <th className="text-center p-4 font-medium">Flags</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-text-tertiary">No terms found.</td>
              </tr>
            )}
            {filtered.map((t) => (
              <tr key={t.id} className={`border-b border-border last:border-b-0 ${t.flagCount > 0 ? 'bg-warning-bg' : ''} ${!t.isActive ? 'opacity-60' : ''}`}>
                <td className="p-4 text-text-primary">{t.sourceTerm}</td>
                <td className="p-4 text-text-secondary">{t.baseModelTerm}</td>
                <td className="p-4 text-text-primary font-medium">{t.communityTerm}</td>
                <td className="p-4">
                  <Badge variant="language">{t.domain}</Badge>
                </td>
                <td className="p-4 text-center text-text-secondary">{t.usageCount}</td>
                <td className="p-4 text-center">
                  {t.flagCount > 0 ? (
                    <span className="text-warning-text font-medium">{t.flagCount}</span>
                  ) : (
                    <span className="text-text-tertiary">0</span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <button className="text-xs text-accent hover:underline cursor-pointer">Edit</button>
                  <button className="text-xs text-text-secondary hover:text-text-primary ml-3 cursor-pointer">
                    {t.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add term">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Source term</label>
            <Input placeholder="e.g. blood pressure" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Domain</label>
            <select className="w-full bg-surface-2 border border-border rounded-md px-[14px] py-[10px] text-sm text-text-primary focus:border-accent focus:outline-none">
              <option>medical</option>
              <option>legal</option>
              <option>education</option>
              <option>civic</option>
              <option>general</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Base model translation</label>
            <Input placeholder="Auto-populated from NLLB-200" className="text-text-tertiary" disabled />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Community translation</label>
            <Input placeholder="Your organization's approved translation" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Notes (optional)</label>
            <Textarea placeholder="Why is this translation preferred?" rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button>Submit for review</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
