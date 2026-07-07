import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';

import {
  PlannerEventType,
  PlannerPersona,
  PlannerService,
} from './modules/planner/planner.service';

type PlatformSettings = {
  defaultCommissionRate: number;
  businessLegalName?: string;
  payoutBankName?: string;
  payoutAccountHolder?: string;
  payoutAccountNumber?: string;
  payoutAccountType?: string;
  payoutBranchCode?: string;
  payoutReference?: string;
};

type VendorStatus = 'secured' | 'booked' | 'optional' | 'recommended' | 'at_risk';

type PlannerVendorPayload = {
  id: string;
  slot: string;
  subcategory: string;
  name: string;
  rating: number;
  reviewCount: number;
  priceLabel: string;
  score: number;
  status: VendorStatus;
  imageKey: string;
};

type PlannerWeatherDay = {
  date: string;
  dayAbbr: string;
  condition: string;
  iconKey: 'sun' | 'cloud' | 'rain' | 'storm';
  tempC: number;
  rainChancePct: number;
  isEventDay: boolean;
};

type PlannerWeatherAlert = {
  type: 'rain' | 'heat' | 'wind';
  title: string;
  recommendation: string;
  ctaLabel: string;
  browseCategory: string;
};

type SupplierBrowseItem = {
  id: string;
  slot: string;
  name: string;
  subcategory: string;
  priceLabel: string;
  rating: number;
  reviewCount: number;
  score: number;
  status: VendorStatus;
  imageKey: string;
  compatibilityNote: string;
};

type BudgetLineItem = {
  id: string;
  label: string;
  owner: string;
  amount: number;
  status: 'paid' | 'booked' | 'quote' | 'pending';
  dueLabel: string;
};

type InspirationBoardItem = {
  id: string;
  title: string;
  theme: string;
  note: string;
  matchedSupplierIds: string[];
};

type MarketplaceFeature = {
  id: string;
  title: string;
  category: string;
  location: string;
  description: string;
  priceHint: string;
};

type MessageEntry = {
  id: string;
  sender: 'coach' | 'supplier' | 'client';
  senderName: string;
  text: string;
  timestamp: string;
};

type MessageThread = {
  id: string;
  vendorId: string;
  vendorName: string;
  slot: string;
  unreadCount: number;
  lastMessage: string;
  updatedAt: string;
  messages: MessageEntry[];
};

type ClashCandidate = {
  currentVendorId: string;
  challengerVendorId: string;
  summary: string;
  winnerVendorId: string;
  communityChoicePct: number;
  comparison: Array<{ label: string; current: string; challenger: string }>;
};

type PlannerCoachProfile = {
  name: string;
  role: string;
  rating: number;
  eventsCompleted: number;
  bio: string;
  specialties: string[];
  nextAvailable: string;
};

type PlannerSurfaceData = {
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
    core: PlannerVendorPayload[];
    support: PlannerVendorPayload[];
  };
};

type MockMobileRole = 'customer' | 'coach' | 'vendor' | 'admin';

type MockMobileUser = {
  id: string;
  phone: string;
  role: MockMobileRole;
  firstName: string;
  lastName: string;
};

const plannerService = new PlannerService(null as never, null as never, null as never, null as never, null as never, null as never, null as never, null as never);
const host = '127.0.0.1';
const port = Number(process.env.PORT || 3001);
const mockAccessToken = 'mock-admin-access-token';

const allowedOrigins = (process.env.ALLOWED_ORIGINS
  || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:8082,http://127.0.0.1:8082')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

const settings: PlatformSettings = {
  defaultCommissionRate: 0.15,
  businessLegalName: 'STITCHD Wedding Planning (Pty) Ltd',
  payoutBankName: 'FNB',
  payoutAccountHolder: 'STITCHD Wedding Planning',
  payoutAccountNumber: '62123456789',
  payoutAccountType: 'Business Cheque',
  payoutBranchCode: '250655',
  payoutReference: 'STITCHD settlements',
};

const plannerSurfaces: Record<PlannerEventType, PlannerSurfaceData> = {
  wedding: {
    locationLabel: 'Lanseria, Gauteng',
    unreadCount: 12,
    weather: {
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
    coachProfile: {
      name: 'Lungi',
      role: 'Senior Coordinator',
      rating: 4.9,
      eventsCompleted: 92,
      bio: 'Luxury wedding coordinator focused on vendor chemistry, timeline control, and ceremony backup logic.',
      specialties: ['Luxury weddings', 'Supplier negotiation', 'Rain backup planning'],
      nextAvailable: 'Available for review calls tomorrow at 09:30',
    },
    suppliers: {
      shortlist: [
        { id: 'tent-premium', slot: 'Tent Supplier', name: 'Marquee Atelier', subcategory: 'Clear-span tenting', priceLabel: 'R24,000', rating: 4.9, reviewCount: 44, score: 91, status: 'recommended', imageKey: 'garden-and-outdoor', compatibilityNote: 'Best fit for your ceremony lawn and rain threshold.' },
        { id: 'lighting-wed', slot: 'Lighting', name: 'Golden Hour Hire', subcategory: 'Ambient lighting', priceLabel: 'R14,500', rating: 4.8, reviewCount: 28, score: 87, status: 'optional', imageKey: 'salon-at-home', compatibilityNote: 'Pairs cleanly with Luxe Manor and evening photography.' },
        { id: 'stationery-wed', slot: 'Stationery', name: 'Paper Poetry', subcategory: 'Menus and signage', priceLabel: 'R8,200', rating: 4.7, reviewCount: 31, score: 82, status: 'optional', imageKey: 'deep-cleaning', compatibilityNote: 'Strong fit for your floral palette and table plan.' },
      ],
      browseCategories: [
        { key: 'tents', label: 'Tents and covers', description: 'Rain-ready structures sorted for wedding layouts.' },
        { key: 'beauty', label: 'Beauty and styling', description: 'Hair, makeup, dressing support, and prep rooms.' },
        { key: 'content', label: 'Content capture', description: 'Social content teams and guest-facing media desks.' },
      ],
    },
    budget: {
      total: 400000,
      allocated: 250000,
      lines: [
        { id: 'b1', label: 'Venue deposit', owner: 'Luxe Manor', amount: 85000, status: 'paid', dueLabel: 'Paid in full' },
        { id: 'b2', label: 'Planner retainer', owner: 'The Perfect Plan Co.', amount: 35000, status: 'paid', dueLabel: 'Paid in full' },
        { id: 'b3', label: 'Catering hold', owner: 'Taste Affair', amount: 65000, status: 'booked', dueLabel: 'Balance due in 12 days' },
        { id: 'b4', label: 'Photography quote', owner: 'Memories by TK', amount: 28000, status: 'quote', dueLabel: 'Quote expires Friday' },
        { id: 'b5', label: 'Rain backup reserve', owner: 'Marquee Atelier', amount: 24000, status: 'pending', dueLabel: 'Approve if forecast stays above 40%' },
      ],
    },
    inspiration: {
      boards: [
        { id: 'i1', title: 'Soft gold ceremony', theme: 'Romantic minimal', note: 'Focus on candlelight, low florals, and creamy textures.', matchedSupplierIds: ['florals', 'lighting-wed'] },
        { id: 'i2', title: 'Glass reception references', theme: 'Modern formal', note: 'Leans into mirrored tables, warm lighting, and draped staging.', matchedSupplierIds: ['venue', 'decor'] },
      ],
      insight: 'AI vibe read: your references lean romantic-formal, so lighting and florals should stay soft instead of highly saturated.',
    },
    marketplace: {
      featured: [
        { id: 'm1', title: 'The Glass Hall', category: 'Venue tour', location: 'Midrand', description: 'High-ceiling venue with fast indoor rain fallback.', priceHint: 'From R95,000' },
        { id: 'm2', title: 'Velvet Audio', category: 'Production', location: 'Johannesburg', description: 'Ceremony and reception sound packages tuned for large outdoor lawns.', priceHint: 'From R18,000' },
        { id: 'm3', title: 'Bloom Room Editorial', category: 'Florals', location: 'Sandton', description: 'Statement floral installs with late-night reset crew.', priceHint: 'From R22,000' },
      ],
    },
    messages: {
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
            { id: 'tm4', sender: 'coach', senderName: 'Lungi', text: 'Yes, we will confirm after family RSVPs tonight.', timestamp: '2026-10-20T08:03:00.000Z' },
          ],
        },
        {
          id: 't3',
          vendorId: 'tent',
          vendorName: 'Marquee Atelier',
          slot: 'Tent Supplier',
          unreadCount: 4,
          lastMessage: 'We can hold a 48-hour priority reservation if you want the clear canopy option.',
          updatedAt: '2026-10-20T06:12:00.000Z',
          messages: [
            { id: 'tm5', sender: 'supplier', senderName: 'Marquee Atelier', text: 'We can hold a 48-hour priority reservation if you want the clear canopy option.', timestamp: '2026-10-20T06:12:00.000Z' },
          ],
        },
      ],
    },
    swapOptions: {
      planner: [
        { id: 'planner-alt-1', slot: 'Planner', name: 'Ivory Route', subcategory: 'Wedding strategist', priceLabel: 'R31,500', rating: 4.8, reviewCount: 84, score: 88, status: 'recommended', imageKey: 'maid-service', compatibilityNote: 'Calmer budget fit with similar family coordination strength.' },
        { id: 'planner-alt-2', slot: 'Planner', name: 'House of Vows', subcategory: 'Ceremony logistics', priceLabel: 'R37,000', rating: 4.9, reviewCount: 61, score: 86, status: 'optional', imageKey: 'home-cleaning', compatibilityNote: 'Excellent ceremony pacing, slightly higher management fee.' },
      ],
      catering: [
        { id: 'catering-alt-1', slot: 'Catering', name: 'Salt and Story', subcategory: 'Luxury plated menu', priceLabel: 'R62,000', rating: 4.8, reviewCount: 66, score: 87, status: 'recommended', imageKey: 'handyman-assist', compatibilityNote: 'Better alignment with the glass reception mood board.' },
      ],
    },
    clashCandidates: [
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
    ],
    autoPick: {
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
  },
  lobola: {
    locationLabel: 'Mabopane, Gauteng', unreadCount: 5,
    weather: { forecast: [
      { date: '2026-07-10', dayAbbr: 'FRI', condition: 'Sunny', iconKey: 'sun', tempC: 19, rainChancePct: 5, isEventDay: false },
      { date: '2026-07-11', dayAbbr: 'SAT', condition: 'Cloudy', iconKey: 'cloud', tempC: 18, rainChancePct: 16, isEventDay: false },
      { date: '2026-07-12', dayAbbr: 'SUN', condition: 'Sunny', iconKey: 'sun', tempC: 20, rainChancePct: 12, isEventDay: true },
      { date: '2026-07-13', dayAbbr: 'MON', condition: 'Sunny', iconKey: 'sun', tempC: 21, rainChancePct: 4, isEventDay: false },
      { date: '2026-07-14', dayAbbr: 'TUE', condition: 'Cloudy', iconKey: 'cloud', tempC: 18, rainChancePct: 15, isEventDay: false },
    ], shouldAlert: false },
    coachProfile: { name: 'Nono Dube', role: 'Tradition and Family Coordinator', rating: 4.8, eventsCompleted: 94, bio: 'Guides family protocol, delegation sequencing, and respectful communication.', specialties: ['Family protocol', 'Traditional ceremonies', 'Arrival flow'], nextAvailable: 'Call slot open today at 17:00' },
    suppliers: { shortlist: [], browseCategories: [{ key: 'protocol', label: 'Protocol support', description: 'Hosts, translators, and delegation support.' }] },
    budget: { total: 180000, allocated: 108000, lines: [{ id: 'lb1', label: 'Venue', owner: 'Kganya Courtyard', amount: 28000, status: 'paid', dueLabel: 'Paid' }] },
    inspiration: { boards: [{ id: 'li1', title: 'Family welcome layout', theme: 'Traditional formal', note: 'Respectful arrival pacing and layered hosting roles.', matchedSupplierIds: ['elders'] }], insight: 'References favor tradition-first coordination over decorative excess.' },
    marketplace: { featured: [{ id: 'lm1', title: 'Courtyard Canopies', category: 'Marquee', location: 'Pretoria North', description: 'Quick erect structures sized for family homes.', priceHint: 'From R12,000' }] },
    messages: { threads: [] },
    swapOptions: {}, clashCandidates: [], autoPick: { core: [], support: [] },
  },
  funeral: {
    locationLabel: 'Soweto, Gauteng', unreadCount: 4,
    weather: { forecast: [
      { date: '2026-06-01', dayAbbr: 'MON', condition: 'Cloudy', iconKey: 'cloud', tempC: 15, rainChancePct: 25, isEventDay: false },
      { date: '2026-06-02', dayAbbr: 'TUE', condition: 'Rain', iconKey: 'rain', tempC: 14, rainChancePct: 56, isEventDay: false },
      { date: '2026-06-03', dayAbbr: 'WED', condition: 'Rain', iconKey: 'rain', tempC: 13, rainChancePct: 61, isEventDay: true },
      { date: '2026-06-04', dayAbbr: 'THU', condition: 'Cloudy', iconKey: 'cloud', tempC: 16, rainChancePct: 28, isEventDay: false },
      { date: '2026-06-05', dayAbbr: 'FRI', condition: 'Sunny', iconKey: 'sun', tempC: 18, rainChancePct: 10, isEventDay: false },
    ], shouldAlert: true, alert: { type: 'rain', title: 'Rain disruption risk is elevated.', recommendation: 'Lock covered seating, tenting, and walkway protection before family arrivals are finalised.', ctaLabel: 'View Tent Suppliers >', browseCategory: 'tents' } },
    coachProfile: { name: 'Sizwe K', role: 'Family Support and Logistics Coach', rating: 4.9, eventsCompleted: 156, bio: 'Keeps funeral logistics calm, respectful, and fast-moving under pressure.', specialties: ['Funeral logistics', 'Family liaison', 'Rain-ready support'], nextAvailable: 'On standby now' },
    suppliers: { shortlist: [], browseCategories: [{ key: 'tents', label: 'Covered seating', description: 'Quick funeral-weather backup suppliers.' }] },
    budget: { total: 140000, allocated: 96500, lines: [{ id: 'fb1', label: 'Undertaker', owner: 'Resthaven Services', amount: 38000, status: 'paid', dueLabel: 'Paid' }] },
    inspiration: { boards: [{ id: 'fi1', title: 'Memorial service setup', theme: 'Calm formal', note: 'Covered guest flow and family-first layout references.', matchedSupplierIds: ['backup-funeral'] }], insight: 'Best results come from practical weather prep and clear guest-flow signage.' },
    marketplace: { featured: [{ id: 'fm1', title: 'Shelter SA', category: 'Tenting', location: 'Johannesburg', description: 'Fast-response funeral tent setup with covered aisle routes.', priceHint: 'From R18,000' }] },
    messages: { threads: [] },
    swapOptions: {}, clashCandidates: [], autoPick: { core: [], support: [] },
  },
  corporate: {
    locationLabel: 'Sandton, Gauteng', unreadCount: 7,
    weather: { forecast: [
      { date: '2026-08-16', dayAbbr: 'SUN', condition: 'Sunny', iconKey: 'sun', tempC: 23, rainChancePct: 4, isEventDay: false },
      { date: '2026-08-17', dayAbbr: 'MON', condition: 'Sunny', iconKey: 'sun', tempC: 24, rainChancePct: 6, isEventDay: false },
      { date: '2026-08-18', dayAbbr: 'TUE', condition: 'Sunny', iconKey: 'sun', tempC: 25, rainChancePct: 5, isEventDay: true },
      { date: '2026-08-19', dayAbbr: 'WED', condition: 'Cloudy', iconKey: 'cloud', tempC: 22, rainChancePct: 18, isEventDay: false },
      { date: '2026-08-20', dayAbbr: 'THU', condition: 'Cloudy', iconKey: 'cloud', tempC: 21, rainChancePct: 19, isEventDay: false },
    ], shouldAlert: false },
    coachProfile: { name: 'Karabo M', role: 'Event Operations Lead', rating: 4.7, eventsCompleted: 203, bio: 'Balances venue, AV, staffing, and guest-flow logic for B2B events.', specialties: ['AV planning', 'Run-of-show', 'Executive hosting'], nextAvailable: 'Review deck ready by 14:00' },
    suppliers: { shortlist: [], browseCategories: [{ key: 'av', label: 'AV and production', description: 'Sound, staging, livestream, and technical crew.' }] },
    budget: { total: 520000, allocated: 274000, lines: [{ id: 'cb1', label: 'Venue hold', owner: 'Glass Works', amount: 90000, status: 'booked', dueLabel: 'Deposit due next week' }] },
    inspiration: { boards: [{ id: 'ci1', title: 'Launch stage references', theme: 'Clean B2B modern', note: 'Focus on staging, projection, and guest registration flow.', matchedSupplierIds: ['av'] }], insight: 'Your boards lean clean and premium, so avoid overdecorating the stage.' },
    marketplace: { featured: [{ id: 'cm1', title: 'Stage Sync Premium', category: 'AV', location: 'Johannesburg', description: 'Corporate-grade production with integrated livestream desk.', priceHint: 'From R65,000' }] },
    messages: { threads: [] },
    swapOptions: {}, clashCandidates: [], autoPick: { core: [], support: [] },
  },
  birthday: {
    locationLabel: 'Rosebank, Gauteng', unreadCount: 6,
    weather: { forecast: [
      { date: '2026-06-18', dayAbbr: 'THU', condition: 'Sunny', iconKey: 'sun', tempC: 24, rainChancePct: 8, isEventDay: false },
      { date: '2026-06-19', dayAbbr: 'FRI', condition: 'Sunny', iconKey: 'sun', tempC: 25, rainChancePct: 12, isEventDay: false },
      { date: '2026-06-20', dayAbbr: 'SAT', condition: 'Partly Cloudy', iconKey: 'cloud', tempC: 26, rainChancePct: 18, isEventDay: true },
      { date: '2026-06-21', dayAbbr: 'SUN', condition: 'Cloudy', iconKey: 'cloud', tempC: 24, rainChancePct: 22, isEventDay: false },
      { date: '2026-06-22', dayAbbr: 'MON', condition: 'Sunny', iconKey: 'sun', tempC: 23, rainChancePct: 6, isEventDay: false },
    ], shouldAlert: false },
    coachProfile: { name: 'Tumi N', role: 'Celebration Curator', rating: 4.8, eventsCompleted: 88, bio: 'Packages milestone events with fast decisions, visual clarity, and social-ready suppliers.', specialties: ['Milestone parties', 'Social content', 'Decor pacing'], nextAvailable: 'Available tonight after 18:30' },
    suppliers: { shortlist: [], browseCategories: [{ key: 'decor', label: 'Decor and styling', description: 'Party decor, cake styling, and guest experience add-ons.' }] },
    budget: { total: 95000, allocated: 57500, lines: [{ id: 'bb1', label: 'Venue hold', owner: 'Studio Noir', amount: 22000, status: 'paid', dueLabel: 'Paid' }] },
    inspiration: { boards: [{ id: 'bi1', title: 'Studio birthday mood board', theme: 'After-dark glam', note: 'Black, chrome, mirror accents, and social moments.', matchedSupplierIds: ['decor-birthday'] }], insight: 'The saved looks lean nightlife-glam, so content capture and arrival styling matter most.' },
    marketplace: { featured: [{ id: 'bm1', title: 'Toast Bar', category: 'Cocktail bar', location: 'Johannesburg', description: 'Small-format signature cocktail station for birthday nights.', priceHint: 'From R9,500' }] },
    messages: { threads: [] },
    swapOptions: {}, clashCandidates: [], autoPick: { core: [], support: [] },
  },
};

function getPlannerSurface(eventType?: PlannerEventType) {
  return plannerSurfaces[eventType || 'wedding'];
}

function applyCors(req: IncomingMessage, res: ServerResponse) {
  const originHeader = req.headers.origin;
  const origin = originHeader && allowedOrigins.includes(originHeader)
    ? originHeader
    : allowedOrigins[0] || '*';

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
}

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function sendEmpty(res: ServerResponse, statusCode: number) {
  res.statusCode = statusCode;
  res.end();
}

async function readJsonBody<T>(req: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {} as T;
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
}

function isAuthorized(req: IncomingMessage) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') && header.slice('Bearer '.length).trim().length > 0;
}

function getBearerToken(req: IncomingMessage) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
}

function normalizeMockMobileRole(value: string | undefined): MockMobileRole {
  if (value === 'coach' || value === 'vendor' || value === 'admin') {
    return value;
  }

  return 'customer';
}

function createMockSessionToken(role: MockMobileRole, phone: string) {
  return `mock-session::${role}::${phone}`;
}

function getMockUserFromToken(token: string): MockMobileUser {
  const [, rolePart, phonePart] = token.split('::');
  const role = normalizeMockMobileRole(rolePart);
  const phone = phonePart?.trim() || '+27821234567';

  if (role === 'vendor') {
    return {
      id: 'mock-vendor-1',
      phone,
      role,
      firstName: 'Marquee',
      lastName: 'Atelier',
    };
  }

  if (role === 'coach') {
    return {
      id: 'mock-coach-1',
      phone,
      role,
      firstName: 'Lungi',
      lastName: '',
    };
  }

  if (role === 'admin') {
    return {
      id: 'mock-admin-1',
      phone,
      role,
      firstName: 'STITCHD',
      lastName: 'Admin',
    };
  }

  return {
    id: 'mock-customer-1',
    phone,
    role,
    firstName: 'Amahle',
    lastName: 'Dlamini',
  };
}

function getDashboardMetrics() {
  return {
    customerCount: 248,
    coachCount: 12,
    totalSignups: 264,
    activeWeddingEvents: 186,
    totalPaidCents: 5480000,
    vendorListingCount: 17,
  };
}

function parsePlannerEventType(value: string | null): PlannerEventType | undefined {
  if (
    value === 'wedding'
    || value === 'lobola'
    || value === 'funeral'
    || value === 'corporate'
    || value === 'birthday'
  ) {
    return value;
  }

  return undefined;
}

function parsePlannerPersona(value: string | null): PlannerPersona | undefined {
  if (value === 'client' || value === 'supplier' || value === 'coach' || value === 'admin') {
    return value;
  }

  return undefined;
}

const server = createServer(async (req, res) => {
  applyCors(req, res);

  if (!req.url || !req.method) {
    sendJson(res, 400, { message: 'Invalid request.' });
    return;
  }

  if (req.method === 'OPTIONS') {
    sendEmpty(res, 204);
    return;
  }

  const requestUrl = new URL(req.url, `http://${host}:${port}`);
  const { pathname } = requestUrl;

  try {
    if (req.method === 'GET' && pathname === '/api/v1') {
      sendJson(res, 200, {
        status: 'ok',
        service: 'stitchd-api-mock',
        mode: 'mock',
        routes: {
          health: '/api/v1/health',
          plannerMvp: '/api/v1/planner/mvp',
          plannerSurface: '/api/v1/planner/surface',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/v1/health') {
      sendJson(res, 200, {
        status: 'ok',
        service: 'stitchd-api-mock',
        mode: 'mock',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/v1/planner/mvp') {
      const eventType = parsePlannerEventType(requestUrl.searchParams.get('eventType'));
      const persona = parsePlannerPersona(requestUrl.searchParams.get('persona'));
      sendJson(res, 200, plannerService.getMvpExperience(eventType, persona));
      return;
    }

    if (req.method === 'GET' && pathname === '/api/v1/planner/surface') {
      const eventType = parsePlannerEventType(requestUrl.searchParams.get('eventType'));
      sendJson(res, 200, getPlannerSurface(eventType));
      return;
    }

    if (req.method === 'POST' && (pathname === '/api/v1/planner/auto-pick' || pathname === '/api/v1/ai/auto-pick')) {
      const body = await readJsonBody<{ eventType?: PlannerEventType }>(req);
      const surface = getPlannerSurface(body.eventType);
      sendJson(res, 200, {
        title: 'AI picked your squad',
        core: surface.autoPick.core,
        support: surface.autoPick.support,
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/admin/login') {
      const body = await readJsonBody<{ email?: string; password?: string }>(req);

      if (!body.email?.trim() || !body.password?.trim()) {
        sendJson(res, 401, { message: 'Email and password are required for local admin login.' });
        return;
      }

      sendJson(res, 200, {
        accessToken: mockAccessToken,
        refreshToken: 'mock-admin-refresh-token',
        user: {
          email: body.email.trim(),
          firstName: 'STITCHD',
          lastName: 'Admin',
        },
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/send-otp') {
      const body = await readJsonBody<{ phone?: string }>(req);

      if (!body.phone?.trim()) {
        sendJson(res, 400, { message: 'Phone number is required.' });
        return;
      }

      sendJson(res, 200, {
        success: true,
        message: 'OTP sent successfully.',
        otpHint: 'Use 123456 for local sign-in.',
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/verify-otp') {
      const body = await readJsonBody<{ phone?: string; code?: string; role?: string }>(req);

      if (!body.phone?.trim() || !body.code?.trim()) {
        sendJson(res, 400, { message: 'Phone number and OTP code are required.' });
        return;
      }

      if (body.code.trim() !== '123456') {
        sendJson(res, 401, { message: 'Invalid OTP. Use 123456 for local sign-in.' });
        return;
      }

      const role = normalizeMockMobileRole(body.role);
      const user = getMockUserFromToken(createMockSessionToken(role, body.phone.trim()));

      sendJson(res, 200, {
        accessToken: createMockSessionToken(role, user.phone),
        refreshToken: `mock-refresh::${role}::${user.phone}`,
        isNewUser: false,
        user,
      });
      return;
    }

    if (pathname === '/api/v1/users/me' || pathname === '/api/v1/notifications/mine') {
      if (!isAuthorized(req)) {
        sendJson(res, 401, { message: 'Unauthorized' });
        return;
      }
    }

    if (req.method === 'GET' && pathname === '/api/v1/users/me') {
      sendJson(res, 200, getMockUserFromToken(getBearerToken(req)));
      return;
    }

    if (req.method === 'GET' && pathname === '/api/v1/notifications/mine') {
      sendJson(res, 200, {
        unreadCount: 1,
        items: [
          {
            id: 'notif-1',
            title: 'Coach note ready',
            body: 'Your latest planner note and supplier actions are available.',
            type: 'planner_update',
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        ],
      });
      return;
    }

    if (pathname.startsWith('/api/v1/admin/') || pathname === '/api/v1/admin/settings') {
      if (!isAuthorized(req)) {
        sendJson(res, 401, { message: 'Unauthorized' });
        return;
      }
    }

    if (req.method === 'GET' && pathname === '/api/v1/admin/settings') {
      sendJson(res, 200, settings);
      return;
    }

    if (req.method === 'PATCH' && pathname === '/api/v1/admin/settings') {
      const body = await readJsonBody<Partial<PlatformSettings>>(req);
      Object.assign(settings, body);
      sendJson(res, 200, settings);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/v1/admin/dashboard-metrics') {
      sendJson(res, 200, getDashboardMetrics());
      return;
    }

    sendJson(res, 404, { message: 'Mock endpoint not found.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error.';
    sendJson(res, 500, { message });
  }
});

server.listen(port, host, () => {
  console.log(`STITCHD mock API running at http://${host}:${port}/api/v1`);
  console.log(`Health endpoint: http://${host}:${port}/api/v1/health`);
});
