import { Injectable } from '@nestjs/common';

export type PlannerEventType = 'wedding' | 'lobola' | 'funeral' | 'corporate' | 'birthday';
export type PlannerPersona = 'client' | 'supplier' | 'coach' | 'admin';

type PlannerVendorStatus = 'secured' | 'booked' | 'optional' | 'recommended' | 'at_risk';

type PlannerVendor = {
  id: string;
  slot: string;
  subcategory: string;
  name: string;
  rating: number;
  reviewCount: number;
  priceLabel: string;
  score: number;
  status: PlannerVendorStatus;
  imageKey: string;
};

type PlannerBoard = {
  title: string;
  budgetTotal: number;
  budgetAllocated: number;
  compatibilityScore: number;
  labourProgress: string;
  timelineStatus: 'On Track' | 'Behind' | 'At Risk';
  intro: string;
  strapline: string;
  weather: {
    label: string;
    temperature: string;
    rainChance: number;
    alert: string;
  };
  coach: {
    name: string;
    role: string;
    rating: number;
    eventsCompleted: number;
  };
  core: PlannerVendor[];
  support: PlannerVendor[];
};

export type PlannerWeatherDay = {
  date: string;
  dayAbbr: string;
  condition: string;
  iconKey: 'sun' | 'cloud' | 'rain' | 'storm';
  tempC: number;
  rainChancePct: number;
  isEventDay: boolean;
};

export type PlannerWeatherAlert = {
  type: 'rain' | 'heat' | 'wind';
  title: string;
  recommendation: string;
  ctaLabel: string;
  browseCategory: string;
};

export type SupplierBrowseItem = {
  id: string;
  slot: string;
  name: string;
  subcategory: string;
  priceLabel: string;
  rating: number;
  reviewCount: number;
  score: number;
  status: PlannerVendorStatus;
  imageKey: string;
  compatibilityNote: string;
};

export type BudgetLineItem = {
  id: string;
  label: string;
  owner: string;
  amount: number;
  status: 'paid' | 'booked' | 'quote' | 'pending';
  dueLabel: string;
};

export type InspirationBoardItem = {
  id: string;
  title: string;
  theme: string;
  note: string;
  matchedSupplierIds: string[];
};

export type MarketplaceFeature = {
  id: string;
  title: string;
  category: string;
  location: string;
  description: string;
  priceHint: string;
};

export type MessageEntry = {
  id: string;
  sender: 'coach' | 'supplier' | 'client';
  senderName: string;
  text: string;
  timestamp: string;
};

export type MessageThread = {
  id: string;
  vendorId: string;
  vendorName: string;
  slot: string;
  unreadCount: number;
  lastMessage: string;
  updatedAt: string;
  messages: MessageEntry[];
};

export type ClashCandidate = {
  currentVendorId: string;
  challengerVendorId: string;
  summary: string;
  winnerVendorId: string;
  communityChoicePct: number;
  comparison: Array<{ label: string; current: string; challenger: string }>;
};

export type PlannerCoachProfile = {
  name: string;
  role: string;
  rating: number;
  eventsCompleted: number;
  bio: string;
  specialties: string[];
  nextAvailable: string;
};

export type PlannerSurface = {
  locationLabel: string;
  unreadCount: number;
  weather: {
    forecast: PlannerWeatherDay[];
    shouldAlert: boolean;
    alert?: PlannerWeatherAlert;
  };
  coachProfile: PlannerCoachProfile;
  suppliers: {
    shortlist: SupplierBrowseItem[];
    browseCategories: Array<{ key: string; label: string; description: string }>;
  };
  budget: {
    total: number;
    allocated: number;
    lines: BudgetLineItem[];
  };
  inspiration: {
    boards: InspirationBoardItem[];
    insight: string;
  };
  marketplace: {
    featured: MarketplaceFeature[];
  };
  messages: {
    threads: MessageThread[];
  };
  swapOptions: Record<string, SupplierBrowseItem[]>;
  clashCandidates: ClashCandidate[];
  autoPick: {
    core: PlannerVendor[];
    support: PlannerVendor[];
  };
};

@Injectable()
export class PlannerService {
  private readonly onboardingSteps = [
    {
      id: 'event_type',
      title: 'Choose event type',
      description: 'Tell us what you are planning so STITCHD can configure the right squad positions.',
    },
    {
      id: 'event_details',
      title: 'Event details',
      description: 'Add the date, location, and guest count so we can plan accurately.',
    },
    {
      id: 'style_theme',
      title: 'Style and theme',
      description: 'Capture the visual direction and colour palette that will shape the vendor shortlist.',
    },
    {
      id: 'priorities',
      title: 'Your priorities',
      description: 'Tell us what matters most so the planning engine can rank trade-offs properly.',
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Set the budget band, planning support, and preferred communication channel.',
    },
    {
      id: 'ready',
      title: 'You are ready',
      description: 'STITCHD can now assemble the first version of your squad and coach plan.',
    },
  ];

  private readonly personas = [
    {
      id: 'admin',
      label: 'Admin',
      app: 'Admin web app',
      summary: 'Oversees compliance, providers, payouts, and platform settings.',
    },
    {
      id: 'client',
      label: 'Client',
      app: 'Client planner app',
      summary: 'Builds the squad, sets priorities, manages budget, and tracks planning progress.',
    },
    {
      id: 'supplier',
      label: 'Supplier',
      app: 'Supplier operations app',
      summary: 'Reviews bookings, availability, documents, and payment updates.',
    },
    {
      id: 'coach',
      label: 'Coach',
      app: 'Coach coordination app',
      summary: 'Coordinates timelines, supplier chemistry, and client readiness across events.',
    },
  ] as const;

  private readonly boards: Record<PlannerEventType, PlannerBoard> = {
    wedding: {
      title: 'Merc and Lelo Wedding Weekend',
      budgetTotal: 400000,
      budgetAllocated: 320000,
      compatibilityScore: 82,
      labourProgress: '28/33',
      timelineStatus: 'Behind',
      intro: 'Build the full wedding squad, watch compatibility, and keep every vendor aligned to one timeline.',
      strapline: 'Luxury ceremony planning with supplier chemistry and weather-aware backup logic.',
      weather: {
        label: 'Partly Cloudy',
        temperature: '23°',
        rainChance: 65,
        alert: 'We recommend adding a tent supplier to protect the aisle and reception layout.',
      },
      coach: { name: 'Muzi Clo', role: 'Lead Planner and Strategist', rating: 4.9, eventsCompleted: 127 },
      core: [
        { id: 'planner', slot: 'Planner', subcategory: 'The Perfect Plan Co.', name: 'Wedding Planner', rating: 4.9, reviewCount: 128, priceLabel: 'R35,000', score: 92, status: 'secured', imageKey: 'maid-service' },
        { id: 'venue', slot: 'Venue', subcategory: 'Premium Venue', name: 'Luxe Manor', rating: 4.8, reviewCount: 96, priceLabel: 'R85,000', score: 90, status: 'secured', imageKey: 'home-cleaning' },
        { id: 'photo', slot: 'Photography', subcategory: 'Photo and Video', name: 'Memories by TK', rating: 4.9, reviewCount: 201, priceLabel: 'R28,000', score: 89, status: 'secured', imageKey: 'appliance-repair' },
        { id: 'catering', slot: 'Catering', subcategory: 'Luxury Catering', name: 'Taste Affair', rating: 4.7, reviewCount: 80, priceLabel: 'R65,000', score: 88, status: 'secured', imageKey: 'handyman-assist' },
        { id: 'florals', slot: 'Florals', subcategory: 'Floral Designer', name: 'Bloom Room', rating: 4.9, reviewCount: 74, priceLabel: 'R22,000', score: 87, status: 'secured', imageKey: 'spa-and-massage' },
        { id: 'entertainment', slot: 'Entertainment', subcategory: 'DJ', name: 'Vibe Creators', rating: 4.8, reviewCount: 156, priceLabel: 'R15,000', score: 85, status: 'booked', imageKey: 'book-a-mechanic' },
      ],
      support: [
        { id: 'mc', slot: 'MC', subcategory: 'Ceremony Host', name: 'Master of Ceremonies', rating: 4.8, reviewCount: 65, priceLabel: 'R6,000', score: 84, status: 'optional', imageKey: 'urgent-electrical' },
        { id: 'hair', slot: 'Hair and Makeup', subcategory: 'Glam Squad', name: 'Glam Squad', rating: 4.7, reviewCount: 68, priceLabel: 'R9,000', score: 83, status: 'optional', imageKey: 'salon-at-home' },
        { id: 'transport', slot: 'Transport', subcategory: 'VIP Transport', name: 'VIP Transport', rating: 4.8, reviewCount: 40, priceLabel: 'R12,000', score: 82, status: 'optional', imageKey: 'pest-control' },
        { id: 'decor', slot: 'Decor', subcategory: 'Decor Elegance', name: 'Decor Elegance', rating: 4.6, reviewCount: 47, priceLabel: 'R18,000', score: 80, status: 'optional', imageKey: 'deep-cleaning' },
        { id: 'tent', slot: 'Tent Supplier', subcategory: 'Weather Backup', name: 'Tent Supplier', rating: 4.8, reviewCount: 54, priceLabel: 'R18,500', score: 79, status: 'recommended', imageKey: 'garden-and-outdoor' },
      ],
    },
    lobola: {
      title: 'Masego Lobola Delegation',
      budgetTotal: 180000,
      budgetAllocated: 137500,
      compatibilityScore: 88,
      labourProgress: '14/16',
      timelineStatus: 'On Track',
      intro: 'Track elders, venue, attire, catering, transport, and ceremonial logistics with dignity and clarity.',
      strapline: 'Digitise a deeply cultural event without removing the human coach layer.',
      weather: {
        label: 'Clear Evening',
        temperature: '19°',
        rainChance: 10,
        alert: 'Weather is stable. Prioritise transport and family arrival sequencing instead.',
      },
      coach: { name: 'Nono Dube', role: 'Tradition and Family Coordinator', rating: 4.8, eventsCompleted: 94 },
      core: [
        { id: 'family', slot: 'Delegation Lead', subcategory: 'Family Protocol', name: 'Nono Delegation Desk', rating: 4.8, reviewCount: 51, priceLabel: 'R18,000', score: 93, status: 'secured', imageKey: 'maid-service' },
        { id: 'venue', slot: 'Venue', subcategory: 'Homestead Venue', name: 'Kganya Courtyard', rating: 4.9, reviewCount: 44, priceLabel: 'R28,000', score: 89, status: 'secured', imageKey: 'home-cleaning' },
        { id: 'catering', slot: 'Catering', subcategory: 'Traditional Catering', name: 'MmaDijo Kitchen', rating: 4.8, reviewCount: 70, priceLabel: 'R32,000', score: 88, status: 'secured', imageKey: 'handyman-assist' },
        { id: 'attire', slot: 'Traditional Attire', subcategory: 'Styled Coordination', name: 'Heritage Threads', rating: 4.7, reviewCount: 31, priceLabel: 'R15,000', score: 86, status: 'booked', imageKey: 'spa-and-massage' },
        { id: 'photo', slot: 'Photography', subcategory: 'Ceremony Coverage', name: 'Moments by Leso', rating: 4.8, reviewCount: 63, priceLabel: 'R14,500', score: 85, status: 'booked', imageKey: 'appliance-repair' },
        { id: 'transport', slot: 'Transport', subcategory: 'Family Shuttle', name: 'Arrival Convoy', rating: 4.7, reviewCount: 22, priceLabel: 'R9,000', score: 82, status: 'booked', imageKey: 'pest-control' },
      ],
      support: [
        { id: 'elders', slot: 'Elders Host', subcategory: 'Protocol Guide', name: 'Respect Circle', rating: 4.9, reviewCount: 19, priceLabel: 'R6,500', score: 84, status: 'recommended', imageKey: 'urgent-electrical' },
        { id: 'livestock', slot: 'Cattle Sourcing', subcategory: 'Cultural Sourcing', name: 'Cattle Link', rating: 4.7, reviewCount: 28, priceLabel: 'R21,000', score: 82, status: 'optional', imageKey: 'garden-and-outdoor' },
        { id: 'decor', slot: 'Decor', subcategory: 'Traditional Decor', name: 'Khaya Decor', rating: 4.6, reviewCount: 17, priceLabel: 'R11,000', score: 79, status: 'optional', imageKey: 'deep-cleaning' },
        { id: 'mc', slot: 'MC', subcategory: 'Speaker and Translator', name: 'Family Voice', rating: 4.8, reviewCount: 12, priceLabel: 'R5,500', score: 78, status: 'optional', imageKey: 'salon-at-home' },
        { id: 'rain', slot: 'Tent Supplier', subcategory: 'Backup Marquee', name: 'Courtyard Cover', rating: 4.5, reviewCount: 21, priceLabel: 'R12,500', score: 77, status: 'optional', imageKey: 'garden-and-outdoor' },
      ],
    },
    funeral: {
      title: 'Ndlovu Memorial Service',
      budgetTotal: 140000,
      budgetAllocated: 118000,
      compatibilityScore: 79,
      labourProgress: '24/28',
      timelineStatus: 'Behind',
      intro: 'Handle tents, pastor, flowers, catering, and programme printing with rapid recommendations.',
      strapline: 'Fast coordination for the most stressful event category with a calmer operating surface.',
      weather: {
        label: 'Light Showers',
        temperature: '17°',
        rainChance: 55,
        alert: 'Add tenting and covered seating to reduce disruption for mourners.',
      },
      coach: { name: 'Sizwe K', role: 'Family Support and Logistics Coach', rating: 4.9, eventsCompleted: 156 },
      core: [
        { id: 'undertaker', slot: 'Undertaker', subcategory: 'Dignified Care', name: 'Resthaven Services', rating: 4.9, reviewCount: 140, priceLabel: 'R38,000', score: 94, status: 'secured', imageKey: 'maid-service' },
        { id: 'tent', slot: 'Tent', subcategory: 'Covered Seating', name: 'Shelter SA', rating: 4.7, reviewCount: 83, priceLabel: 'R18,000', score: 88, status: 'booked', imageKey: 'garden-and-outdoor' },
        { id: 'catering', slot: 'Catering', subcategory: 'Family Catering', name: 'Grace Kitchen', rating: 4.8, reviewCount: 90, priceLabel: 'R22,000', score: 87, status: 'secured', imageKey: 'handyman-assist' },
        { id: 'flowers', slot: 'Flowers', subcategory: 'Memorial Florals', name: 'White Bloom', rating: 4.8, reviewCount: 63, priceLabel: 'R9,000', score: 84, status: 'secured', imageKey: 'spa-and-massage' },
        { id: 'print', slot: 'Programmes', subcategory: 'Print and Design', name: 'Quiet Print', rating: 4.6, reviewCount: 29, priceLabel: 'R4,500', score: 81, status: 'booked', imageKey: 'deep-cleaning' },
        { id: 'transport', slot: 'Transport', subcategory: 'Family Transport', name: 'Community Shuttle', rating: 4.7, reviewCount: 35, priceLabel: 'R10,000', score: 80, status: 'booked', imageKey: 'pest-control' },
      ],
      support: [
        { id: 'pastor', slot: 'Pastor', subcategory: 'Service Leader', name: 'Pastor Network', rating: 4.9, reviewCount: 48, priceLabel: 'R3,000', score: 83, status: 'optional', imageKey: 'urgent-electrical' },
        { id: 'choir', slot: 'Choir', subcategory: 'Memorial Music', name: 'Hymn Collective', rating: 4.8, reviewCount: 26, priceLabel: 'R5,000', score: 80, status: 'optional', imageKey: 'book-a-mechanic' },
        { id: 'security', slot: 'Security', subcategory: 'Guest Support', name: 'Quiet Guard', rating: 4.5, reviewCount: 18, priceLabel: 'R4,000', score: 77, status: 'optional', imageKey: 'pest-control' },
        { id: 'liaison', slot: 'Family Liaison', subcategory: 'Guest Flow', name: 'Support Liaison', rating: 4.7, reviewCount: 21, priceLabel: 'R3,500', score: 79, status: 'recommended', imageKey: 'salon-at-home' },
        { id: 'walkway', slot: 'Covered Walkway', subcategory: 'Rain Backup', name: 'Walkway Cover', rating: 4.5, reviewCount: 17, priceLabel: 'R7,500', score: 76, status: 'recommended', imageKey: 'garden-and-outdoor' },
      ],
    },
    corporate: {
      title: 'Founders Summit 2026',
      budgetTotal: 520000,
      budgetAllocated: 288500,
      compatibilityScore: 86,
      labourProgress: '17/20',
      timelineStatus: 'On Track',
      intro: 'Plan launches, year-end functions, and team experiences with budget clarity from day one.',
      strapline: 'B2B-friendly event assembly with cleaner vendor comparison and central comms.',
      weather: {
        label: 'Sunny',
        temperature: '25°',
        rainChance: 5,
        alert: 'No weather risk. AV and guest-flow coordination are the tighter constraints.',
      },
      coach: { name: 'Karabo M', role: 'Event Operations Lead', rating: 4.7, eventsCompleted: 203 },
      core: [
        { id: 'producer', slot: 'Producer', subcategory: 'Run of Show', name: 'Signal Events', rating: 4.8, reviewCount: 118, priceLabel: 'R42,000', score: 91, status: 'secured', imageKey: 'maid-service' },
        { id: 'venue', slot: 'Venue', subcategory: 'Launch Venue', name: 'Glass Works', rating: 4.7, reviewCount: 67, priceLabel: 'R90,000', score: 89, status: 'booked', imageKey: 'home-cleaning' },
        { id: 'av', slot: 'AV', subcategory: 'Production and Sound', name: 'Stage Sync', rating: 4.8, reviewCount: 92, priceLabel: 'R65,000', score: 88, status: 'secured', imageKey: 'book-a-mechanic' },
        { id: 'catering', slot: 'Catering', subcategory: 'Executive Catering', name: 'Boardroom Table', rating: 4.6, reviewCount: 71, priceLabel: 'R48,000', score: 84, status: 'booked', imageKey: 'handyman-assist' },
        { id: 'photo', slot: 'Photography', subcategory: 'Brand Capture', name: 'Launch Lens', rating: 4.7, reviewCount: 59, priceLabel: 'R18,000', score: 83, status: 'booked', imageKey: 'appliance-repair' },
        { id: 'host', slot: 'Host', subcategory: 'Moderator', name: 'Stage Host', rating: 4.8, reviewCount: 31, priceLabel: 'R11,000', score: 81, status: 'booked', imageKey: 'urgent-electrical' },
      ],
      support: [
        { id: 'content', slot: 'Content Desk', subcategory: 'Social Coverage', name: 'Recap Studio', rating: 4.7, reviewCount: 40, priceLabel: 'R14,000', score: 82, status: 'optional', imageKey: 'salon-at-home' },
        { id: 'transport', slot: 'Transport', subcategory: 'Executive Shuttle', name: 'Fleet Link', rating: 4.5, reviewCount: 22, priceLabel: 'R9,500', score: 79, status: 'optional', imageKey: 'pest-control' },
        { id: 'decor', slot: 'Set Design', subcategory: 'Stage Styling', name: 'Set Build', rating: 4.6, reviewCount: 20, priceLabel: 'R16,000', score: 80, status: 'optional', imageKey: 'deep-cleaning' },
        { id: 'power', slot: 'Power Backup', subcategory: 'Generator Desk', name: 'Grid Backup', rating: 4.8, reviewCount: 12, priceLabel: 'R7,000', score: 78, status: 'recommended', imageKey: 'garden-and-outdoor' },
        { id: 'checkin', slot: 'Check-in', subcategory: 'Digital Registration', name: 'Flow Check', rating: 4.6, reviewCount: 16, priceLabel: 'R6,500', score: 77, status: 'optional', imageKey: 'home-cleaning' },
      ],
    },
    birthday: {
      title: 'Ayanda 30th Celebration',
      budgetTotal: 95000,
      budgetAllocated: 106800,
      compatibilityScore: 84,
      labourProgress: '11/14',
      timelineStatus: 'On Track',
      intro: 'Package venue, cake, decor, photography, and entertainment into a squad people can trust quickly.',
      strapline: 'High-frequency milestone planning with cards that reduce decision paralysis.',
      weather: {
        label: 'Warm Breeze',
        temperature: '27°',
        rainChance: 18,
        alert: 'Plan shade and drinks stations if the event is outdoors.',
      },
      coach: { name: 'Tumi N', role: 'Celebration Curator', rating: 4.8, eventsCompleted: 88 },
      core: [
        { id: 'planner', slot: 'Planner', subcategory: 'Party Curator', name: 'Glow Up Events', rating: 4.9, reviewCount: 78, priceLabel: 'R16,000', score: 90, status: 'secured', imageKey: 'maid-service' },
        { id: 'venue', slot: 'Venue', subcategory: 'Private Lounge', name: 'Studio Noir', rating: 4.8, reviewCount: 44, priceLabel: 'R22,000', score: 87, status: 'secured', imageKey: 'home-cleaning' },
        { id: 'cake', slot: 'Cake', subcategory: 'Luxury Cake Studio', name: 'Sugar Scene', rating: 4.9, reviewCount: 61, priceLabel: 'R4,500', score: 85, status: 'booked', imageKey: 'spa-and-massage' },
        { id: 'photo', slot: 'Photography', subcategory: 'Party Coverage', name: 'Flash Social', rating: 4.7, reviewCount: 87, priceLabel: 'R8,000', score: 83, status: 'booked', imageKey: 'appliance-repair' },
        { id: 'dj', slot: 'DJ', subcategory: 'Entertainment', name: 'Night Shift', rating: 4.8, reviewCount: 91, priceLabel: 'R12,000', score: 84, status: 'secured', imageKey: 'book-a-mechanic' },
        { id: 'catering', slot: 'Catering', subcategory: 'Party Bites', name: 'Late Table', rating: 4.6, reviewCount: 38, priceLabel: 'R15,000', score: 82, status: 'booked', imageKey: 'handyman-assist' },
      ],
      support: [
        { id: 'decor', slot: 'Decor', subcategory: 'Statement Decor', name: 'After Dark Decor', rating: 4.8, reviewCount: 33, priceLabel: 'R10,000', score: 81, status: 'optional', imageKey: 'deep-cleaning' },
        { id: 'glam', slot: 'Glam', subcategory: 'Hair and Makeup', name: 'Ready Room', rating: 4.7, reviewCount: 41, priceLabel: 'R7,000', score: 80, status: 'optional', imageKey: 'salon-at-home' },
        { id: 'transport', slot: 'Transport', subcategory: 'Arrival Car', name: 'Midnight Drive', rating: 4.6, reviewCount: 20, priceLabel: 'R6,800', score: 78, status: 'optional', imageKey: 'pest-control' },
        { id: 'content', slot: 'Content', subcategory: 'Social Capture', name: 'Loop Studio', rating: 4.7, reviewCount: 27, priceLabel: 'R5,500', score: 79, status: 'recommended', imageKey: 'urgent-electrical' },
        { id: 'bar', slot: 'Bar', subcategory: 'Signature Cocktails', name: 'Toast Bar', rating: 4.8, reviewCount: 14, priceLabel: 'R9,500', score: 77, status: 'optional', imageKey: 'garden-and-outdoor' },
      ],
    },
  };

  private readonly weatherByEvent: Record<PlannerEventType, PlannerSurface['weather']> = {
    wedding: {
      forecast: [
        { date: '2026-10-22', dayAbbr: 'THU', condition: 'Partly Cloudy', iconKey: 'cloud', tempC: 21, rainChancePct: 24, isEventDay: false },
        { date: '2026-10-23', dayAbbr: 'FRI', condition: 'Light Rain', iconKey: 'rain', tempC: 20, rainChancePct: 48, isEventDay: false },
        { date: '2026-10-24', dayAbbr: 'SAT', condition: 'Showers', iconKey: 'rain', tempC: 19, rainChancePct: 65, isEventDay: true },
        { date: '2026-10-25', dayAbbr: 'SUN', condition: 'Cloudy', iconKey: 'cloud', tempC: 22, rainChancePct: 36, isEventDay: false },
        { date: '2026-10-26', dayAbbr: 'MON', condition: 'Sunny', iconKey: 'sun', tempC: 24, rainChancePct: 8, isEventDay: false },
      ],
      shouldAlert: true,
      alert: {
        type: 'rain',
        title: 'High chance of rain on your event day.',
        recommendation: 'Secure tenting, covered walkways, and a wet-weather aisle backup before confirmations lock.',
        ctaLabel: 'View Tent Suppliers >',
        browseCategory: 'tents',
      },
    },
    lobola: {
      forecast: [
        { date: '2026-07-10', dayAbbr: 'FRI', condition: 'Sunny', iconKey: 'sun', tempC: 19, rainChancePct: 5, isEventDay: false },
        { date: '2026-07-11', dayAbbr: 'SAT', condition: 'Cloudy', iconKey: 'cloud', tempC: 18, rainChancePct: 16, isEventDay: false },
        { date: '2026-07-12', dayAbbr: 'SUN', condition: 'Sunny', iconKey: 'sun', tempC: 20, rainChancePct: 12, isEventDay: true },
        { date: '2026-07-13', dayAbbr: 'MON', condition: 'Sunny', iconKey: 'sun', tempC: 21, rainChancePct: 4, isEventDay: false },
        { date: '2026-07-14', dayAbbr: 'TUE', condition: 'Cloudy', iconKey: 'cloud', tempC: 18, rainChancePct: 15, isEventDay: false },
      ],
      shouldAlert: false,
    },
    funeral: {
      forecast: [
        { date: '2026-06-01', dayAbbr: 'MON', condition: 'Cloudy', iconKey: 'cloud', tempC: 15, rainChancePct: 25, isEventDay: false },
        { date: '2026-06-02', dayAbbr: 'TUE', condition: 'Rain', iconKey: 'rain', tempC: 14, rainChancePct: 56, isEventDay: false },
        { date: '2026-06-03', dayAbbr: 'WED', condition: 'Rain', iconKey: 'rain', tempC: 13, rainChancePct: 61, isEventDay: true },
        { date: '2026-06-04', dayAbbr: 'THU', condition: 'Cloudy', iconKey: 'cloud', tempC: 16, rainChancePct: 28, isEventDay: false },
        { date: '2026-06-05', dayAbbr: 'FRI', condition: 'Sunny', iconKey: 'sun', tempC: 18, rainChancePct: 10, isEventDay: false },
      ],
      shouldAlert: true,
      alert: {
        type: 'rain',
        title: 'Rain disruption risk is elevated.',
        recommendation: 'Lock covered seating, tenting, and walkway protection before family arrivals are finalised.',
        ctaLabel: 'View Tent Suppliers >',
        browseCategory: 'tents',
      },
    },
    corporate: {
      forecast: [
        { date: '2026-08-16', dayAbbr: 'SUN', condition: 'Sunny', iconKey: 'sun', tempC: 23, rainChancePct: 4, isEventDay: false },
        { date: '2026-08-17', dayAbbr: 'MON', condition: 'Sunny', iconKey: 'sun', tempC: 24, rainChancePct: 6, isEventDay: false },
        { date: '2026-08-18', dayAbbr: 'TUE', condition: 'Sunny', iconKey: 'sun', tempC: 25, rainChancePct: 5, isEventDay: true },
        { date: '2026-08-19', dayAbbr: 'WED', condition: 'Cloudy', iconKey: 'cloud', tempC: 22, rainChancePct: 18, isEventDay: false },
        { date: '2026-08-20', dayAbbr: 'THU', condition: 'Cloudy', iconKey: 'cloud', tempC: 21, rainChancePct: 19, isEventDay: false },
      ],
      shouldAlert: false,
    },
    birthday: {
      forecast: [
        { date: '2026-06-18', dayAbbr: 'THU', condition: 'Sunny', iconKey: 'sun', tempC: 24, rainChancePct: 8, isEventDay: false },
        { date: '2026-06-19', dayAbbr: 'FRI', condition: 'Sunny', iconKey: 'sun', tempC: 25, rainChancePct: 12, isEventDay: false },
        { date: '2026-06-20', dayAbbr: 'SAT', condition: 'Partly Cloudy', iconKey: 'cloud', tempC: 26, rainChancePct: 18, isEventDay: true },
        { date: '2026-06-21', dayAbbr: 'SUN', condition: 'Cloudy', iconKey: 'cloud', tempC: 24, rainChancePct: 22, isEventDay: false },
        { date: '2026-06-22', dayAbbr: 'MON', condition: 'Sunny', iconKey: 'sun', tempC: 23, rainChancePct: 6, isEventDay: false },
      ],
      shouldAlert: false,
    },
  };

  private readonly locations: Record<PlannerEventType, string> = {
    wedding: 'Lanseria, Gauteng',
    lobola: 'Mabopane, Gauteng',
    funeral: 'Soweto, Gauteng',
    corporate: 'Sandton, Gauteng',
    birthday: 'Rosebank, Gauteng',
  };

  private readonly autoPickByEvent: Record<PlannerEventType, PlannerSurface['autoPick']> = {
    wedding: {
      core: [
        { id: 'planner-auto', slot: 'Planner', subcategory: 'AI matched planner', name: 'Ivory Route', rating: 4.8, reviewCount: 84, priceLabel: 'R31,500', score: 94, status: 'recommended', imageKey: 'maid-service' },
        { id: 'venue-auto', slot: 'Venue', subcategory: 'Rain-safe estate', name: 'Oak Atelier', rating: 4.9, reviewCount: 73, priceLabel: 'R82,000', score: 93, status: 'recommended', imageKey: 'home-cleaning' },
        { id: 'photo-auto', slot: 'Photography', subcategory: 'Editorial studio', name: 'North Frame', rating: 4.9, reviewCount: 143, priceLabel: 'R30,000', score: 91, status: 'recommended', imageKey: 'appliance-repair' },
        { id: 'catering-auto', slot: 'Catering', subcategory: 'Luxury plated menu', name: 'Salt and Story', rating: 4.8, reviewCount: 66, priceLabel: 'R62,000', score: 90, status: 'recommended', imageKey: 'handyman-assist' },
        { id: 'floral-auto', slot: 'Florals', subcategory: 'Editorial florals', name: 'Ivory Bloom', rating: 4.8, reviewCount: 58, priceLabel: 'R24,000', score: 89, status: 'recommended', imageKey: 'spa-and-massage' },
        { id: 'ent-auto', slot: 'Entertainment', subcategory: 'Live DJ set', name: 'Afterglow Audio', rating: 4.8, reviewCount: 72, priceLabel: 'R16,500', score: 87, status: 'recommended', imageKey: 'book-a-mechanic' },
      ],
      support: [
        { id: 'mc-auto', slot: 'MC', subcategory: 'Ceremony host', name: 'Tebogo MC', rating: 4.7, reviewCount: 23, priceLabel: 'R6,500', score: 82, status: 'recommended', imageKey: 'urgent-electrical' },
        { id: 'glam-auto', slot: 'Hair and Makeup', subcategory: 'Bridal prep', name: 'Ready Room', rating: 4.8, reviewCount: 40, priceLabel: 'R9,500', score: 84, status: 'recommended', imageKey: 'salon-at-home' },
        { id: 'tent-auto', slot: 'Tent Supplier', subcategory: 'Clear canopy backup', name: 'Marquee Atelier', rating: 4.9, reviewCount: 44, priceLabel: 'R24,000', score: 88, status: 'recommended', imageKey: 'garden-and-outdoor' },
      ],
    },
    lobola: { core: [], support: [] },
    funeral: { core: [], support: [] },
    corporate: { core: [], support: [] },
    birthday: { core: [], support: [] },
  };

  private buildShortlist(board: PlannerBoard, eventType: PlannerEventType): SupplierBrowseItem[] {
    if (eventType === 'wedding') {
      return [
        { id: 'tent-premium', slot: 'Tent Supplier', name: 'Marquee Atelier', subcategory: 'Clear-span tenting', priceLabel: 'R24,000', rating: 4.9, reviewCount: 44, score: 91, status: 'recommended', imageKey: 'garden-and-outdoor', compatibilityNote: 'Best fit for your ceremony lawn and rain threshold.' },
        { id: 'lighting-wed', slot: 'Lighting', name: 'Golden Hour Hire', subcategory: 'Ambient lighting', priceLabel: 'R14,500', rating: 4.8, reviewCount: 28, score: 87, status: 'optional', imageKey: 'salon-at-home', compatibilityNote: 'Pairs cleanly with Luxe Manor and evening photography.' },
        { id: 'stationery-wed', slot: 'Stationery', name: 'Paper Poetry', subcategory: 'Menus and signage', priceLabel: 'R8,200', rating: 4.7, reviewCount: 31, score: 82, status: 'optional', imageKey: 'deep-cleaning', compatibilityNote: 'Strong fit for your floral palette and table plan.' },
      ];
    }

    return board.support.slice(0, 3).map((vendor) => ({
      id: `${vendor.id}-shortlist`,
      slot: vendor.slot,
      name: vendor.name,
      subcategory: vendor.subcategory,
      priceLabel: vendor.priceLabel,
      rating: vendor.rating,
      reviewCount: vendor.reviewCount,
      score: vendor.score,
      status: vendor.status,
      imageKey: vendor.imageKey,
      compatibilityNote: `Recommended for ${eventType} planning based on timing, budget, and squad fit.`,
    }));
  }

  private buildBudgetLines(board: PlannerBoard): BudgetLineItem[] {
    return board.core.slice(0, 5).map((vendor, index) => ({
      id: `budget-${vendor.id}`,
      label: index === 0 ? `${vendor.slot} deposit` : `${vendor.slot} booking`,
      owner: vendor.name,
      amount: Number(vendor.priceLabel.replace(/[^0-9]/g, '')) || 0,
      status: index < 2 ? 'paid' : index === 2 ? 'booked' : index === 3 ? 'quote' : 'pending',
      dueLabel: index < 2 ? 'Paid in full' : index === 2 ? 'Balance due in 12 days' : index === 3 ? 'Quote expires Friday' : 'Awaiting confirmation',
    }));
  }

  private buildCoachProfile(board: PlannerBoard, eventType: PlannerEventType): PlannerCoachProfile {
    const bios: Record<PlannerEventType, string> = {
      wedding: 'Luxury wedding coach focused on vendor chemistry, timeline control, and ceremony backup logic.',
      lobola: 'Guides family protocol, delegation sequencing, and respectful communication.',
      funeral: 'Keeps funeral logistics calm, respectful, and fast-moving under pressure.',
      corporate: 'Balances venue, AV, staffing, and guest-flow logic for B2B events.',
      birthday: 'Packages milestone events with fast decisions, visual clarity, and social-ready suppliers.',
    };

    const specialties: Record<PlannerEventType, string[]> = {
      wedding: ['Luxury weddings', 'Supplier negotiation', 'Rain backup planning'],
      lobola: ['Family protocol', 'Traditional ceremonies', 'Arrival flow'],
      funeral: ['Funeral logistics', 'Family liaison', 'Rain-ready support'],
      corporate: ['AV planning', 'Run-of-show', 'Executive hosting'],
      birthday: ['Milestone parties', 'Social content', 'Decor pacing'],
    };

    const availability: Record<PlannerEventType, string> = {
      wedding: 'Available for review calls tomorrow at 09:30',
      lobola: 'Call slot open today at 17:00',
      funeral: 'On standby now',
      corporate: 'Review deck ready by 14:00',
      birthday: 'Available tonight after 18:30',
    };

    return {
      name: board.coach.name,
      role: board.coach.role,
      rating: board.coach.rating,
      eventsCompleted: board.coach.eventsCompleted,
      bio: bios[eventType],
      specialties: specialties[eventType],
      nextAvailable: availability[eventType],
    };
  }

  private buildInspiration(eventType: PlannerEventType): PlannerSurface['inspiration'] {
    const boards: Record<PlannerEventType, PlannerSurface['inspiration']> = {
      wedding: {
        boards: [
          { id: 'i1', title: 'Soft gold ceremony', theme: 'Romantic minimal', note: 'Focus on candlelight, low florals, and creamy textures.', matchedSupplierIds: ['florals', 'lighting-wed'] },
          { id: 'i2', title: 'Glass reception references', theme: 'Modern formal', note: 'Leans into mirrored tables, warm lighting, and draped staging.', matchedSupplierIds: ['venue', 'decor'] },
        ],
        insight: 'AI vibe read: your references lean romantic-formal, so lighting and florals should stay soft instead of highly saturated.',
      },
      lobola: {
        boards: [{ id: 'li1', title: 'Family welcome layout', theme: 'Traditional formal', note: 'Respectful arrival pacing and layered hosting roles.', matchedSupplierIds: ['elders'] }],
        insight: 'References favor tradition-first coordination over decorative excess.',
      },
      funeral: {
        boards: [{ id: 'fi1', title: 'Memorial service setup', theme: 'Calm formal', note: 'Covered guest flow and family-first layout references.', matchedSupplierIds: ['walkway'] }],
        insight: 'Best results come from practical weather prep and clear guest-flow signage.',
      },
      corporate: {
        boards: [{ id: 'ci1', title: 'Launch stage references', theme: 'Clean B2B modern', note: 'Focus on staging, projection, and guest registration flow.', matchedSupplierIds: ['av'] }],
        insight: 'Your boards lean clean and premium, so avoid overdecorating the stage.',
      },
      birthday: {
        boards: [{ id: 'bi1', title: 'Studio birthday mood board', theme: 'After-dark glam', note: 'Black, chrome, mirror accents, and social moments.', matchedSupplierIds: ['decor'] }],
        insight: 'The saved looks lean nightlife-glam, so content capture and arrival styling matter most.',
      },
    };

    return boards[eventType];
  }

  private buildMarketplace(eventType: PlannerEventType): PlannerSurface['marketplace'] {
    const featured: Record<PlannerEventType, MarketplaceFeature[]> = {
      wedding: [
        { id: 'm1', title: 'The Glass Hall', category: 'Venue tour', location: 'Midrand', description: 'High-ceiling venue with fast indoor rain fallback.', priceHint: 'From R95,000' },
        { id: 'm2', title: 'Velvet Audio', category: 'Production', location: 'Johannesburg', description: 'Ceremony and reception sound packages tuned for large outdoor lawns.', priceHint: 'From R18,000' },
        { id: 'm3', title: 'Bloom Room Editorial', category: 'Florals', location: 'Sandton', description: 'Statement floral installs with late-night reset crew.', priceHint: 'From R22,000' },
      ],
      lobola: [{ id: 'lm1', title: 'Courtyard Canopies', category: 'Marquee', location: 'Pretoria North', description: 'Quick erect structures sized for family homes.', priceHint: 'From R12,000' }],
      funeral: [{ id: 'fm1', title: 'Shelter SA', category: 'Tenting', location: 'Johannesburg', description: 'Fast-response funeral tent setup with covered aisle routes.', priceHint: 'From R18,000' }],
      corporate: [{ id: 'cm1', title: 'Stage Sync Premium', category: 'AV', location: 'Johannesburg', description: 'Corporate-grade production with integrated livestream desk.', priceHint: 'From R65,000' }],
      birthday: [{ id: 'bm1', title: 'Toast Bar', category: 'Cocktail bar', location: 'Johannesburg', description: 'Small-format signature cocktail station for birthday nights.', priceHint: 'From R9,500' }],
    };

    return { featured: featured[eventType] };
  }

  private buildMessages(eventType: PlannerEventType): PlannerSurface['messages'] {
    if (eventType !== 'wedding') {
      return { threads: [] };
    }

    return {
      threads: [
        {
          id: 't1',
          vendorId: 'planner',
          vendorName: 'The Perfect Plan Co.',
          slot: 'Planner',
          unreadCount: 3,
          lastMessage: 'I have two ceremony-flow options depending on the rain call.',
          updatedAt: '2026-10-20T09:20:00.000Z',
          messages: [
            { id: 'tm1', sender: 'supplier', senderName: 'The Perfect Plan Co.', text: 'I have two ceremony-flow options depending on the rain call.', timestamp: '2026-10-20T09:20:00.000Z' },
            { id: 'tm2', sender: 'client', senderName: 'Mercy', text: 'Please send both so I can review with the coach.', timestamp: '2026-10-20T09:24:00.000Z' },
          ],
        },
        {
          id: 't2',
          vendorId: 'catering',
          vendorName: 'Taste Affair',
          slot: 'Catering',
          unreadCount: 5,
          lastMessage: 'Can we lock the guest count by Wednesday for final staffing?',
          updatedAt: '2026-10-20T07:42:00.000Z',
          messages: [
            { id: 'tm3', sender: 'supplier', senderName: 'Taste Affair', text: 'Can we lock the guest count by Wednesday for final staffing?', timestamp: '2026-10-20T07:42:00.000Z' },
            { id: 'tm4', sender: 'coach', senderName: 'Muzi Clo', text: 'Yes, we will confirm after family RSVPs tonight.', timestamp: '2026-10-20T08:03:00.000Z' },
          ],
        },
      ],
    };
  }

  private buildSwapOptions(eventType: PlannerEventType): PlannerSurface['swapOptions'] {
    if (eventType !== 'wedding') {
      return {};
    }

    return {
      planner: [
        { id: 'planner-alt-1', slot: 'Planner', name: 'Ivory Route', subcategory: 'Wedding strategist', priceLabel: 'R31,500', rating: 4.8, reviewCount: 84, score: 88, status: 'recommended', imageKey: 'maid-service', compatibilityNote: 'Calmer budget fit with similar family coordination strength.' },
        { id: 'planner-alt-2', slot: 'Planner', name: 'House of Vows', subcategory: 'Ceremony logistics', priceLabel: 'R37,000', rating: 4.9, reviewCount: 61, score: 86, status: 'optional', imageKey: 'home-cleaning', compatibilityNote: 'Excellent ceremony pacing, slightly higher management fee.' },
      ],
      catering: [
        { id: 'catering-alt-1', slot: 'Catering', name: 'Salt and Story', subcategory: 'Luxury plated menu', priceLabel: 'R62,000', rating: 4.8, reviewCount: 66, score: 87, status: 'recommended', imageKey: 'handyman-assist', compatibilityNote: 'Better alignment with the glass reception mood board.' },
      ],
    };
  }

  private buildClashCandidates(eventType: PlannerEventType): PlannerSurface['clashCandidates'] {
    if (eventType !== 'wedding') {
      return [];
    }

    return [
      {
        currentVendorId: 'catering',
        challengerVendorId: 'catering-alt-1',
        summary: 'Salt and Story wins on menu fit, while Taste Affair remains stronger on logistics depth.',
        winnerVendorId: 'catering-alt-1',
        communityChoicePct: 62,
        comparison: [
          { label: 'Menu fit', current: '8/10', challenger: '9/10' },
          { label: 'Rain backup service', current: '9/10', challenger: '8/10' },
          { label: 'Guest experience reviews', current: '4.7', challenger: '4.8' },
        ],
      },
    ];
  }

  private buildBrowseCategories(eventType: PlannerEventType) {
    const categories: Record<PlannerEventType, Array<{ key: string; label: string; description: string }>> = {
      wedding: [
        { key: 'tents', label: 'Tents and covers', description: 'Rain-ready structures sorted for wedding layouts.' },
        { key: 'beauty', label: 'Beauty and styling', description: 'Hair, makeup, dressing support, and prep rooms.' },
        { key: 'content', label: 'Content capture', description: 'Social content teams and guest-facing media desks.' },
      ],
      lobola: [{ key: 'protocol', label: 'Protocol support', description: 'Hosts, translators, and delegation support.' }],
      funeral: [{ key: 'tents', label: 'Covered seating', description: 'Quick funeral-weather backup suppliers.' }],
      corporate: [{ key: 'av', label: 'AV and production', description: 'Sound, staging, livestream, and technical crew.' }],
      birthday: [{ key: 'decor', label: 'Decor and styling', description: 'Party decor, cake styling, and guest experience add-ons.' }],
    };

    return categories[eventType];
  }

  getMvpExperience(eventType: PlannerEventType = 'wedding', persona: PlannerPersona = 'client') {
    const board = this.boards[eventType] || this.boards.wedding;
    return {
      eventType,
      persona,
      title: board.title,
      intro: board.intro,
      strapline: board.strapline,
      budgetTotal: board.budgetTotal,
      budgetAllocated: board.budgetAllocated,
      compatibilityScore: board.compatibilityScore,
      labourProgress: board.labourProgress,
      timelineStatus: board.timelineStatus,
      weather: board.weather,
      coach: board.coach,
      personas: this.personas,
      onboardingSteps: this.onboardingSteps,
      squad: {
        core: board.core,
        support: board.support,
      },
      appAccess: {
        admin: '/admin',
        client: '/mobile?persona=client',
        supplier: '/mobile?persona=supplier',
        coach: '/mobile?persona=coach',
      },
    };
  }

  getSurfaceExperience(eventType: PlannerEventType = 'wedding'): PlannerSurface {
    const board = this.boards[eventType] || this.boards.wedding;
    const weather = this.weatherByEvent[eventType] || this.weatherByEvent.wedding;
    const messages = this.buildMessages(eventType);

    return {
      locationLabel: this.locations[eventType],
      unreadCount: messages.threads.reduce((total, thread) => total + thread.unreadCount, 0),
      weather,
      coachProfile: this.buildCoachProfile(board, eventType),
      suppliers: {
        shortlist: this.buildShortlist(board, eventType),
        browseCategories: this.buildBrowseCategories(eventType),
      },
      budget: {
        total: board.budgetTotal,
        allocated: board.budgetAllocated,
        lines: this.buildBudgetLines(board),
      },
      inspiration: this.buildInspiration(eventType),
      marketplace: this.buildMarketplace(eventType),
      messages,
      swapOptions: this.buildSwapOptions(eventType),
      clashCandidates: this.buildClashCandidates(eventType),
      autoPick: this.autoPickByEvent[eventType],
    };
  }

  getAutoPickExperience(eventType: PlannerEventType = 'wedding') {
    return {
      title: 'AI picked your squad',
      ...this.getSurfaceExperience(eventType).autoPick,
    };
  }
}