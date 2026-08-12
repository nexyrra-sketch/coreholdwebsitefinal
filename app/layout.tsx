import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/space-grotesk';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './globals.css';
import { SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: [
    'intelligent systems studio Dubai',
    'business automation UAE',
    'AI agents for business',
    'custom software Dubai',
    'own your software',
    'systems ownership',
    'conversational AI UAE',
    'business process automation Dubai',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Corehold — two brackets holding a solid core. Own the system your business runs on.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/og.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0b0b09',
  colorScheme: 'dark',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/corehold-mark.svg`,
  image: `${SITE_URL}/og.png`,
  description: SITE_DESCRIPTION,
  slogan: 'Own the system your business runs on. Stop renting it.',
  telephone: '+971503953988',
  founder: { '@type': 'Person', name: 'Ghassan Adil', jobTitle: 'Founder' },
  email: 'audit@corehold.systems',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+971-50-395-3988',
    contactType: 'sales',
    areaServed: 'AE',
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Dubai',
    addressCountry: 'AE',
  },
  areaServed: ['AE', 'Worldwide'],
  knowsAbout: [
    'Business automation',
    'AI agents',
    'Custom software platforms',
    'Conversational AI',
    'Systems integration',
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
