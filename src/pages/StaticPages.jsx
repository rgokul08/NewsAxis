import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ExternalLink, CheckCircle, Mail, Globe, Users, Scale, Lock, FileText } from 'lucide-react';

/* ———————————————————————————————————————————
   Source Attribution & Content Policy Page
   ——————————————————————————————————————————— */
export function SourcesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="pb-6 border-b-2 border-[#111827] dark:border-[#30363d]">
        <span className="text-xs uppercase font-sans-clean font-bold tracking-widest text-[#a91b0d]">
          Transparency & Standards
        </span>
        <h1 className="font-headline text-3xl sm:text-4xl font-black text-[#111827] dark:text-white mt-1">
          Source Attribution & Content Policy
        </h1>
        <p className="text-sm font-body-serif text-[#4b5563] dark:text-[#8b949e] mt-2 leading-relaxed">
          NewsAxis is committed to uncompromising editorial transparency. We clearly differentiate between curated external news dispatches, original editorial reporting, and community-submitted stories.
        </p>
      </div>

      <div className="space-y-6 text-sm font-body-serif text-[#374151] dark:text-[#c9d1d9] leading-relaxed">
        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-[#111827] dark:text-white">
            1. External News Feeds
          </h2>
          <p>
            NewsAxis aggregates headlines, wire dispatches, and excerpts from leading global news intelligence APIs and verified wire feeds:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              { name: 'TheNewsAPI', desc: 'Curated global headlines and regional political & economic reporting' },
              { name: 'GNews', desc: 'Google News structured real-time search & top categorical headlines' },
              { name: 'NewsData.io', desc: 'National, Asian, and regional breaking live news intelligence' },
              { name: 'Mediastack', desc: 'Live global news data across 50+ countries and global wires' },
              { name: 'NewsAPI.org', desc: 'Over 80,000 international and national verified publishers' },
              { name: 'The Hindu & BBC', desc: 'Authoritative national and international newspaper wire dispatches' },
              { name: 'DEV Community & Hashnode', desc: 'Community engineering blogs and technology perspectives' },
              { name: 'TechCrunch & Wired', desc: 'Venture, startup, AI innovations, and science journalism' }
            ].map((src, i) => (
              <div key={i} className="p-3 bg-[#f8f9fa] dark:bg-[#161b22] border border-[#e5e7eb] dark:border-[#30363d] rounded">
                <span className="font-bold text-[#111827] dark:text-white text-xs font-sans-clean block">{src.name}</span>
                <span className="text-[11px] text-[#4b5563] dark:text-[#8b949e] font-sans-clean">{src.desc}</span>
              </div>
            ))}
          </div>
          <ul className="list-disc pl-5 space-y-1 text-[#4b5563] dark:text-[#8b949e] pt-2">
            <li>Original publisher names and direct attribution links are permanently displayed.</li>
            <li>We do not modify the factual meaning of third-party headlines.</li>
            <li>Users are encouraged to read the full investigation at the original publisher's website.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-[#111827] dark:text-white">
            2. Mandatory 72-Hour Community Retention Policy
          </h2>
          <p>
            To prevent spam accumulation, safeguard user privacy, and ensure maximum content freshness, <strong>all community-created articles and blog submissions are strictly retained for a maximum of 72 hours</strong>.
          </p>
          <div className="bg-amber-500/10 border border-amber-500/30 p-4 text-amber-800 dark:text-amber-200 text-xs font-sans-clean">
            Once an article passes its 72-hour ceiling from creation, our automated lifecycle cleanup function permanently purges the article record, comments, reactions, and associated uploaded media from our database and storage buckets.
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-[#111827] dark:text-white">
            3. Editorial Transparency
          </h2>
          <p>
            Articles authored directly by NewsAxis editors are labeled with our verified shield badge. Community stories are explicitly marked as "Community Report" or "Community Blog" so readers are never misled about origin or editorial verification status.
          </p>
        </section>
      </div>
    </div>
  );
}


/* ———————————————————————————————————————————
   Community Guidelines Page
   ——————————————————————————————————————————— */
export function GuidelinesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="pb-6 border-b-2 border-[#111827] dark:border-[#30363d]">
        <h1 className="font-headline text-3xl font-black text-[#111827] dark:text-white">
          Community Guidelines
        </h1>
        <p className="text-sm font-body-serif text-[#4b5563] dark:text-[#8b949e] mt-1">
          Rules for publishing and commenting respectfully across the NewsAxis platform.
        </p>
      </div>

      <div className="space-y-4 text-sm font-body-serif text-[#374151] dark:text-[#c9d1d9] leading-relaxed">
        {[
          { title: 'Authentic Perspectives', desc: 'Share genuine insights, analysis, or personal technical tutorials. Do not publish plagiarized content or impersonate others.' },
          { title: 'Zero Toleration for Harassment or Hate Speech', desc: 'Targeted harassment, discriminatory language, or abusive commentary results in immediate suspension.' },
          { title: '72-Hour Ephemeral Nature', desc: 'Remember that all community stories automatically expire after 72 hours. Save local copies of your writing if you wish to retain it indefinitely.' },
          { title: 'Respectful Discourse', desc: 'Engage with ideas, not individuals. Disagree constructively and support claims with evidence.' },
          { title: 'No Spam or Self-Promotion', desc: 'Posts primarily created for advertising, link farming, or SEO manipulation will be removed.' },
        ].map((rule, i) => (
          <div key={i} className="p-4 bg-[#f8f9fa] dark:bg-[#161b22] border border-[#e5e7eb] dark:border-[#30363d] space-y-2">
            <h3 className="font-sans-clean font-bold text-[#111827] dark:text-white flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              {rule.title}
            </h3>
            <p className="text-xs text-[#4b5563] dark:text-[#8b949e] font-sans-clean">{rule.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}


/* ———————————————————————————————————————————
   About Page
   ——————————————————————————————————————————— */
export function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="pb-6 border-b-2 border-[#111827] dark:border-[#30363d]">
        <span className="text-xs uppercase font-sans-clean font-bold tracking-widest text-[#a91b0d]">
          About Us
        </span>
        <h1 className="font-headline text-3xl sm:text-4xl font-black text-[#111827] dark:text-white mt-1">
          About NewsAxis
        </h1>
      </div>

      <div className="space-y-6 text-sm font-body-serif text-[#374151] dark:text-[#c9d1d9] leading-relaxed">
        <p>
          <strong>NewsAxis</strong> is a next-generation digital media platform that combines real-time news aggregation from 10+ authoritative global sources with an innovative 72-hour community publishing ecosystem.
        </p>
        <p>
          We believe in transparency, source attribution, and providing our readers with a complete picture of what's happening across the world — from breaking geopolitical events to the latest in artificial intelligence and technology.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
          {[
            { icon: Globe, label: '10+ Sources', desc: 'Real-time aggregation from global publishers' },
            { icon: Users, label: 'Community Voices', desc: '72-hour ephemeral community publishing' },
            { icon: ShieldCheck, label: 'Full Attribution', desc: 'Every external article is clearly sourced' },
          ].map(({ icon: Icon, label, desc }, i) => (
            <div key={i} className="p-4 bg-[#f8f9fa] dark:bg-[#161b22] border border-[#e5e7eb] dark:border-[#30363d] text-center">
              <Icon className="w-6 h-6 text-[#a91b0d] mx-auto mb-2" />
              <h3 className="font-sans-clean font-bold text-sm text-[#111827] dark:text-white">{label}</h3>
              <p className="text-xs text-[#4b5563] dark:text-[#8b949e] mt-1 font-sans-clean">{desc}</p>
            </div>
          ))}
        </div>

        <p>
          Our team of editors and contributors work around the clock to ensure that NewsAxis remains your most reliable, unbiased, and comprehensive source of daily news.
        </p>
      </div>
    </div>
  );
}


/* ———————————————————————————————————————————
   Contact Page
   ——————————————————————————————————————————— */
export function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="pb-6 border-b-2 border-[#111827] dark:border-[#30363d]">
        <span className="text-xs uppercase font-sans-clean font-bold tracking-widest text-[#a91b0d]">
          Get in Touch
        </span>
        <h1 className="font-headline text-3xl sm:text-4xl font-black text-[#111827] dark:text-white mt-1">
          Contact Editorial
        </h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 bg-[#f8f9fa] dark:bg-[#161b22] border border-[#e5e7eb] dark:border-[#30363d] space-y-3">
          <Mail className="w-6 h-6 text-[#a91b0d]" />
          <h3 className="font-sans-clean font-bold text-[#111827] dark:text-white">Editorial Desk</h3>
          <p className="text-xs font-sans-clean text-[#4b5563] dark:text-[#8b949e]">For story tips, corrections, and editorial inquiries.</p>
          <a href="mailto:editor@newsaxis.media" className="text-sm font-sans-clean font-bold text-[#a91b0d] hover:underline">editor@newsaxis.media</a>
        </div>
        <div className="p-6 bg-[#f8f9fa] dark:bg-[#161b22] border border-[#e5e7eb] dark:border-[#30363d] space-y-3">
          <Users className="w-6 h-6 text-[#a91b0d]" />
          <h3 className="font-sans-clean font-bold text-[#111827] dark:text-white">Community Support</h3>
          <p className="text-xs font-sans-clean text-[#4b5563] dark:text-[#8b949e]">For account issues, content moderation, and publishing help.</p>
          <a href="mailto:community@newsaxis.media" className="text-sm font-sans-clean font-bold text-[#a91b0d] hover:underline">community@newsaxis.media</a>
        </div>
      </div>
    </div>
  );
}


/* ———————————————————————————————————————————
   Privacy Policy Page
   ——————————————————————————————————————————— */
export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="pb-6 border-b-2 border-[#111827] dark:border-[#30363d]">
        <Lock className="w-6 h-6 text-[#a91b0d] mb-2" />
        <h1 className="font-headline text-3xl font-black text-[#111827] dark:text-white">
          Privacy Policy
        </h1>
        <p className="text-xs font-sans-clean text-[#6b7280] mt-1">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="space-y-6 text-sm font-body-serif text-[#374151] dark:text-[#c9d1d9] leading-relaxed">
        <section>
          <h2 className="font-headline text-lg font-bold text-[#111827] dark:text-white mb-2">Data We Collect</h2>
          <p>We collect minimal data necessary to provide our service: email addresses for account creation, reading preferences for personalization, and basic analytics to improve content delivery.</p>
        </section>
        <section>
          <h2 className="font-headline text-lg font-bold text-[#111827] dark:text-white mb-2">72-Hour Data Lifecycle</h2>
          <p>Community-submitted content and all associated metadata (comments, reactions, view counts) are automatically and permanently deleted after 72 hours. This is enforced at both the application and database levels.</p>
        </section>
        <section>
          <h2 className="font-headline text-lg font-bold text-[#111827] dark:text-white mb-2">Third-Party Services</h2>
          <p>We use Appwrite for authentication and data storage. External news content is fetched from public APIs and RSS feeds. We do not sell or share personal data with advertisers.</p>
        </section>
        <section>
          <h2 className="font-headline text-lg font-bold text-[#111827] dark:text-white mb-2">Your Rights</h2>
          <p>You may request deletion of your account and all associated data at any time by contacting our editorial desk.</p>
        </section>
      </div>
    </div>
  );
}


/* ———————————————————————————————————————————
   Terms of Service Page
   ——————————————————————————————————————————— */
export function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="pb-6 border-b-2 border-[#111827] dark:border-[#30363d]">
        <Scale className="w-6 h-6 text-[#a91b0d] mb-2" />
        <h1 className="font-headline text-3xl font-black text-[#111827] dark:text-white">
          Terms of Service
        </h1>
        <p className="text-xs font-sans-clean text-[#6b7280] mt-1">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
      </div>

      <div className="space-y-6 text-sm font-body-serif text-[#374151] dark:text-[#c9d1d9] leading-relaxed">
        <section>
          <h2 className="font-headline text-lg font-bold text-[#111827] dark:text-white mb-2">Acceptance of Terms</h2>
          <p>By accessing NewsAxis, you agree to these Terms of Service and our Privacy Policy. If you do not agree, please do not use the platform.</p>
        </section>
        <section>
          <h2 className="font-headline text-lg font-bold text-[#111827] dark:text-white mb-2">Content Ownership</h2>
          <p>Community-submitted content remains the intellectual property of its author. By submitting content, you grant NewsAxis a non-exclusive license to display it for the 72-hour retention period. External news content belongs to its respective publishers.</p>
        </section>
        <section>
          <h2 className="font-headline text-lg font-bold text-[#111827] dark:text-white mb-2">Prohibited Content</h2>
          <p>Users may not submit content that is illegal, defamatory, harassing, sexually explicit, or that infringes on intellectual property rights. Violations result in immediate content removal and potential account suspension.</p>
        </section>
        <section>
          <h2 className="font-headline text-lg font-bold text-[#111827] dark:text-white mb-2">Limitation of Liability</h2>
          <p>NewsAxis provides content "as is" without warranties. We are not liable for the accuracy of third-party news content or user-generated material.</p>
        </section>
      </div>
    </div>
  );
}

/* ———————————————————————————————————————————
   404 Not Found Page
   ——————————————————————————————————————————— */
export function NotFoundPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
      <div className="inline-block p-4 rounded-full bg-red-50 dark:bg-red-950/30 text-[#a91b0d] mb-2">
        <FileText className="w-12 h-12 stroke-[1.5]" />
      </div>
      <span className="block text-xs uppercase font-sans-clean font-bold tracking-widest text-[#a91b0d]">
        Error 404 — Edition Notice
      </span>
      <h1 className="font-headline text-3xl sm:text-5xl font-black text-[#111827] dark:text-white">
        Story or Page Not Found
      </h1>
      <p className="font-body-serif text-base text-[#4b5563] dark:text-[#8b949e] max-w-xl mx-auto leading-relaxed">
        The dispatch or page you are looking for has been archived, relocated, or has permanently expired under our <strong>72-Hour Community Retention Policy</strong>.
      </p>
      <div className="pt-4 flex flex-wrap items-center justify-center gap-4 font-sans-clean">
        <Link
          to="/"
          className="px-5 py-2.5 bg-[#a91b0d] hover:bg-[#8e1509] text-white text-xs font-bold uppercase tracking-wider transition-colors"
        >
          Return to Front Page
        </Link>
        <Link
          to="/latest"
          className="px-5 py-2.5 bg-white dark:bg-[#161b22] border border-[#e5e7eb] dark:border-[#30363d] text-[#111827] dark:text-white text-xs font-bold uppercase tracking-wider hover:border-[#a91b0d] transition-colors"
        >
          Browse Latest News
        </Link>
      </div>
    </div>
  );
}
