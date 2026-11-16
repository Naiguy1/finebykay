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

// This is Kalisa's original work, these images should not me overwritten.
export const portfolio: readonly PortfolioSet[] = [
  {
    id: 'teal-black-filigree',
    title: 'Teal filigree',
    category: 'Intricate Art',
    image: '/media/01_Teal_Black_Filigree.jpg',
    alt: 'Teal and black filigree nail art',
    tags: ['Hand-painted art', 'Teal'],
  },
  {
    id: 'black-gold-plaid',
    title: 'Black and gold plaid',
    category: 'Intricate Art',
    image: '/media/02_Black_Gold_Plaid.jpg',
    alt: 'Black and gold plaid nail art',
    tags: ['Plaid detail', 'Gold accents'],
  },
  {
    id: 'pink-floral',
    title: 'Pink floral',
    category: 'Intricate Art',
    image: '/media/04_Pink_Floral.jpg',
    alt: 'Pink floral nail art',
    tags: ['Floral art', 'Pink'],
  },
  {
    id: 'neutral-bow',
    title: 'Neutral bow',
    category: 'Intricate Art',
    image: '/media/05_Neutral_Bow_Art.jpg',
    alt: 'Neutral nail art with bow details',
    tags: ['Bow art', 'Neutral tones'],
  },
  {
    id: 'cobalt-white',
    title: 'Cobalt and white',
    category: 'Intricate Art',
    image: '/media/06_Cobalt_White_Art.jpg',
    alt: 'Cobalt blue and white nail art',
    tags: ['Cobalt', 'Hand-painted art'],
  },
  {
    id: 'red-white-hearts',
    title: 'Red hearts',
    category: 'Intricate Art',
    image: '/media/07_Red_White_Hearts.jpg',
    alt: 'Red and white heart nail art',
    tags: ['Heart details', 'Red'],
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
    title: 'Red and blue botanicals',
    category: 'Intricate Art',
    image: '/media/09_Red_Blue_Botanical.jpg',
    alt: 'Red and blue botanical nail art',
    tags: ['Botanical art', 'Colorful'],
  },
  {
    id: 'aqua-french-tips',
    title: 'Aqua French tips',
    category: 'Natural Nails',
    image: '/media/10_Aqua_French_Tips.jpg',
    alt: 'Aqua French tip manicure',
    tags: ['French tips', 'Aqua'],
  },
  {
    id: 'gold-fleck',
    title: 'Gold flecks',
    category: 'Intricate Art',
    image: '/media/11_Gold_Fleck_Art.jpg',
    alt: 'Nail art with gold fleck details',
    tags: ['Gold accents', 'Fine detail'],
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
    title: 'Soft light',
    category: 'Natural Nails',
    image: '/media/Luxury%20manicure%20in%20warm%20soft%20light-2.jpg',
    alt: 'Manicure photographed in warm, soft light',
    tags: ['Soft tones', 'Natural finish'],
  },
  {
    id: 'warm-backdrop',
    title: 'Warm backdrop',
    category: 'Structured Gel',
    image: '/media/Luxury%20nail%20art%20on%20a%20warm%20backdrop-3.jpg',
    alt: 'Nail art photographed against a warm backdrop',
    tags: ['Nail art', 'Warm tones'],
  },
  {
    id: 'warm-surface',
    title: 'Warm surface',
    category: 'Natural Nails',
    image: '/media/Luxury%20nail%20art%20on%20a%20warm%20surface-1.jpg',
    alt: 'Nail art photographed on a warm surface',
    tags: ['Nail art', 'Soft light'],
  },
];

export const heroSets = [portfolio[1], portfolio[2], portfolio[0], portfolio[1], portfolio[2]];

export const studio = {
  instagram: 'https://instagram.com/finebykay',
  handle: '@finebykay',
  image: '/media/studio.webp',
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
