import dataSource from '../data-source';
import { WeddingVendorEntity } from '../../modules/planner/entities/wedding-vendor.entity';

// Seeds the real wedding vendor catalog from what used to be hardcoded demo
// content in planner.service.ts, so the marketplace/shortlist/swap/clash
// features have real rows to read from instead of static literals.
const vendors: Partial<WeddingVendorEntity>[] = [
  // Core squad
  { slot: 'Planner', subcategory: 'The Perfect Plan Co.', name: 'Wedding Planner', priceLabel: 'R35,000', priceCents: 3500000, rating: 4.9, reviewCount: 128, imageKey: 'maid-service', isRecommended: true },
  { slot: 'Venue', subcategory: 'Premium Venue', name: 'Luxe Manor', priceLabel: 'R85,000', priceCents: 8500000, rating: 4.8, reviewCount: 96, imageKey: 'home-cleaning', isRecommended: true },
  { slot: 'Photography', subcategory: 'Photo and Video', name: 'Memories by TK', priceLabel: 'R28,000', priceCents: 2800000, rating: 4.9, reviewCount: 201, imageKey: 'appliance-repair', isRecommended: true },
  { slot: 'Catering', subcategory: 'Luxury Catering', name: 'Taste Affair', priceLabel: 'R65,000', priceCents: 6500000, rating: 4.7, reviewCount: 80, imageKey: 'handyman-assist', isRecommended: true },
  { slot: 'Florals', subcategory: 'Floral Designer', name: 'Bloom Room', priceLabel: 'R22,000', priceCents: 2200000, rating: 4.9, reviewCount: 74, imageKey: 'spa-and-massage', isRecommended: true },
  { slot: 'Entertainment', subcategory: 'DJ', name: 'Vibe Creators', priceLabel: 'R15,000', priceCents: 1500000, rating: 4.8, reviewCount: 156, imageKey: 'book-a-mechanic', isRecommended: true },
  // Support squad
  { slot: 'MC', subcategory: 'Ceremony Host', name: 'Master of Ceremonies', priceLabel: 'R6,000', priceCents: 600000, rating: 4.8, reviewCount: 65, imageKey: 'urgent-electrical' },
  { slot: 'Hair and Makeup', subcategory: 'Glam Squad', name: 'Glam Squad', priceLabel: 'R9,000', priceCents: 900000, rating: 4.7, reviewCount: 68, imageKey: 'salon-at-home' },
  { slot: 'Transport', subcategory: 'VIP Transport', name: 'VIP Transport', priceLabel: 'R12,000', priceCents: 1200000, rating: 4.8, reviewCount: 40, imageKey: 'pest-control' },
  { slot: 'Decor', subcategory: 'Decor Elegance', name: 'Decor Elegance', priceLabel: 'R18,000', priceCents: 1800000, rating: 4.6, reviewCount: 47, imageKey: 'deep-cleaning' },
  { slot: 'Tent Supplier', subcategory: 'Weather Backup', name: 'Tent Supplier', priceLabel: 'R18,500', priceCents: 1850000, rating: 4.8, reviewCount: 54, imageKey: 'garden-and-outdoor', tags: ['rain-safe'], isRecommended: true },
  // Shortlist extras
  { slot: 'Tent Supplier', subcategory: 'Clear-span tenting', name: 'Marquee Atelier', priceLabel: 'R24,000', priceCents: 2400000, rating: 4.9, reviewCount: 44, imageKey: 'garden-and-outdoor', tags: ['rain-safe'], isRecommended: true },
  { slot: 'Lighting', subcategory: 'Ambient lighting', name: 'Golden Hour Hire', priceLabel: 'R14,500', priceCents: 1450000, rating: 4.8, reviewCount: 28, imageKey: 'salon-at-home' },
  { slot: 'Stationery', subcategory: 'Menus and signage', name: 'Paper Poetry', priceLabel: 'R8,200', priceCents: 820000, rating: 4.7, reviewCount: 31, imageKey: 'deep-cleaning' },
  // Alternatives (for swap comparisons)
  { slot: 'Planner', subcategory: 'Wedding strategist', name: 'Ivory Route', priceLabel: 'R31,500', priceCents: 3150000, rating: 4.8, reviewCount: 84, imageKey: 'maid-service' },
  { slot: 'Planner', subcategory: 'Ceremony logistics', name: 'House of Vows', priceLabel: 'R37,000', priceCents: 3700000, rating: 4.9, reviewCount: 61, imageKey: 'home-cleaning' },
  { slot: 'Catering', subcategory: 'Luxury plated menu', name: 'Salt and Story', priceLabel: 'R62,000', priceCents: 6200000, rating: 4.8, reviewCount: 66, imageKey: 'handyman-assist' },
];

async function seed() {
  const ds = await dataSource.initialize();
  const repo = ds.getRepository(WeddingVendorEntity);

  const existingCount = await repo.count();
  if (existingCount > 0) {
    console.log(`wedding_vendors already has ${existingCount} rows - skipping seed. Delete rows first if you want to reseed.`);
    await ds.destroy();
    return;
  }

  await repo.save(repo.create(vendors));
  console.log(`Seeded ${vendors.length} wedding vendors.`);
  await ds.destroy();
}

seed().catch((error) => {
  console.error('Failed to seed wedding vendors', error);
  process.exit(1);
});
