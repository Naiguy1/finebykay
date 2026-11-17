import sets from './sets.generated.json';

export const categories = ['All', 'Natural Nails', 'Structured Gel', 'Intricate Art'] as const;
export type Category = (typeof categories)[number];
export type NailCategory = Exclude<Category, 'All'>;

export interface PortfolioSet {
  id: string;
  title: string;
  description: string;
  category: NailCategory;
  image: string;
  highRes?: string;
  alt: string;
  tags: readonly string[];
  objectPosition?: string;
  /** Optional local MP4/WebM shown in the detail view, never autoplayed. */
  video?: string;
}

// Generated from content/sets.yaml. Edit that file, then rebuild.
export const portfolio = sets as readonly PortfolioSet[];

// Every published lookbook set joins the carousel automatically.
export const heroSets = portfolio;

export const studio = {
  instagram: 'https://instagram.com/finebykay',
  handle: '@finebykay',
  image: portfolio[0].image,
  imageAlt: portfolio[0].alt,
  // Editable placeholder studio narrative. Replace with Kalisa's own introduction.
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
