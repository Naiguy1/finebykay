import sets from './sets.generated.json' with { type: 'json' };

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
  /** Only sets with an order appear in the curated lookbook. */
  lookbookOrder?: number;
  /** Optional local MP4/WebM shown in the detail view, never autoplayed. */
  video?: string;
}

// Generated from content/sets.yaml. Edit that file, then rebuild.
export const portfolio = sets as readonly PortfolioSet[];

// Every published set stays in the carousel, including sets outside the curated grid.
export const heroSets = portfolio;

export const lookbookSets = portfolio
  .filter((set) => set.lookbookOrder !== undefined)
  .sort((a, b) => a.lookbookOrder! - b.lookbookOrder!);

export const studio = {
  instagram: 'https://instagram.com/finebykay',
  handle: '@finebykay',
  image: portfolio[0].image,
  imageAlt: portfolio[0].alt,
  paragraphs: [
    'I’m Kalisa, the nail artist behind finebykay. I work with natural nails, structured gel, and hand-painted designs.',
    'Have a design in mind? Send me a photo on Instagram so we can talk about your set.',
  ],
};

export const services = [
  { number: '01', title: 'Natural nail care', description: 'Shaping and preparation for your natural nails.', detail: 'Shaping & prep' },
  { number: '02', title: 'Structured gel', description: 'A gel overlay to add support to your natural nails.', detail: 'Gel overlay' },
  { number: '03', title: 'Intricate custom art', description: 'Hand-painted florals, patterns, characters, and custom designs.', detail: 'Hand-painted designs' },
] as const;
