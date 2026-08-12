import type { Metadata } from 'next';
import CardClient from '@/components/CardClient';
import CursorBrackets from '@/components/CursorBrackets';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Ghassan Adil — Founder, Corehold',
  description:
    'Direct line to Ghassan Adil, founder of Corehold — the intelligent systems studio in Dubai. Call, WhatsApp, email, or save the contact in one tap.',
  alternates: { canonical: '/card' },
  openGraph: {
    title: 'Ghassan Adil — Founder, Corehold',
    description: 'Own the system your business runs on. Direct line to the founder.',
    url: `${SITE_URL}/card`,
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
};

const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Ghassan Adil',
  jobTitle: 'Founder',
  worksFor: { '@type': 'Organization', name: 'Corehold', url: SITE_URL },
  telephone: '+971503953988',
  email: 'audit@corehold.systems',
  url: `${SITE_URL}/card`,
  address: { '@type': 'PostalAddress', addressLocality: 'Dubai', addressCountry: 'AE' },
  sameAs: [
    'https://www.linkedin.com/company/corehold/',
    'https://x.com/coreholdsystems',
  ],
};

export default function CardPage() {
  return (
    <>
      <CardClient />
      <CursorBrackets />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
      />
    </>
  );
}
