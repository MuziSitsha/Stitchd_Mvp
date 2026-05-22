import { FormEvent, useEffect, useMemo, useState } from 'react';

import plannerImage from '../../mobile/assets/service-images/maid-service.jpg';
import venueImage from '../../mobile/assets/service-images/home-cleaning.jpg';
import photographyImage from '../../mobile/assets/service-images/appliance-repair.jpg';
import cateringImage from '../../mobile/assets/service-images/handyman-assist.jpg';
import floralsImage from '../../mobile/assets/service-images/spa-and-massage.jpg';
import entertainmentImage from '../../mobile/assets/service-images/book-a-mechanic.jpg';
import mcImage from '../../mobile/assets/service-images/urgent-electrical.jpg';
import glamImage from '../../mobile/assets/service-images/salon-at-home.jpg';
import transportImage from '../../mobile/assets/service-images/pest-control.jpg';
import decorImage from '../../mobile/assets/service-images/deep-cleaning.jpg';
import tentImage from '../../mobile/assets/service-images/garden-and-outdoor.jpg';

type IconProps = {
  className?: string;
};

function TeamIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ChatIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function DocumentIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function CalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  );
}

function BellIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

function ClockIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function BriefcaseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}

function CloudIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 18a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.7-1.5A4.5 4.5 0 1 0 6 18Z" />
    </svg>
  );
}

function PlusIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function ShieldIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function UsersIcon({ className }: IconProps) {
  return <TeamIcon className={className} />;
}

function LabourIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="m17 11 2 2 4-4" />
    </svg>
  );
}

function MessageSquareIcon({ className }: IconProps) {
  return <ChatIcon className={className} />;
}

type PlatformSettings = {
  defaultCommissionRate: number;
  cashPaymentsEnabled: boolean;
  cardPaymentsEnabled: boolean;
  walletPaymentsEnabled: boolean;
  instantBookingsEnabled: boolean;
  scheduledBookingsEnabled: boolean;
  businessLegalName?: string;
  payoutBankName?: string;
  payoutAccountHolder?: string;
  payoutAccountNumber?: string;
  payoutAccountType?: string;
  payoutBranchCode?: string;
  payoutReference?: string;
};

type ProviderDocument = {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl?: string;
  status: 'submitted' | 'approved' | 'rejected';
  reviewNote?: string;
  createdAt: string;
};

type PendingProvider = {
  userId: string;
  serviceArea?: string;
  yearsExperience?: number;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  documentsSubmitted: boolean;
  user?: {
    firstName?: string;
    lastName?: string;
    phone: string;
    email?: string;
  };
  documents: ProviderDocument[];
};

type DashboardMetrics = {
  customerCount: number;
  providerCount: number;
  pendingVerifications: number;
  activeBookings: number;
  scheduledBookings: number;
  completedBookings: number;
  paidTransactions: number;
  grossMerchandiseValueCents: number;
  providerPayoutsCents: number;
  averageRating: number;
};

type RecentPayment = {
  id: string;
  bookingId: string;
  bookingRef?: string;
  paymentMethod: string;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  amountCents: number;
  commissionCents: number;
  providerEarningsCents: number;
  checkoutUrl?: string;
  updatedAt: string;
};

type AdminAuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: {
    email?: string;
    firstName?: string;
    lastName?: string;
  };
};

type SurfaceMode = 'planner' | 'ops';
type PlannerTab = 'squad' | 'suppliers' | 'budget' | 'inspiration' | 'marketplace';
type EventType = 'wedding' | 'lobola' | 'funeral' | 'corporate' | 'birthday';
type VendorStatus = 'secured' | 'booked' | 'optional' | 'recommended' | 'at_risk';

type VendorCardData = {
  id: string;
  slot: string;
  subcategory: string;
  name: string;
  rating: number;
  reviewCount: number;
  priceLabel: string;
  score: number;
  status: VendorStatus;
  image: string;
};

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

type PlannerExperience = {
  title: string;
  intro: string;
  strapline: string;
  budgetTotal: number;
  compatibilityScore: number;
  labourProgress: string;
  timelineStatus: 'On Track' | 'Behind' | 'At Risk';
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
  squad: {
    core: PlannerVendorPayload[];
    support: PlannerVendorPayload[];
  };
};

const plannerActionIcons = [TeamIcon, ChatIcon, DocumentIcon, CalendarIcon, BellIcon];

const statusMetricIcons = {
  Secured: ShieldIcon,
  'Squad Chemistry': UsersIcon,
  'Labour Tracker': LabourIcon,
  'Timeline Sync': CalendarIcon,
  Communication: MessageSquareIcon,
} as const;

const plannerImageByKey: Record<string, string> = {
  'maid-service': plannerImage,
  'home-cleaning': venueImage,
  'appliance-repair': photographyImage,
  'handyman-assist': cateringImage,
  'spa-and-massage': floralsImage,
  'book-a-mechanic': entertainmentImage,
  'urgent-electrical': mcImage,
  'salon-at-home': glamImage,
  'pest-control': transportImage,
  'deep-cleaning': decorImage,
  'garden-and-outdoor': tentImage,
};

function mapPlannerVendor(vendor: PlannerVendorPayload): VendorCardData {
  return {
    id: vendor.id,
    slot: vendor.slot,
    subcategory: vendor.subcategory,
    name: vendor.name,
    rating: vendor.rating,
    reviewCount: vendor.reviewCount,
    priceLabel: vendor.priceLabel,
    score: vendor.score,
    status: vendor.status,
    image: plannerImageByKey[vendor.imageKey] || plannerImage,
  };
}

const STAGING_HTTPS_API_BASE_URL = 'https://api-staging.stitchd.co.za/api/v1';

const plannerTabs: Array<{ id: PlannerTab; label: string }> = [
  { id: 'squad', label: 'Squad' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'budget', label: 'Budget' },
  { id: 'inspiration', label: 'Inspiration' },
  { id: 'marketplace', label: 'Marketplace' },
];

const eventOptions: Array<{ value: EventType; label: string; strapline: string; intro: string }> = [
  {
    value: 'wedding',
    label: 'Wedding Labour',
    strapline: 'Luxury ceremony planning with supplier chemistry and weather-aware backup logic.',
    intro: 'Build the full wedding squad, watch compatibility, and keep every vendor aligned to one timeline.',
  },
  {
    value: 'lobola',
    label: 'Lobola Coordination',
    strapline: 'Digitise a deeply cultural event without removing the human coach layer.',
    intro: 'Track elders, venue, attire, catering, transport, and ceremonial logistics with dignity and clarity.',
  },
  {
    value: 'funeral',
    label: 'Funeral Planning',
    strapline: 'Fast coordination for the most stressful event category with a calmer operating surface.',
    intro: 'Handle tents, pastor, flowers, catering, and programme printing with rapid recommendations.',
  },
  {
    value: 'corporate',
    label: 'Corporate Events',
    strapline: 'B2B-friendly event assembly with cleaner vendor comparison and central comms.',
    intro: 'Plan launches, year-end functions, and team experiences with budget clarity from day one.',
  },
  {
    value: 'birthday',
    label: 'Birthday Experiences',
    strapline: 'High-frequency milestone planning with cards that reduce decision paralysis.',
    intro: 'Package venue, cake, decor, photography, and entertainment into a squad people can trust quickly.',
  },
];

const eventNames: Record<EventType, string> = {
  wedding: 'Merc and Lelo Wedding Weekend',
  lobola: 'Masego Lobola Delegation',
  funeral: 'Ndlovu Memorial Service',
  corporate: 'Founders Summit 2026',
  birthday: 'Ayanda 30th Celebration',
};

const coachByEvent: Record<EventType, { name: string; role: string; score: string; events: number }> = {
  wedding: { name: 'Merk Clo', role: 'Lead Planner and Strategist', score: '4.9', events: 127 },
  lobola: { name: 'Nono Dube', role: 'Tradition and Family Coordinator', score: '4.8', events: 94 },
  funeral: { name: 'Sizwe K', role: 'Family Support and Logistics Coach', score: '4.9', events: 156 },
  corporate: { name: 'Karabo M', role: 'Event Operations Lead', score: '4.7', events: 203 },
  birthday: { name: 'Tumi N', role: 'Celebration Curator', score: '4.8', events: 88 },
};

const weatherByEvent: Record<EventType, { label: string; temperature: string; rainChance: number; alert: string }> = {
  wedding: { label: 'Partly Cloudy', temperature: '23°', rainChance: 65, alert: 'We recommend adding a tent supplier to protect the aisle and reception layout.' },
  lobola: { label: 'Clear Evening', temperature: '19°', rainChance: 10, alert: 'Weather is stable. Prioritise transport and family arrival sequencing instead.' },
  funeral: { label: 'Light Showers', temperature: '17°', rainChance: 55, alert: 'Add tenting and covered seating to reduce disruption for mourners.' },
  corporate: { label: 'Sunny', temperature: '25°', rainChance: 5, alert: 'No weather risk. AV and guest-flow coordination are the tighter constraints.' },
  birthday: { label: 'Warm Breeze', temperature: '27°', rainChance: 18, alert: 'Plan shade and drinks stations if the event is outdoors.' },
};

const plannerScheduleByEvent: Record<EventType, { eventDate: string; planningStartDate: string }> = {
  wedding: { eventDate: '2026-10-24', planningStartDate: '2026-05-01' },
  lobola: { eventDate: '2026-07-12', planningStartDate: '2026-04-15' },
  funeral: { eventDate: '2026-06-03', planningStartDate: '2026-05-20' },
  corporate: { eventDate: '2026-08-18', planningStartDate: '2026-03-10' },
  birthday: { eventDate: '2026-06-20', planningStartDate: '2026-04-01' },
};

const vendorBoard: Record<EventType, { core: VendorCardData[]; support: VendorCardData[] }> = {
  wedding: {
    core: [
      { id: 'planner', slot: 'Planner', subcategory: 'The Perfect Plan Co.', name: 'Wedding Planner', rating: 4.9, reviewCount: 128, priceLabel: 'R35,000', score: 92, status: 'secured', image: plannerImage },
      { id: 'venue', slot: 'Venue', subcategory: 'Premium Venue', name: 'Luxe Manor', rating: 4.8, reviewCount: 96, priceLabel: 'R85,000', score: 90, status: 'secured', image: venueImage },
      { id: 'photo', slot: 'Photography', subcategory: 'Photo and Video', name: 'Memories by TK', rating: 4.9, reviewCount: 201, priceLabel: 'R28,000', score: 89, status: 'secured', image: photographyImage },
      { id: 'catering', slot: 'Catering', subcategory: 'Luxury Catering', name: 'Taste Affair', rating: 4.7, reviewCount: 80, priceLabel: 'R65,000', score: 88, status: 'secured', image: cateringImage },
      { id: 'florals', slot: 'Florals', subcategory: 'Floral Designer', name: 'Bloom Room', rating: 4.9, reviewCount: 74, priceLabel: 'R22,000', score: 87, status: 'secured', image: floralsImage },
      { id: 'entertainment', slot: 'Entertainment', subcategory: 'DJ', name: 'Vibe Creators', rating: 4.8, reviewCount: 156, priceLabel: 'R15,000', score: 85, status: 'booked', image: entertainmentImage },
    ],
    support: [
      { id: 'mc', slot: 'MC', subcategory: 'Ceremony Host', name: 'Master of Ceremonies', rating: 4.8, reviewCount: 65, priceLabel: 'R6,000', score: 84, status: 'optional', image: mcImage },
      { id: 'hair', slot: 'Hair and Makeup', subcategory: 'Glam Squad', name: 'Glam Squad', rating: 4.7, reviewCount: 68, priceLabel: 'R9,000', score: 83, status: 'optional', image: glamImage },
      { id: 'transport', slot: 'Transport', subcategory: 'VIP Transport', name: 'VIP Transport', rating: 4.8, reviewCount: 40, priceLabel: 'R12,000', score: 82, status: 'optional', image: transportImage },
      { id: 'decor', slot: 'Decor', subcategory: 'Decor Elegance', name: 'Decor Elegance', rating: 4.6, reviewCount: 47, priceLabel: 'R18,000', score: 80, status: 'optional', image: decorImage },
      { id: 'tent', slot: 'Tent Supplier', subcategory: 'Weather Backup', name: 'Tent Supplier', rating: 4.8, reviewCount: 54, priceLabel: 'R18,500', score: 79, status: 'recommended', image: tentImage },
    ],
  },
  lobola: {
    core: [
      { id: 'family-coordinator', slot: 'Delegation Lead', subcategory: 'Family Protocol', name: 'Nono Delegation Desk', rating: 4.8, reviewCount: 51, priceLabel: 'R18,000', score: 93, status: 'secured', image: plannerImage },
      { id: 'venue-lobola', slot: 'Venue', subcategory: 'Homestead Venue', name: 'Kganya Courtyard', rating: 4.9, reviewCount: 44, priceLabel: 'R28,000', score: 89, status: 'secured', image: venueImage },
      { id: 'catering-lobola', slot: 'Catering', subcategory: 'Traditional Catering', name: 'MmaDijo Kitchen', rating: 4.8, reviewCount: 70, priceLabel: 'R32,000', score: 88, status: 'secured', image: cateringImage },
      { id: 'attire', slot: 'Traditional Attire', subcategory: 'Styled Coordination', name: 'Heritage Threads', rating: 4.7, reviewCount: 31, priceLabel: 'R15,000', score: 86, status: 'booked', image: floralsImage },
      { id: 'photo-lobola', slot: 'Photography', subcategory: 'Ceremony Coverage', name: 'Moments by Leso', rating: 4.8, reviewCount: 63, priceLabel: 'R14,500', score: 85, status: 'booked', image: photographyImage },
      { id: 'transport-lobola', slot: 'Transport', subcategory: 'Family Shuttle', name: 'Arrival Convoy', rating: 4.7, reviewCount: 22, priceLabel: 'R9,000', score: 82, status: 'booked', image: transportImage },
    ],
    support: [
      { id: 'elders', slot: 'Elders Host', subcategory: 'Protocol Guide', name: 'Respect Circle', rating: 4.9, reviewCount: 19, priceLabel: 'R6,500', score: 84, status: 'recommended', image: mcImage },
      { id: 'livestock', slot: 'Cattle Sourcing', subcategory: 'Cultural Sourcing', name: 'Cattle Link', rating: 4.7, reviewCount: 28, priceLabel: 'R21,000', score: 82, status: 'optional', image: tentImage },
      { id: 'decor-lobola', slot: 'Decor', subcategory: 'Traditional Decor', name: 'Khaya Decor', rating: 4.6, reviewCount: 17, priceLabel: 'R11,000', score: 79, status: 'optional', image: decorImage },
      { id: 'mc-lobola', slot: 'MC', subcategory: 'Speaker and Translator', name: 'Family Voice', rating: 4.8, reviewCount: 12, priceLabel: 'R5,500', score: 78, status: 'optional', image: glamImage },
      { id: 'rain-lobola', slot: 'Tent Supplier', subcategory: 'Backup Marquee', name: 'Courtyard Cover', rating: 4.5, reviewCount: 21, priceLabel: 'R12,500', score: 77, status: 'optional', image: tentImage },
    ],
  },
  funeral: {
    core: [
      { id: 'undertaker', slot: 'Undertaker', subcategory: 'Dignified Care', name: 'Resthaven Services', rating: 4.9, reviewCount: 140, priceLabel: 'R38,000', score: 94, status: 'secured', image: plannerImage },
      { id: 'tent-funeral', slot: 'Tent', subcategory: 'Covered Seating', name: 'Shelter SA', rating: 4.7, reviewCount: 83, priceLabel: 'R18,000', score: 88, status: 'booked', image: tentImage },
      { id: 'catering-funeral', slot: 'Catering', subcategory: 'Family Catering', name: 'Grace Kitchen', rating: 4.8, reviewCount: 90, priceLabel: 'R22,000', score: 87, status: 'secured', image: cateringImage },
      { id: 'florals-funeral', slot: 'Flowers', subcategory: 'Memorial Florals', name: 'White Bloom', rating: 4.8, reviewCount: 63, priceLabel: 'R9,000', score: 84, status: 'secured', image: floralsImage },
      { id: 'print-funeral', slot: 'Programmes', subcategory: 'Print and Design', name: 'Quiet Print', rating: 4.6, reviewCount: 29, priceLabel: 'R4,500', score: 81, status: 'booked', image: decorImage },
      { id: 'transport-funeral', slot: 'Transport', subcategory: 'Family Transport', name: 'Community Shuttle', rating: 4.7, reviewCount: 35, priceLabel: 'R10,000', score: 80, status: 'booked', image: transportImage },
    ],
    support: [
      { id: 'pastor', slot: 'Pastor', subcategory: 'Service Leader', name: 'Pastor Network', rating: 4.9, reviewCount: 48, priceLabel: 'R3,000', score: 83, status: 'optional', image: mcImage },
      { id: 'choir', slot: 'Choir', subcategory: 'Memorial Music', name: 'Hymn Collective', rating: 4.8, reviewCount: 26, priceLabel: 'R5,000', score: 80, status: 'optional', image: entertainmentImage },
      { id: 'security', slot: 'Security', subcategory: 'Guest Support', name: 'Quiet Guard', rating: 4.5, reviewCount: 18, priceLabel: 'R4,000', score: 77, status: 'optional', image: transportImage },
      { id: 'heatmap', slot: 'Family Liaison', subcategory: 'Guest Flow', name: 'Support Liaison', rating: 4.7, reviewCount: 21, priceLabel: 'R3,500', score: 79, status: 'recommended', image: glamImage },
      { id: 'backup-funeral', slot: 'Covered Walkway', subcategory: 'Rain Backup', name: 'Walkway Cover', rating: 4.5, reviewCount: 17, priceLabel: 'R7,500', score: 76, status: 'recommended', image: tentImage },
    ],
  },
  corporate: {
    core: [
      { id: 'producer', slot: 'Producer', subcategory: 'Run of Show', name: 'Signal Events', rating: 4.8, reviewCount: 118, priceLabel: 'R42,000', score: 91, status: 'secured', image: plannerImage },
      { id: 'venue-corp', slot: 'Venue', subcategory: 'Launch Venue', name: 'Glass Works', rating: 4.7, reviewCount: 67, priceLabel: 'R90,000', score: 89, status: 'booked', image: venueImage },
      { id: 'av', slot: 'AV', subcategory: 'Production and Sound', name: 'Stage Sync', rating: 4.8, reviewCount: 92, priceLabel: 'R65,000', score: 88, status: 'secured', image: entertainmentImage },
      { id: 'catering-corp', slot: 'Catering', subcategory: 'Executive Catering', name: 'Boardroom Table', rating: 4.6, reviewCount: 71, priceLabel: 'R48,000', score: 84, status: 'booked', image: cateringImage },
      { id: 'photo-corp', slot: 'Photography', subcategory: 'Brand Capture', name: 'Launch Lens', rating: 4.7, reviewCount: 59, priceLabel: 'R18,000', score: 83, status: 'booked', image: photographyImage },
      { id: 'host-corp', slot: 'Host', subcategory: 'Moderator', name: 'Stage Host', rating: 4.8, reviewCount: 31, priceLabel: 'R11,000', score: 81, status: 'booked', image: mcImage },
    ],
    support: [
      { id: 'content', slot: 'Content Desk', subcategory: 'Social Coverage', name: 'Recap Studio', rating: 4.7, reviewCount: 40, priceLabel: 'R14,000', score: 82, status: 'optional', image: glamImage },
      { id: 'transport-corp', slot: 'Transport', subcategory: 'Executive Shuttle', name: 'Fleet Link', rating: 4.5, reviewCount: 22, priceLabel: 'R9,500', score: 79, status: 'optional', image: transportImage },
      { id: 'decor-corp', slot: 'Set Design', subcategory: 'Stage Styling', name: 'Set Build', rating: 4.6, reviewCount: 20, priceLabel: 'R16,000', score: 80, status: 'optional', image: decorImage },
      { id: 'backup-power', slot: 'Power Backup', subcategory: 'Generator Desk', name: 'Grid Backup', rating: 4.8, reviewCount: 12, priceLabel: 'R7,000', score: 78, status: 'recommended', image: tentImage },
      { id: 'guest-app', slot: 'Check-in', subcategory: 'Digital Registration', name: 'Flow Check', rating: 4.6, reviewCount: 16, priceLabel: 'R6,500', score: 77, status: 'optional', image: venueImage },
    ],
  },
  birthday: {
    core: [
      { id: 'planner-birthday', slot: 'Planner', subcategory: 'Party Curator', name: 'Glow Up Events', rating: 4.9, reviewCount: 78, priceLabel: 'R16,000', score: 90, status: 'secured', image: plannerImage },
      { id: 'venue-birthday', slot: 'Venue', subcategory: 'Private Lounge', name: 'Studio Noir', rating: 4.8, reviewCount: 44, priceLabel: 'R22,000', score: 87, status: 'secured', image: venueImage },
      { id: 'cake', slot: 'Cake', subcategory: 'Luxury Cake Studio', name: 'Sugar Scene', rating: 4.9, reviewCount: 61, priceLabel: 'R4,500', score: 85, status: 'booked', image: floralsImage },
      { id: 'photo-birthday', slot: 'Photography', subcategory: 'Party Coverage', name: 'Flash Social', rating: 4.7, reviewCount: 87, priceLabel: 'R8,000', score: 83, status: 'booked', image: photographyImage },
      { id: 'dj-birthday', slot: 'DJ', subcategory: 'Entertainment', name: 'Night Shift', rating: 4.8, reviewCount: 91, priceLabel: 'R12,000', score: 84, status: 'secured', image: entertainmentImage },
      { id: 'catering-birthday', slot: 'Catering', subcategory: 'Party Bites', name: 'Late Table', rating: 4.6, reviewCount: 38, priceLabel: 'R15,000', score: 82, status: 'booked', image: cateringImage },
    ],
    support: [
      { id: 'decor-birthday', slot: 'Decor', subcategory: 'Statement Decor', name: 'After Dark Decor', rating: 4.8, reviewCount: 33, priceLabel: 'R10,000', score: 81, status: 'optional', image: decorImage },
      { id: 'glam-birthday', slot: 'Glam', subcategory: 'Hair and Makeup', name: 'Ready Room', rating: 4.7, reviewCount: 41, priceLabel: 'R7,000', score: 80, status: 'optional', image: glamImage },
      { id: 'transport-birthday', slot: 'Transport', subcategory: 'Arrival Car', name: 'Midnight Drive', rating: 4.6, reviewCount: 20, priceLabel: 'R6,800', score: 78, status: 'optional', image: transportImage },
      { id: 'content-birthday', slot: 'Content', subcategory: 'Social Capture', name: 'Loop Studio', rating: 4.7, reviewCount: 27, priceLabel: 'R5,500', score: 79, status: 'recommended', image: mcImage },
      { id: 'bar-birthday', slot: 'Bar', subcategory: 'Signature Cocktails', name: 'Toast Bar', rating: 4.8, reviewCount: 14, priceLabel: 'R9,500', score: 77, status: 'optional', image: tentImage },
    ],
  },
};

function resolveDefaultApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured) {
    return configured;
  }

  const hostname = window.location.hostname;
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
  if (isLocalHost) {
    return 'http://127.0.0.1:3001/api/v1';
  }

  return STAGING_HTTPS_API_BASE_URL;
}

const DEFAULT_API_BASE_URL = resolveDefaultApiBaseUrl();

function getInitialApiBaseUrl() {
  const stored = localStorage.getItem('stitchd.admin.apiBaseUrl');
  const onSecurePage = window.location.protocol === 'https:';
  const hostname = window.location.hostname;
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';

  if (
    !stored
    || stored === 'http://localhost:3001/api/v1'
    || stored === 'http://127.0.0.1:3001/api/v1'
    || (onSecurePage && stored.startsWith('http://'))
    || (!isLocalHost && stored.includes('127.0.0.1'))
    || (!isLocalHost && stored.includes('localhost'))
  ) {
    return DEFAULT_API_BASE_URL;
  }

  return stored;
}

function getMetricColor(value: string) {
  if (value === 'On Track') return 'is-green';
  if (value === 'Behind') return 'is-gold';
  if (value === 'At Risk') return 'is-red';
  if (value === 'Centralised') return 'is-purple';
  return '';
}

function formatCurrencyFromRands(amount: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatStars(rating: number) {
  return `★ ${rating.toFixed(1)}`;
}

function formatPlannerDateLabel(dateValue: string) {
  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateValue)).toUpperCase();
}

function calculateDayDifference(targetDate: string) {
  const now = new Date();
  const target = new Date(targetDate);
  const diffMs = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function calculatePlanningProgress(eventDate: string, planningStartDate: string) {
  const start = new Date(planningStartDate).getTime();
  const end = new Date(eventDate).getTime();
  const now = Date.now();

  if (end <= start) {
    return 0;
  }

  const ratio = (now - start) / (end - start);
  return Math.max(0, Math.min(100, Math.round(ratio * 100)));
}

function getWeatherTone(rainChance: number) {
  if (rainChance > 40) return 'is-purple';
  if (rainChance < 20) return 'is-green';
  return '';
}

export function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState(getInitialApiBaseUrl);
  const [email, setEmail] = useState(() => localStorage.getItem('stitchd.admin.email') || 'admin@stitchd.co.za');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem('stitchd.admin.token') || '');
  const [adminIdentity, setAdminIdentity] = useState(() => localStorage.getItem('stitchd.admin.identity') || '');
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [pendingProviders, setPendingProviders] = useState<PendingProvider[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeveloperSettings, setShowDeveloperSettings] = useState(false);
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>('planner');
  const [activeTab, setActiveTab] = useState<PlannerTab>('squad');
  const [selectedEventType, setSelectedEventType] = useState<EventType>('wedding');
  const [plannerExperience, setPlannerExperience] = useState<PlannerExperience | null>(null);
  const [plannerLoading, setPlannerLoading] = useState(false);

  const payoutProfileReady = Boolean(
    settings?.businessLegalName?.trim()
      && settings.payoutBankName?.trim()
      && settings.payoutAccountHolder?.trim()
      && settings.payoutAccountNumber?.trim()
      && settings.payoutAccountType?.trim()
      && settings.payoutBranchCode?.trim(),
  );

  function formatCurrency(cents: number) {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0,
    }).format(cents / 100);
  }

  const stats = useMemo(() => {
    const pendingCount = metrics?.pendingVerifications ?? pendingProviders.length;
    const documentCount = pendingProviders.reduce((count, provider) => count + provider.documents.length, 0);
    return [
      { label: 'Pending Reviews', value: String(pendingCount).padStart(2, '0'), detail: 'Provider verification queue' },
      { label: 'Documents Submitted', value: String(documentCount).padStart(2, '0'), detail: 'Files ready for compliance review' },
      {
        label: 'Gross Volume',
        value: metrics ? formatCurrency(metrics.grossMerchandiseValueCents) : '--',
        detail: 'All payment transactions on record',
      },
      {
        label: 'Provider Payouts',
        value: metrics ? formatCurrency(metrics.providerPayoutsCents) : '--',
        detail: 'Paid earnings booked to wallets',
      },
      {
        label: 'Paid Transactions',
        value: metrics ? String(metrics.paidTransactions).padStart(2, '0') : '--',
        detail: 'Confirmed settlements across supported rails',
      },
      {
        label: 'Avg Rating',
        value: metrics ? metrics.averageRating.toFixed(1) : '--',
        detail: 'Marketplace quality signal from reviews',
      },
      {
        label: 'Commission Rate',
        value: settings ? `${Math.round(settings.defaultCommissionRate * 100)}%` : '--',
        detail: 'Applied to newly created bookings',
      },
    ];
  }, [metrics, pendingProviders, settings]);

  const baseEventOption = eventOptions.find((option) => option.value === selectedEventType) || eventOptions[0];
  const selectedEventOption = {
    ...baseEventOption,
    intro: plannerExperience?.intro || baseEventOption.intro,
    strapline: plannerExperience?.strapline || baseEventOption.strapline,
  };
  const selectedCoach = plannerExperience
    ? {
        name: plannerExperience.coach.name,
        role: plannerExperience.coach.role,
        score: plannerExperience.coach.rating.toFixed(1),
        events: plannerExperience.coach.eventsCompleted,
      }
    : coachByEvent[selectedEventType];
  const selectedWeather = plannerExperience?.weather || weatherByEvent[selectedEventType];
  const selectedSchedule = plannerScheduleByEvent[selectedEventType];
  const selectedBoard = plannerExperience
    ? {
        core: plannerExperience.squad.core.map(mapPlannerVendor),
        support: plannerExperience.squad.support.map(mapPlannerVendor),
      }
    : vendorBoard[selectedEventType];
  const allocatedAmount = selectedBoard.core.concat(selectedBoard.support).reduce((total, vendor) => {
    const numeric = Number(vendor.priceLabel.replace(/[^0-9]/g, ''));
    return total + (Number.isFinite(numeric) ? numeric : 0);
  }, 0);
  const totalBudget = plannerExperience?.budgetTotal || (selectedEventType === 'corporate' ? 520000 : selectedEventType === 'lobola' ? 180000 : selectedEventType === 'funeral' ? 140000 : selectedEventType === 'birthday' ? 95000 : 400000);
  const budgetProgress = Math.min(100, Math.round((allocatedAmount / totalBudget) * 100));
  const chemistry = plannerExperience?.compatibilityScore || (selectedEventType === 'wedding' ? 82 : selectedEventType === 'lobola' ? 88 : selectedEventType === 'funeral' ? 79 : selectedEventType === 'corporate' ? 86 : 84);
  const securedCount = selectedBoard.core.filter((vendor) => vendor.status === 'secured' || vendor.status === 'booked').length;
  const totalSlots = selectedBoard.core.length + selectedBoard.support.length + 2;
  const labourValue = plannerExperience?.labourProgress || (selectedEventType === 'funeral' ? '24/28' : selectedEventType === 'corporate' ? '17/20' : selectedEventType === 'lobola' ? '14/16' : selectedEventType === 'birthday' ? '11/14' : '28/33');
  const timelineValue = plannerExperience?.timelineStatus || (selectedWeather.rainChance > 50 && selectedEventType !== 'corporate' ? 'Behind' : 'On Track');
  const daysToEvent = calculateDayDifference(selectedSchedule.eventDate);
  const planningProgress = calculatePlanningProgress(selectedSchedule.eventDate, selectedSchedule.planningStartDate);
  const forecastDays = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
    const rainChance = Math.max(selectedWeather.rainChance - (index * 12), 8);
    return {
      day,
      temperature: `${selectedEventType === 'birthday' ? 26 - index : 21 + index}°`,
      rainChance,
      icon: rainChance > 40 ? '☂' : rainChance < 20 ? '☀' : '☁',
      isEventDay: index === 2,
    };
  });

  useEffect(() => {
    localStorage.setItem('stitchd.admin.apiBaseUrl', apiBaseUrl);
  }, [apiBaseUrl]);

  useEffect(() => {
    localStorage.setItem('stitchd.admin.email', email);
  }, [email]);

  useEffect(() => {
    localStorage.setItem('stitchd.admin.token', token);
  }, [token]);

  useEffect(() => {
    localStorage.setItem('stitchd.admin.identity', adminIdentity);
  }, [adminIdentity]);

  useEffect(() => {
    if (!token.trim()) return;
    void loadDashboard();
  }, []);

  useEffect(() => {
    if (surfaceMode !== 'planner') return;

    let cancelled = false;

    async function loadPlannerExperience() {
      setPlannerLoading(true);
      try {
        const response = await fetch(`${apiBaseUrl}/planner/mvp?eventType=${selectedEventType}&persona=admin`);
        if (!response.ok) {
          throw new Error(`Planner request failed with status ${response.status}`);
        }

        const payload = await response.json() as PlannerExperience;
        if (!cancelled) {
          setPlannerExperience(payload);
        }
      } catch {
        if (!cancelled) {
          setPlannerExperience(null);
        }
      } finally {
        if (!cancelled) {
          setPlannerLoading(false);
        }
      }
    }

    void loadPlannerExperience();

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, selectedEventType, surfaceMode]);

  async function request<T>(path: string, init?: RequestInit, accessToken = token) {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async function loginAdmin(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const auth = await request<AdminAuthResponse>(
        '/auth/admin/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
        '',
      );

      const identity = auth.user.email || [auth.user.firstName, auth.user.lastName].filter(Boolean).join(' ') || 'Admin';
      setToken(auth.accessToken);
      setAdminIdentity(identity);
      setPassword('');
      await loadDashboard(undefined, auth.accessToken);
      setStatusMessage(`Signed in as ${identity}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to sign in as admin.');
    } finally {
      setLoading(false);
    }
  }

  async function loadDashboard(event?: FormEvent, accessToken = token) {
    event?.preventDefault();
    if (!accessToken.trim()) {
      setErrorMessage('Sign in as an admin before loading the dashboard.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const [settingsResponse, pendingResponse, metricsResponse, recentPaymentsResponse] = await Promise.all([
        request<PlatformSettings>('/admin/settings', undefined, accessToken),
        request<PendingProvider[]>('/admin/providers/pending-verification', undefined, accessToken),
        request<DashboardMetrics>('/admin/dashboard-metrics', undefined, accessToken),
        request<RecentPayment[]>('/admin/payments/recent', undefined, accessToken),
      ]);

      setSettings(settingsResponse);
      setPendingProviders(pendingResponse);
      setMetrics(metricsResponse);
      setRecentPayments(recentPaymentsResponse);
      setStatusMessage(adminIdentity ? `Ops console connected as ${adminIdentity}.` : 'Ops console connected.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  }

  function signOut() {
    setToken('');
    setPassword('');
    setAdminIdentity('');
    setSettings(null);
    setMetrics(null);
    setRecentPayments([]);
    setPendingProviders([]);
    setStatusMessage('Signed out.');
    setErrorMessage('');
  }

  async function saveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const updatedSettings = await request<PlatformSettings>('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });
      setSettings(updatedSettings);
      setStatusMessage('Platform settings updated.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update settings.');
    } finally {
      setSavingSettings(false);
    }
  }

  async function reviewProvider(providerUserId: string, status: 'approved' | 'rejected') {
    setErrorMessage('');
    setStatusMessage('');

    try {
      await request(`/admin/providers/${providerUserId}/verification`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          note: reviewNotes[providerUserId] || undefined,
        }),
      });

      setPendingProviders((current) => current.filter((provider) => provider.userId !== providerUserId));
      setStatusMessage(`Provider ${status === 'approved' ? 'approved' : 'rejected'} successfully.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to review provider.');
    }
  }

  return (
    <main className="stitchdShell">
      <div className="pageGlow pageGlowLeft" />
      <div className="pageGlow pageGlowRight" />
      <section className="modeRail">
        <button type="button" className={`modePill ${surfaceMode === 'planner' ? 'is-active' : ''}`} onClick={() => setSurfaceMode('planner')}>
          STITCHD Planner
        </button>
        <button type="button" className={`modePill ${surfaceMode === 'ops' ? 'is-active' : ''}`} onClick={() => setSurfaceMode('ops')}>
          STITCHD Ops Console
        </button>
      </section>

      {surfaceMode === 'planner' ? (
        <section className="plannerSurface">
          <header className="plannerHeader glassPanel">
            <div className="brandPanel">
              <div className="brandWordmark">STITCHD</div>
              <p>{selectedEventOption.label}</p>
            </div>

            <nav className="plannerNav" aria-label="Primary planner tabs">
              {plannerTabs.map((tab) => (
                <button key={tab.id} type="button" className={`plannerNavTab ${activeTab === tab.id ? 'is-active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="coachCard glassPanel">
              <div className="coachAvatar">MC</div>
              <div>
                <span className="minorLabel">COACH</span>
                <strong>{selectedCoach.name}</strong>
                <p>{selectedCoach.role}</p>
                <div className="coachMeta">
                  <span className="scorePill">{selectedCoach.score}</span>
                  <span>{selectedCoach.events} events</span>
                </div>
              </div>
            </div>
          </header>

          <section className="heroStrip glassPanel">
            <div>
              <span className="minorLabel">Event Intelligence Engine</span>
              <h1>{plannerExperience?.title || eventNames[selectedEventType]}</h1>
              <p>{selectedEventOption.intro}</p>
            </div>
            <div className="heroActions">
              {eventOptions.map((option) => (
                <button key={option.value} type="button" className={`eventChip ${selectedEventType === option.value ? 'is-active' : ''}`} onClick={() => setSelectedEventType(option.value)}>
                  {option.label}
                </button>
              ))}
            </div>
            <div className="heroSummary glassPanel">
              <span className="minorLabel">Phase 1</span>
              <strong>Squad View Live</strong>
              <p>{selectedEventOption.strapline}</p>
              {plannerLoading ? <p>Refreshing live planner data...</p> : null}
            </div>
          </section>

          <section className="plannerLayout">
            <aside className="plannerLeftRail">
              <div className="summaryCard glassPanel">
                <span className="minorLabel">Budget Overview</span>
                <strong>{formatCurrencyFromRands(allocatedAmount)}</strong>
                <p>of {formatCurrencyFromRands(totalBudget)}</p>
                <div className="progressTrack"><span style={{ width: `${budgetProgress}%` }} /></div>
                <div className="splitMeta">
                  <span>{budgetProgress}% allocated</span>
                  <span>{formatCurrencyFromRands(Math.max(totalBudget - allocatedAmount, 0))} left</span>
                </div>
              </div>

              <div className="summaryCard glassPanel">
                <span className="minorLabel">Squad Chemistry</span>
                <strong>{chemistry}%</strong>
                <div className="chemistryBars">
                  {[0, 1, 2, 3, 4, 5].map((value) => (
                    <span key={value} className={value < Math.round(chemistry / 16) ? 'is-filled' : ''} />
                  ))}
                </div>
                <p>Compatibility engine is reducing vendor conflict before the event day.</p>
              </div>

              <div className="summaryCard glassPanel">
                <span className="minorLabel">Labour Secured</span>
                <strong>{securedCount}/{totalSlots}</strong>
                <p>Essential roles are landing. Coaches are still filling backup suppliers.</p>
              </div>

              <div className="summaryCard summaryCardAccent glassPanel">
                <span className="minorLabel">Why this matters</span>
                <strong>From marketplace to planning engine</strong>
                <p>One operating system now stretches across weddings, lobola, funerals, birthdays, and corporate events.</p>
              </div>
            </aside>

            <section className="plannerMainBoard">
              <div className="sectionHeadingRow">
                <div>
                  <span className="minorLabel">Your Core Squad</span>
                  <h2>{activeTab === 'squad' ? 'Build the event team' : `${plannerTabs.find((tab) => tab.id === activeTab)?.label} view`}</h2>
                </div>
                <button type="button" className="ghostButton">AI Auto-Pick Squad</button>
              </div>

              <div className="vendorGrid vendorGridCore">
                {selectedBoard.core.map((vendor) => (
                  <article key={vendor.id} className={`vendorCard ${vendor.status === 'recommended' ? 'cardRecommended' : ''}`} style={{ backgroundImage: `linear-gradient(180deg, rgba(8,8,14,0.05) 0%, rgba(8,8,14,0.82) 72%, rgba(8,8,14,0.95) 100%), url(${vendor.image})` }}>
                    <div className="vendorScore">{vendor.score}</div>
                    <span className="vendorSlot">{vendor.slot}</span>
                    <span className={`statusBadge status-${vendor.status}`}>{vendor.status.replace('_', ' ')}</span>
                    <div className="vendorFooter">
                      <strong>{vendor.name}</strong>
                      <p>{vendor.subcategory}</p>
                      <div className="vendorMetaRow"><span>{formatStars(vendor.rating)} ({vendor.reviewCount})</span></div>
                      <div className="vendorActions" aria-label={`${vendor.name} planner actions`}>
                        {plannerActionIcons.map((Icon, index) => (
                          <button key={`${vendor.id}-action-${index}`} type="button" className="vendorActionButton" aria-label={`${vendor.name} action ${index + 1}`}>
                            <Icon className="plannerIcon" />
                          </button>
                        ))}
                      </div>
                      <div className="vendorPrice">{vendor.priceLabel}</div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="sectionHeadingRow supportHeading">
                <div>
                  <span className="minorLabel">Support Squad</span>
                  <h2>Fill the optional and contextual slots</h2>
                </div>
              </div>

              <div className="vendorGrid vendorGridSupport">
                {selectedBoard.support.map((vendor) => (
                  <article key={vendor.id} className={`vendorCard vendorCardSupport ${vendor.status === 'recommended' ? 'cardRecommended' : ''}`} style={{ backgroundImage: `linear-gradient(180deg, rgba(8,8,14,0.08) 0%, rgba(8,8,14,0.84) 74%, rgba(8,8,14,0.95) 100%), url(${vendor.image})` }}>
                    <div className="vendorScore">{vendor.score}</div>
                    <span className="vendorSlot">{vendor.slot}</span>
                    <span className={`statusBadge status-${vendor.status}`}>{vendor.status.replace('_', ' ')}</span>
                    <div className="vendorFooter">
                      <strong>{vendor.name}</strong>
                      <p>{vendor.subcategory}</p>
                      <div className="vendorMetaRow"><span>{formatStars(vendor.rating)} ({vendor.reviewCount})</span></div>
                      <div className="vendorActions" aria-label={`${vendor.name} planner actions`}>
                        {plannerActionIcons.map((Icon, index) => (
                          <button key={`${vendor.id}-support-action-${index}`} type="button" className="vendorActionButton" aria-label={`${vendor.name} action ${index + 1}`}>
                            <Icon className="plannerIcon" />
                          </button>
                        ))}
                        <button type="button" className="supportAddButton" aria-label={`Add ${vendor.name} to the squad`}>
                          <PlusIcon className="plannerIcon" />
                        </button>
                      </div>
                      <div className="vendorPrice">{vendor.priceLabel}</div>
                    </div>
                  </article>
                ))}

                <article className="alertCard glassPanel">
                  <div className="alertCardHeader">
                    <span className="alertSparkle">✦</span>
                    <span className="minorLabel is-gold">WEATHER ALERT</span>
                  </div>
                  <strong>High chance of rain on your event day.</strong>
                  <p>{selectedWeather.alert}</p>
                  <button type="button" className="ghostButton">View Tent Suppliers &gt;</button>
                </article>

                {[1, 2].map((slot) => (
                  <button key={slot} type="button" className="addSupplierCard">
                    <span>+</span>
                    <strong>Add Supplier</strong>
                  </button>
                ))}
              </div>
            </section>

            <aside className="plannerSidebar">
              <div className="summaryCard glassPanel">
                <div className="widgetHeader">
                  <ClockIcon className="plannerIcon widgetIcon" />
                  <span className="minorLabel">Time to {selectedEventType === 'wedding' ? 'Wedding' : 'Event'}</span>
                </div>
                <strong>{daysToEvent}</strong>
                <p className="countdownLabel">Days to go</p>
                <div className="progressTrack"><span style={{ width: `${planningProgress}%` }} /></div>
                <div className="splitMeta"><span>{formatPlannerDateLabel(selectedSchedule.eventDate)}</span><span>Planning active</span></div>
              </div>

              <div className="summaryCard glassPanel">
                <div className="widgetHeader">
                  <BriefcaseIcon className="plannerIcon widgetIcon" />
                  <span className="minorLabel">Budget Overview</span>
                </div>
                <strong>{formatCurrencyFromRands(allocatedAmount)}</strong>
                <p>of {formatCurrencyFromRands(totalBudget)}</p>
                <div className="progressTrack"><span className={budgetProgress > 95 ? 'is-over' : ''} style={{ width: `${budgetProgress}%` }} /></div>
                <div className="splitMeta"><span>{budgetProgress}% allocated</span><span>{formatCurrencyFromRands(Math.max(totalBudget - allocatedAmount, 0))} left</span></div>
              </div>

              <div className="summaryCard glassPanel">
                <div className="widgetHeader">
                  <CloudIcon className="plannerIcon widgetIcon" />
                  <span className="minorLabel">Weather Forecast</span>
                </div>
                <div className="weatherHero">
                  <div className="weatherIcon">☁</div>
                  <div>
                    <strong>{selectedWeather.temperature}</strong>
                    <p>{selectedWeather.label}</p>
                  </div>
                </div>
                <div className="splitMeta emphasised"><span>Chance of rain</span><span className={getWeatherTone(selectedWeather.rainChance)}>{selectedWeather.rainChance}%</span></div>
                <div className="forecastStrip">
                  {forecastDays.map((day) => (
                    <div key={day.day} className={`forecastDay ${day.isEventDay ? 'is-active' : ''}`}>
                      <span>{day.day}</span>
                      <small className="forecastIcon">{day.icon}</small>
                      <strong>{day.temperature}</strong>
                      <small className={getWeatherTone(day.rainChance)}>{day.rainChance}%</small>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>

          <footer className="statusBar glassPanel">
            {[
              { label: 'Secured', value: `${securedCount}/${totalSlots}`, note: 'Essential suppliers are locked in.' },
              { label: 'Squad Chemistry', value: `${chemistry}%`, note: 'Compatibility data is improving fit.' },
              { label: 'Labour Tracker', value: labourValue, note: 'Your team is almost complete.' },
              { label: 'Timeline Sync', value: timelineValue, note: 'All suppliers aligned with your schedule.' },
              { label: 'Communication', value: 'Centralised', note: 'All conversations in one place.' },
            ].map((metric) => (
              <div key={metric.label} className="statusMetric">
                <div className="statusMetricHeader">
                  {(() => {
                    const Icon = statusMetricIcons[metric.label as keyof typeof statusMetricIcons];
                    return <Icon className="plannerIcon statusMetricIcon" />;
                  })()}
                  <span className="minorLabel">{metric.label}</span>
                </div>
                <strong className={getMetricColor(metric.value)}>{metric.value}</strong>
                <p>{metric.note}</p>
              </div>
            ))}
            <button type="button" className="messageButton">View Messages <span>12</span></button>
          </footer>
        </section>
      ) : (
        <section className="opsSurface">
          <header className="opsHero glassPanel">
            <div>
              <span className="minorLabel">STITCHD Operations</span>
              <h1>Compliance, payouts, and marketplace control still live.</h1>
              <p>
                The planner surface is now the client-facing product. This console remains available for provider review,
                payment monitoring, and platform configuration.
              </p>
            </div>
            <div className="opsHeroBadge glassPanel">
              <span>af-south-1</span>
              <strong>Ops retained</strong>
              <p>Existing backend hooks remain untouched.</p>
            </div>
          </header>

          <section className="opsPanel glassPanel">
            {token ? (
              <div className="authForm">
                <label>
                  Signed in as
                  <input value={adminIdentity || email} readOnly />
                </label>
                <div className="actionRow">
                  <button type="button" className="secondaryButton" onClick={() => void loadDashboard()} disabled={loading}>
                    {loading ? 'Refreshing...' : 'Refresh Dashboard'}
                  </button>
                  <button type="button" className="primaryButton" onClick={signOut}>Sign out</button>
                </div>
              </div>
            ) : (
              <form className="authForm" onSubmit={loginAdmin}>
                <label>
                  Admin email address
                  <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your admin email" type="email" autoComplete="username" />
                </label>
                <label>
                  Password
                  <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" type="password" autoComplete="current-password" />
                </label>
                <p className="authHint">Use your admin email and password to open the operations console.</p>
                <button type="submit" className="primaryButton" disabled={loading}>{loading ? 'Signing in...' : 'Sign in to Admin'}</button>
              </form>
            )}

            <div className="messageStack">
              <button type="button" className="secondaryButton" onClick={() => setShowDeveloperSettings((current) => !current)}>
                {showDeveloperSettings ? 'Hide developer settings' : 'Show developer settings'}
              </button>
              {showDeveloperSettings ? (
                <label>
                  API Base URL
                  <input value={apiBaseUrl} onChange={(event) => setApiBaseUrl(event.target.value)} placeholder={DEFAULT_API_BASE_URL} />
                </label>
              ) : null}
            </div>

            <div className="messageStack">
              {statusMessage ? <p className="statusOk">{statusMessage}</p> : null}
              {errorMessage ? <p className="statusError">{errorMessage}</p> : null}
            </div>
          </section>

          <section className="statsGrid">
            {stats.map((card) => (
              <article className="statCard glassPanel" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
                <p>{card.detail}</p>
              </article>
            ))}
          </section>

          <section className="dashboardGrid">
            <article className="glassPanel settingsPanel">
              <div className="sectionHeader">
                <div>
                  <p className="eyebrow compact">Platform Settings</p>
                  <h2>Commission, bookings, and payout controls</h2>
                </div>
                <button type="button" className="primaryButton" onClick={saveSettings} disabled={!settings || savingSettings}>
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </button>
              </div>

              {settings ? (
                <div className="settingsForm">
                  <div className="settingsGroup glassPanelNested">
                    <div>
                      <p className="eyebrow compact">Marketplace Policy</p>
                      <h3>Booking and payment rails</h3>
                    </div>

                    <label>
                      Default Commission Rate
                      <input type="number" step="0.01" min="0" max="0.5" value={settings.defaultCommissionRate} onChange={(event) => setSettings({ ...settings, defaultCommissionRate: Number(event.target.value) })} />
                    </label>

                    <label className="toggleRow"><input type="checkbox" checked={settings.cashPaymentsEnabled} onChange={(event) => setSettings({ ...settings, cashPaymentsEnabled: event.target.checked })} />Cash payments enabled</label>
                    <label className="toggleRow"><input type="checkbox" checked={settings.cardPaymentsEnabled} onChange={(event) => setSettings({ ...settings, cardPaymentsEnabled: event.target.checked })} />Card payments enabled</label>
                    <label className="toggleRow"><input type="checkbox" checked={settings.walletPaymentsEnabled} onChange={(event) => setSettings({ ...settings, walletPaymentsEnabled: event.target.checked })} />Wallet payments enabled</label>
                    <label className="toggleRow"><input type="checkbox" checked={settings.instantBookingsEnabled} onChange={(event) => setSettings({ ...settings, instantBookingsEnabled: event.target.checked })} />Instant bookings enabled</label>
                    <label className="toggleRow"><input type="checkbox" checked={settings.scheduledBookingsEnabled} onChange={(event) => setSettings({ ...settings, scheduledBookingsEnabled: event.target.checked })} />Scheduled bookings enabled</label>
                  </div>

                  <div className="settingsGroup glassPanelNested">
                    <div className="settingsGroupHeader">
                      <div>
                        <p className="eyebrow compact">Business Payout Profile</p>
                        <h3>Where customer payments should land</h3>
                      </div>
                      <span className={`statusPill ${payoutProfileReady ? 'approved' : 'pending'}`}>
                        {payoutProfileReady ? 'Ready for settlement setup' : 'Banking details required'}
                      </span>
                    </div>

                    <p className="fieldHint">Store the business banking profile here for settlement operations. Payment gateway keys still belong in secure server environment variables.</p>

                    <div className="settingsGrid">
                      <label>
                        Business Legal Name
                        <input type="text" value={settings.businessLegalName || ''} onChange={(event) => setSettings({ ...settings, businessLegalName: event.target.value })} />
                      </label>
                      <label>
                        Bank Name
                        <input type="text" value={settings.payoutBankName || ''} onChange={(event) => setSettings({ ...settings, payoutBankName: event.target.value })} />
                      </label>
                      <label>
                        Account Holder
                        <input type="text" value={settings.payoutAccountHolder || ''} onChange={(event) => setSettings({ ...settings, payoutAccountHolder: event.target.value })} />
                      </label>
                      <label>
                        Account Number
                        <input type="text" inputMode="numeric" value={settings.payoutAccountNumber || ''} onChange={(event) => setSettings({ ...settings, payoutAccountNumber: event.target.value })} />
                      </label>
                      <label>
                        Account Type
                        <input type="text" placeholder="Business Cheque" value={settings.payoutAccountType || ''} onChange={(event) => setSettings({ ...settings, payoutAccountType: event.target.value })} />
                      </label>
                      <label>
                        Branch Code
                        <input type="text" inputMode="numeric" value={settings.payoutBranchCode || ''} onChange={(event) => setSettings({ ...settings, payoutBranchCode: event.target.value })} />
                      </label>
                      <label className="fullWidthField">
                        Settlement Reference
                        <input type="text" placeholder="STITCHD settlements" value={settings.payoutReference || ''} onChange={(event) => setSettings({ ...settings, payoutReference: event.target.value })} />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="emptyState">Sign in as an admin to load platform settings.</p>
              )}
            </article>

            <article className="glassPanel reviewPanel">
              <div className="sectionHeader">
                <div>
                  <p className="eyebrow compact">Marketplace Pulse</p>
                  <h2>Bookings and payments overview</h2>
                </div>
                <button type="button" className="secondaryButton" onClick={() => void loadDashboard()} disabled={loading || !token.trim()}>Refresh Metrics</button>
              </div>

              {metrics ? (
                <div className="metricsStack">
                  <div className="metricsGrid">
                    <article className="miniMetricCard glassPanelNested"><span>Customers</span><strong>{metrics.customerCount}</strong></article>
                    <article className="miniMetricCard glassPanelNested"><span>Providers</span><strong>{metrics.providerCount}</strong></article>
                    <article className="miniMetricCard glassPanelNested"><span>Active bookings</span><strong>{metrics.activeBookings}</strong></article>
                    <article className="miniMetricCard glassPanelNested"><span>Scheduled</span><strong>{metrics.scheduledBookings}</strong></article>
                    <article className="miniMetricCard glassPanelNested"><span>Completed</span><strong>{metrics.completedBookings}</strong></article>
                    <article className="miniMetricCard glassPanelNested"><span>Average rating</span><strong>{metrics.averageRating.toFixed(1)}</strong></article>
                  </div>

                  <div>
                    <div className="sectionHeader compactHeader">
                      <div>
                        <p className="eyebrow compact">Payment Feed</p>
                        <h2>Recent transactions</h2>
                      </div>
                    </div>

                    {recentPayments.length === 0 ? (
                      <p className="emptyState">No payment transactions have been created yet.</p>
                    ) : (
                      <div className="paymentFeed">
                        {recentPayments.map((payment) => (
                          <article className="paymentRow glassPanelNested" key={payment.id}>
                            <div>
                              <strong>{payment.bookingRef || payment.bookingId}</strong>
                              <p>{payment.paymentMethod.toUpperCase()} • {payment.status.toUpperCase()} • {new Date(payment.updatedAt).toLocaleString()}</p>
                            </div>
                            <div className="paymentMeta">
                              <strong>{formatCurrency(payment.amountCents)}</strong>
                              <span>Commission {formatCurrency(payment.commissionCents)}</span>
                              <span>Payout {formatCurrency(payment.providerEarningsCents)}</span>
                              {payment.checkoutUrl ? (
                                <a href={payment.checkoutUrl} target="_blank" rel="noreferrer" className="documentLink">Open checkout</a>
                              ) : null}
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="emptyState">Sign in as an admin to load booking and payment analytics.</p>
              )}
            </article>

            <article className="glassPanel reviewPanel">
              <div className="sectionHeader">
                <div>
                  <p className="eyebrow compact">Verification Queue</p>
                  <h2>Provider document review</h2>
                </div>
                <button type="button" className="secondaryButton" onClick={() => void loadDashboard()} disabled={loading || !token.trim()}>Refresh Queue</button>
              </div>

              {pendingProviders.length === 0 ? (
                <p className="emptyState">No providers are currently waiting for verification review.</p>
              ) : (
                <div className="providerList">
                  {pendingProviders.map((provider) => {
                    const name = [provider.user?.firstName, provider.user?.lastName].filter(Boolean).join(' ') || 'Unnamed provider';

                    return (
                      <article className="providerCard glassPanelNested" key={provider.userId}>
                        <div className="providerHeader">
                          <div>
                            <h3>{name}</h3>
                            <p>{provider.user?.phone} {provider.user?.email ? `• ${provider.user.email}` : ''}</p>
                          </div>
                          <span className="statusPill pending">Pending</span>
                        </div>

                        <div className="providerMeta">
                          <span>{provider.serviceArea || 'Service area not provided'}</span>
                          <span>{provider.yearsExperience || 0} years experience</span>
                          <span>{provider.documents.length} uploaded files</span>
                        </div>

                        <div className="documentList">
                          {provider.documents.map((document) => (
                            <div className="documentRow glassPanelNested" key={document.id}>
                              <div>
                                <strong>{document.documentType.replace(/_/g, ' ')}</strong>
                                <p>{document.fileName}</p>
                              </div>
                              {document.fileUrl ? (
                                <a href={document.fileUrl} target="_blank" rel="noreferrer" className="documentLink">View file</a>
                              ) : (
                                <span className="documentMissing">Missing file URL</span>
                              )}
                            </div>
                          ))}
                        </div>

                        <label>
                          Review note
                          <textarea rows={3} value={reviewNotes[provider.userId] || ''} onChange={(event) => setReviewNotes((current) => ({ ...current, [provider.userId]: event.target.value }))} placeholder="Add a compliance note for this review" />
                        </label>

                        <div className="actionRow">
                          <button type="button" className="secondaryButton" onClick={() => void reviewProvider(provider.userId, 'rejected')}>Reject</button>
                          <button type="button" className="primaryButton" onClick={() => void reviewProvider(provider.userId, 'approved')}>Approve</button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </article>
          </section>
        </section>
      )}
    </main>
  );
}