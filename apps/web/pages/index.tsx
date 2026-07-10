import Button from '../components/ui/Button';

const languages = [
  'Tagalog', '\u5EE3\u6771\u8A71', 'Hmong', 'Espa\u00F1ol',
  '\u666E\u901A\u8BDD', 'Krey\u00F2l', '\u0627\u0644\u0639\u0631\u0628\u064A\u0629',
  '\u65E5\u672C\u8A9E', 'Ti\u1EBFng Vi\u1EC7t', '\u17C1\u17C1\u1798\u17D2\u179C\u17C0\u179B',
  'Haitian Creole', '\uD55C\uAD6D\uC5B4',
];

const steps = [
  {
    icon: '\u2191',
    title: 'Upload or paste',
    desc: 'Text, audio, or video. Common formats accepted.',
  },
  {
    icon: '\u2696\uFE0F',
    title: 'Community glossary applied',
    desc: 'Terminology approved by speakers of your language.',
  },
  {
    icon: '\u2193',
    title: 'Review and download',
    desc: 'Transcript, translation, and captions in seconds to minutes.',
  },
];

const whys = [
  {
    title: 'Privacy by design',
    desc: 'Your audio never leaves our servers. We use open-source models, not Google or OpenAI.',
  },
  {
    title: 'Community-governed',
    desc: 'Language specialists and community organizations maintain the terminology, not engineers.',
  },
  {
    title: 'Honest about limits',
    desc: 'We show you which model processed your content, how confident it was, and where to get human review.',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="max-w-container mx-auto px-6 pt-20 pb-16 text-center">
        <p className="text-sm text-text-secondary uppercase tracking-widest mb-4">
          Free &middot; Open source &middot; Community-governed
        </p>
        <h1 className="text-4xl lg:text-4xl font-bold text-text-primary max-w-3xl mx-auto leading-tight">
          Every voice, understood.
        </h1>
        <p className="text-lg text-text-secondary max-w-[600px] mx-auto mt-4 leading-relaxed">
          Vernacular translates and transcribes community content using open-source models.
          No data sent to Google or OpenAI. Free for everyone.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <a href="/translate">
            <Button size="lg">Translate a document</Button>
          </a>
          <a href="/orgs/signup">
            <Button variant="secondary" size="lg">Create org account</Button>
          </a>
        </div>
        <p className="text-sm text-text-tertiary mt-4">No account required for basic use.</p>
      </section>

      {/* Language coverage bar */}
      <section className="border-y border-border overflow-hidden py-4">
        <p className="text-xs text-text-secondary uppercase tracking-wider text-center mb-3">
          Supporting 12 language pairs in Phase 1, growing with community contributions
        </p>
        <div className="flex gap-8 overflow-x-auto px-6 scrollbar-hide">
          {languages.concat(languages).map((lang, i) => (
            <span key={i} className="text-sm text-text-secondary whitespace-nowrap shrink-0">
              {lang}
            </span>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-container mx-auto px-6 py-16">
        <h2 className="text-xl font-bold text-text-primary text-center mb-10">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="bg-surface-1 border border-border rounded-xl p-6 text-center">
              <span className="text-2xl text-accent">{step.icon}</span>
              <h3 className="text-lg font-semibold text-text-primary mt-4">{step.title}</h3>
              <p className="text-sm text-text-secondary mt-2">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Vernacular */}
      <section className="max-w-container mx-auto px-6 py-16">
        <h2 className="text-xl font-bold text-text-primary text-center mb-10">Why Vernacular</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {whys.map((item, i) => (
            <div key={i} className="bg-surface-1 border border-border rounded-xl p-6">
              <h3 className="text-lg font-semibold text-text-primary">{item.title}</h3>
              <p className="text-sm text-text-secondary mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Community */}
      <section className="max-w-container mx-auto px-6 py-16 text-center border-t border-border">
        <h2 className="text-xl font-bold text-text-primary">Built with communities, not just for them.</h2>
        <p className="text-sm text-text-secondary mt-3 max-w-lg mx-auto">
          Community health clinics, school districts, legal aid organizations, and civic nonprofits
          create and maintain their own glossaries. Terminology stays under community control.
        </p>
        <div className="mt-6">
          <a href="/orgs/signup">
            <Button variant="secondary">Create an org account — it&apos;s free</Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-sm font-semibold text-text-primary">Vernacular</span>
            <nav className="flex gap-6 text-xs text-text-secondary">
              <a href="#" className="hover:text-text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-text-primary transition-colors">Governance</a>
              <a href="#" className="hover:text-text-primary transition-colors">GitHub</a>
              {/* <a href="#" className="hover:text-text-primary transition-colors">Assembly Code</a> */}
            </nav>
          </div>
          <p className="text-xs text-text-tertiary text-center mt-6">
            Built with open-source models. No audio or text is sent to Google, Microsoft, or OpenAI.
          </p>
          <p className="text-xs text-text-tertiary text-center mt-1">
            Some models used are CC-BY-NC 4.0. Vernacular is non-commercial — this is permitted.
          </p>
        </div>
      </footer>
    </div>
  );
}
