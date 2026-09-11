export const siteConfig = {
  name: 'Khidmatik',
  nameAr: 'خدماتك',
  nameFr: 'Khidmatik',
  tagline: 'Your Super App for Algeria | منصة الخدمات الشاملة في الجزائر',
  description:
    'Khidmatik (خدماتك) is Algeria’s premier multi-service platform. Discover verified local stores, artisan craftsmen, home & auto repair services, spare parts, digital freelancers, and banquet halls across all 58 Wilayas.',
  descriptionAr:
    'خدماتك - تطبيقك الشامل في الجزائر. اكتشف المتاجر المحلية، الحرفيين المعتمدين، خدمات الصيانة المنزلية والسيارات، قطع الغيار، المستقلين وقاعات الحفلات عبر 58 ولاية.',
  descriptionFr:
    'Khidmatik - Votre Super App en Algérie. Découvrez les commerces locaux, artisans qualifiés, services de réparation, pièces détachées, freelances et salles des fêtes à travers les 58 wilayas.',
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://khidmatik.dz'),
  ogImage: '/images/og-default.png',
  locale: 'ar_DZ',
  alternateLocales: ['fr_DZ', 'en_US'],
  links: {
    twitter: 'https://twitter.com/khidmatik_dz',
    facebook: 'https://facebook.com/khidmatik.dz',
    instagram: 'https://instagram.com/khidmatik.dz',
    linkedin: 'https://linkedin.com/company/khidmatik',
  },
  contact: {
    email: 'contact@khidmatik.dz',
    supportEmail: 'support@khidmatik.dz',
    phone: '+213 21 00 00 00',
    address: {
      streetAddress: '123 Rue Didouche Mourad',
      addressLocality: 'Alger Centre',
      addressRegion: 'Alger',
      postalCode: '16000',
      addressCountry: 'DZ',
    },
    geo: {
      latitude: 36.7538,
      longitude: 3.0588,
    },
  },
  keywords: [
    'Khidmatik',
    'خدماتك',
    'Algeria services',
    'services Algérie',
    'artisan Algérie',
    'plombier Alger',
    'électricien Alger',
    'pièces détachées Algérie',
    'stores Algérie',
    'marketplace Algérie',
    'salle des fêtes Algérie',
    'قاعات حفلات الجزائر',
    'حرفيين الجزائر',
    'قطع غيار الجزائر',
    'freelance Algérie',
    'Alger',
    'Oran',
    'Constantine',
    'Setif',
    'Annaba',
  ],
};

export type SiteConfig = typeof siteConfig;
