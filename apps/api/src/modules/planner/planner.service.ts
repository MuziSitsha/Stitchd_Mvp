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
      coach: { name: 'Merk Clo', role: 'Lead Planner and Strategist', rating: 4.9, eventsCompleted: 127 },
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
}