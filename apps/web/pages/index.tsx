import Button from '../components/ui/Button';

const languages = [
  'Tagalog', '\u5EE3\u6771\u8A71', 'Hmong', 'Espa\u00F1ol',
  '\u666E\u901A\u8BDD', 'Krey\u00F2l', '\u0627\u0644\u0639\u0631\u0628\u064A\u0629',
  '\u65E5\u672C\u8A9E', 'Ti\u1EBFng Vi\u1EC7t', '\u17C1\u17C1\u1798\u17D2\u179C\u17C0\u179B',
  'Haitian Creole', '\uD55C\uAD6D\uC5B4',
];

const steps = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
    title: 'Upload or paste',
    desc: 'Text, audio, or video. Common formats accepted.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Community glossary applied',
    desc: 'Terminology approved by speakers of your language.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    title: 'Review and download',
    desc: 'Transcript, translation, and captions in seconds to minutes.',
  },
];

const whys = [
  {
    title: 'Privacy by design',
    desc: 'Your audio never leaves our servers. We use open-source models, not Google or OpenAI.',
    accent: 'border-brand-water-leaf',
  },
  {
    title: 'Community-governed',
    desc: 'Language specialists and community organizations maintain the terminology, not engineers.',
    accent: 'border-brand-periwinkle',
  },
  {
    title: 'Honest about limits',
    desc: 'We show you which model processed your content, how confident it was, and where to get human review.',
    accent: 'border-brand-rose-bud',
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
        <h1 className="font-heading text-4xl font-bold text-brand-mardi-gras dark:text-text-primary max-w-3xl mx-auto leading-tight">
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

      {/* Language coverage bar — marquee */}
      <section className="border-y border-border py-4">
        <p className="text-xs text-text-secondary uppercase tracking-wider text-center mb-3">
          Supporting 12 language pairs in Phase 1, growing with community contributions
        </p>
        <div className="marquee-wrapper">
          <div className="marquee-track">
            {languages.concat(languages).map((lang, i) => (
              <span key={i} className="px-6 text-sm text-text-secondary whitespace-nowrap">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-container mx-auto px-6 py-16">
        <h2 className="font-heading text-2xl font-semibold text-text-primary text-center mb-3">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="bg-surface-1 border border-border rounded-xl px-6 py-8 text-center">
              <span className="w-14 h-14 flex items-center justify-center rounded-full bg-accent-subtle text-accent mx-auto mb-5">
                {step.icon}
              </span>
              <h3 className="font-heading text-lg font-semibold text-text-primary mb-2">{step.title}</h3>
              <p className="text-base text-text-secondary">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Vernacular */}
      <section className="max-w-container mx-auto px-6 py-16">
        <h2 className="font-heading text-2xl font-semibold text-text-primary text-center mb-3">Why Vernacular</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {whys.map((item, i) => (
            <div key={i} className={`bg-surface-1 border border-border border-l-[3px] ${item.accent} accent-card-left p-6`}>
              <h3 className="font-heading text-lg font-semibold text-text-primary">{item.title}</h3>
              <p className="text-base text-text-secondary mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Built with communities — Picasso yellow */}
      <section className="bg-brand-picasso dark:bg-[#1A1A08] px-6 py-20 text-center">
        <div className="max-w-container mx-auto">
          <h2 className="font-heading text-2xl font-semibold text-brand-mardi-gras dark:text-text-primary">Built with communities, not just for them.</h2>
          <p className="text-base text-brand-mardi-gras dark:text-text-secondary mt-3 max-w-lg mx-auto">
            Community health clinics, school districts, legal aid organizations, and civic nonprofits
            create and maintain their own glossaries. Terminology stays under community control.
          </p>
          <div className="mt-6">
            <a href="/orgs/signup">
              <Button variant="secondary" size="lg" className="border-brand-mardi-gras text-brand-mardi-gras dark:border-text-secondary dark:text-text-secondary">
                Create an org account &mdash; it&apos;s free
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer — Forest green always-dark */}
      <footer className="bg-brand-forest px-6 py-12 pb-8">
        <div className="max-w-container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="font-heading text-lg font-semibold text-[#F0EDE6]">Vernacular</span>
            <nav className="flex gap-6 text-sm" style={{ color: 'rgba(240, 237, 230, 0.7)' }}>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Governance</a>
              <a href="#" className="hover:text-white transition-colors">GitHub</a>
            </nav>
          </div>
          <p className="text-sm text-center mt-6" style={{ color: 'rgba(240, 237, 230, 0.5)' }}>
            Built with open-source models. No audio or text is sent to Google, Microsoft, or OpenAI.
          </p>
          <p className="text-sm text-center mt-1" style={{ color: 'rgba(240, 237, 230, 0.5)' }}>
            Some models used are CC-BY-NC 4.0. Vernacular is non-commercial — this is permitted.
          </p>
        </div>
      </footer>
    </div>
  );
}
