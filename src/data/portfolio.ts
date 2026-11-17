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

// Kalisa's original work. Preserve these images when adding new sets.
export const portfolio: readonly PortfolioSet[] = [
  {
    id: 'teal-black-filigree',
    title: 'Butterfly wing tips',
    category: 'Intricate Art',
    image: '/media/01_Teal_Black_Filigree.jpg',
    alt: 'Teal butterfly wing patterns outlined with white dots, paired with glossy black French tips.',
    tags: ['Butterfly wing art', 'Black French tips'],
  },
  {
    id: 'black-gold-plaid',
    title: 'Caramel plaid',
    category: 'Intricate Art',
    image: '/media/02_Black_Gold_Plaid.jpg',
    alt: 'Caramel brown and glossy black nails with white plaid accents crossed by fine gold lines.',
    tags: ['Plaid detail', 'Gold accents'],
  },
  {
    id: 'pink-floral',
    title: 'Pink bows and stars',
    category: 'Intricate Art',
    image: '/media/04_Pink_Floral.jpg',
    alt: 'Pink and white nails with painted bows, delicate starbursts, dotted details, and swirl accents.',
    tags: ['Bow art', 'Pink and white'],
  },
  {
    id: 'neutral-bow',
    title: 'Neutral patchwork bows',
    category: 'Intricate Art',
    image: '/media/05_Neutral_Bow_Art.jpg',
    alt: 'Almond nails in beige, taupe, and sage with patchwork florals, checks, dots, hearts, and brown bow details.',
    tags: ['Bow art', 'Patchwork patterns'],
  },
  {
    id: 'cobalt-white',
    title: 'Cobalt mix and match',
    category: 'Intricate Art',
    image: '/media/06_Cobalt_White_Art.jpg',
    alt: 'Cobalt blue and white nails with bows, plaid, stars, floral shapes, and abstract accents.',
    tags: ['Cobalt', 'Mix-and-match art'],
  },
  {
    id: 'red-white-hearts',
    title: 'Valentine red tips',
    category: 'Intricate Art',
    image: '/media/07_Red_White_Hearts.jpg',
    alt: 'Sheer nails with red and white French tips, tiny hearts, bows, lace-like borders, and “xoxo” lettering.',
    tags: ['Valentine details', 'Red French tips'],
  },
  {
    id: 'strawberry-floral',
    title: 'Strawberry florals',
    category: 'Intricate Art',
    image: '/media/08_Pink_Strawberry_Floral.jpg',
    alt: 'Pink strawberry and floral nail art',
    tags: ['Strawberry art', 'Floral detail'],
  },
  {
    id: 'red-blue-botanical',
    title: 'Cherry gingham mix',
    category: 'Intricate Art',
    image: '/media/09_Red_Blue_Botanical.jpg',
    alt: 'Sheer nails with red daisies and cherries, blue gingham checks, and playful red, white, and blue accents.',
    tags: ['Cherry art', 'Blue gingham'],
  },
  {
    id: 'aqua-french-tips',
    title: 'Wavy aqua French tips',
    category: 'Natural Nails',
    image: '/media/10_Aqua_French_Tips.jpg',
    alt: 'Sheer pink almond nails with wavy French tips alternating between aqua green and pale blue.',
    tags: ['Wavy French tips', 'Aqua and blue'],
  },
  {
    id: 'gold-fleck',
    title: 'Gold foil and shimmer',
    category: 'Intricate Art',
    image: '/media/11_Gold_Fleck_Art.jpg',
    alt: 'Champagne gold shimmer nails with sheer accent nails decorated in flowing gold foil.',
    tags: ['Gold foil', 'Shimmer'],
  },
  {
    id: 'jewel-tones',
    title: 'Jewel tones',
    category: 'Intricate Art',
    image: '/media/12_Jewel_Tone_Art.jpg',
    alt: 'Jewel tone nail art',
    tags: ['Jewel tones', 'Custom art'],
  },
  {
    id: 'warm-soft-light',
    title: 'Spider-Man web art',
    category: 'Intricate Art',
    image: '/media/Luxury%20manicure%20in%20warm%20soft%20light-2.jpg',
    alt: 'Red and blue nails with black character art and white web patterns inspired by Spider-Man.',
    tags: ['Comic-inspired art', 'Web details'],
  },
  {
    id: 'warm-backdrop',
    title: 'Mixed pattern manicure',
    category: 'Intricate Art',
    image: '/media/Luxury%20nail%20art%20on%20a%20warm%20backdrop-3.jpg',
    alt: 'Blush and sage nails featuring bows, botanical motifs, plaid, stripes, and dotted French tips.',
    tags: ['Mix-and-match art', 'Plaid and stripes'],
  },
  {
    id: 'warm-surface',
    title: 'Planetarium nails',
    category: 'Intricate Art',
    image: '/media/Luxury%20nail%20art%20on%20a%20warm%20surface-1.jpg',
    alt: 'Black nails with white dots and colorful hand-painted planets across the tips.',
    tags: ['Space art', 'Planet details'],
  },
];

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
