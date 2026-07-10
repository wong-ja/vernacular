import { useState } from 'react';
import Button from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function OrgSignup() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [desc, setDesc] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center space-y-4">
        <h1 className="text-xl font-bold text-text-primary">Request received</h1>
        <p className="text-sm text-text-secondary">
          Your organization account request has been submitted. Vernacular maintainers
          will review it within 72 hours.
        </p>
        <a href="/">
          <Button variant="secondary">Return home</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <h1 className="text-xl font-bold text-text-primary text-center">Create org account</h1>
      <p className="text-sm text-text-secondary text-center mt-2 mb-8">
        For community organizations serving a specific language community.
        Free and non-commercial.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Organization name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">URL slug</label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="my-org" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Contact email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Describe your organization and the community you serve
          </label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={4}
            className="w-full bg-surface-2 border border-border rounded-md px-[14px] py-[10px] text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none resize-y min-h-[100px]"
            required
          />
        </div>
        <Button type="submit" className="w-full">Submit for review</Button>
        <p className="text-xs text-text-tertiary text-center">
          Accounts are manually reviewed within 72 hours. Vernacular is non-commercial
          — commercial translation agencies are not permitted.
        </p>
      </form>
    </div>
  );
}
