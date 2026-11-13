export const categories = ['All', 'Natural Nails', 'Structured Gel', 'Intricate Art'] as const;
export type Category = (typeof categories)[number];
export type NailCategory = Exclude<Category, 'All'>;

export interface PortfolioSet {
  id: string;
  title: string;
  category: NailCategory;
  image: string;
  highRes?: string;
  alt: string;
  tags: readonly string[];
  objectPosition?: string;
  /** Optional local MP4/WebM shown in the detail view, never autoplayed. */
  video?: string;
}

// Sample concepts using generated imagery, not photographs of Kay's client work.
// Replace image paths + metadata here when adding original work to public/media/.
export const portfolio: readonly PortfolioSet[] = [
  { id: 'petal-study', title: 'A study in petals', category: 'Intricate Art', image: '/media/rose.webp', alt: 'Sheer blush almond nails with a tiny burgundy botanical accent on ivory silk', tags: ['Hand-painted botanical', 'Sheer blush'], objectPosition: '50% 50%' },
  { id: 'after-hours', title: 'After hours', category: 'Structured Gel', image: '/media/wine.webp', alt: 'Glossy oxblood almond nails and a fine gold ring against warm linen', tags: ['Structured gel', 'Almond shape'], objectPosition: '50% 50%' },
  { id: 'soft-light', title: 'Soft light', category: 'Natural Nails', image: '/media/pearl.webp', alt: 'Short oval pearl nails with delicate French tips beside a cream ceramic bowl', tags: ['Natural nail care', 'Pearl glaze'], objectPosition: '50% 50%' },
  { id: 'linen-notes', title: 'Linen notes', category: 'Natural Nails', image: '/media/rose.webp', alt: 'Detail of a sheer pink manicure resting on textured ivory silk', tags: ['Clean preparation', 'Sheer finish'], objectPosition: '35% 65%' },
  { id: 'merlot-muse', title: 'Merlot muse', category: 'Intricate Art', image: '/media/wine.webp', alt: 'Close detail of a rich burgundy manicure on warm linen', tags: ['Custom color', 'Gloss finish'], objectPosition: '60% 60%' },
  { id: 'pearl-ritual', title: 'The pearl ritual', category: 'Structured Gel', image: '/media/pearl.webp', alt: 'Glazed ivory structured nails against a sculptural ceramic surface', tags: ['Structured gel', 'Fine French'], objectPosition: '65% 45%' },
];

export const heroSets = [portfolio[1], portfolio[2], portfolio[0], portfolio[1], portfolio[2]];

export const studio = {
  instagram: 'https://instagram.com/finebykay',
  handle: '@finebykay',
  image: '/media/studio.webp',
  // Editable placeholder studio narrative. Replace with Kay's own introduction.
  paragraphs: [
    'I believe getting your nails done should feel like taking a breath. A little time set aside, a thoughtful conversation, and something beautiful to carry into your everyday.',
    'My approach starts with healthy natural nails and careful, clean preparation. From a barely-there finish to a tiny hand-painted world, every set is considered, personal, and made slowly — just for you.',
  ],
};

export const services = [
  { number: '01', title: 'Natural nail care', description: 'Thoughtful shaping, meticulous prep, and a soft finish. A quiet reset for your natural nails.', detail: 'Care comes first' },
  { number: '02', title: 'Structured gel', description: 'A little strength, beautifully balanced. A tailored gel overlay to support your natural length.', detail: 'Strength, softly' },
  { number: '03', title: 'Intricate custom art', description: 'Botanical details, considered color, and tiny worlds painted by hand. Your ideas, in miniature.', detail: 'Small-scale expression' },
] as const;
