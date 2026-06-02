import { FormEvent, useEffect, useMemo, useState } from 'react';

const plannerImage = 'https://upload.wikimedia.org/wikipedia/commons/4/44/Wedding_planner.jpg';
const venueImage = 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Cape_Town_Wedding_South_Africa_1.jpg';
const photographyImage = 'https://upload.wikimedia.org/wikipedia/commons/3/31/Wedding_photographer_at_work.jpg';
const cateringImage = 'https://upload.wikimedia.org/wikipedia/commons/9/9b/NIgerian_food.jpg';
const floralsImage = 'https://upload.wikimedia.org/wikipedia/commons/3/38/Wedding_table_SA2.jpg';
const entertainmentImage = 'https://upload.wikimedia.org/wikipedia/commons/9/94/DJ_Ready_D_2023.jpg';
const mcImage = 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Ghana_MC_%287714956838%29.jpg';
const glamImage = 'https://upload.wikimedia.org/wikipedia/commons/0/02/White_wedding_ceremony_-_Bride%27s_makeup_-_Northern_Nigeria_-_2026_%286%29.jpg';
const transportImage = 'https://upload.wikimedia.org/wikipedia/commons/1/16/Chev_wedding_car_SA.jpg';
const decorImage = 'https://upload.wikimedia.org/wikipedia/commons/6/68/Wedding_table_SA1.jpg';
const tentImage = 'https://upload.wikimedia.org/wikipedia/commons/a/af/Marquee_tents_for_events.jpg';
const coachCoordinatorImage = 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Event_coordinator_Mr._Mothusi_Sekhomba.jpg';
const coachPortraitImage = 'https://upload.wikimedia.org/wikipedia/commons/4/44/African_woman_portrait.jpg';

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

function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="4" fill="#17232c" />
      <rect x="6" y="4" width="20" height="22" rx="3" fill="#25d366" />
      <path fill="#ffffff" d="M16 7.7a8.5 8.5 0 0 0-7.3 12.8l-1 3 3.1-1a8.5 8.5 0 1 0 5.2-15.8Zm0 1.5a7 7 0 1 1 0 14 6.9 6.9 0 0 1-3.5-.9l-.2-.1-1.8.6.6-1.7-.1-.2a7 7 0 0 1 6-10.7Z" />
      <path fill="#ffffff" d="M20.3 18.2c-.2-.1-1.1-.5-1.3-.6s-.3-.1-.4.1-.5.6-.6.7-.2.2-.4.1a5.9 5.9 0 0 1-1.8-1.1 6.6 6.6 0 0 1-1.2-1.6c-.1-.2 0-.3.1-.4l.3-.3.2-.3a.4.4 0 0 0 0-.4l-.5-1.3c-.1-.3-.3-.3-.4-.3h-.4a.7.7 0 0 0-.5.2 2.1 2.1 0 0 0-.7 1.6 3.8 3.8 0 0 0 .8 2.1 8.7 8.7 0 0 0 3.4 3 9.9 9.9 0 0 0 1.1.4 2.8 2.8 0 0 0 1.2.1 2 2 0 0 0 1.4-.9 1.7 1.7 0 0 0 .1-.9c-.1-.1-.2-.1-.4-.2Z" />
      <rect x="9" y="28" width="14" height="3" rx="1.5" fill="#2eb8ff" />
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
      <path className="weatherCloudPath" d="M18 18a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.7-1.5A4.5 4.5 0 1 0 6 18Z" />
    </svg>
  );
}

function SunIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle className="weatherSunCore" cx="12" cy="12" r="4" />
      <path className="weatherSunRay" d="M12 2v2" />
      <path className="weatherSunRay" d="M12 20v2" />
      <path className="weatherSunRay" d="m4.93 4.93 1.41 1.41" />
      <path className="weatherSunRay" d="m17.66 17.66 1.41 1.41" />
      <path className="weatherSunRay" d="M2 12h2" />
      <path className="weatherSunRay" d="M20 12h2" />
      <path className="weatherSunRay" d="m6.34 17.66-1.41 1.41" />
      <path className="weatherSunRay" d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function RainIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path className="weatherRainCloud" d="M18 16a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.7-1.5A4.5 4.5 0 1 0 6 16Z" />
      <path className="weatherRainDrop" d="M8 19v2" />
      <path className="weatherRainDrop" d="M12 18v4" />
      <path className="weatherRainDrop" d="M16 19v2" />
    </svg>
  );
}

function StormIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path className="weatherStormCloud" d="M18 16a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.7-1.5A4.5 4.5 0 1 0 6 16Z" />
      <path className="weatherStormBolt" d="m13 12-3 5h3l-2 5 5-7h-3l2-3" />
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

function MenuIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function HomeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.8V21h14V9.8" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

function WalletIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 16.5z" />
      <path d="M3 8h15" />
      <path d="M16 13h4" />
      <circle cx="16" cy="13" r="1" />
    </svg>
  );
}

function PhoneIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.1 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.8l-1.3 1.3a16 16 0 0 0 6.4 6.4l1.3-1.3a2 2 0 0 1 1.8-.6l3 .5A2 2 0 0 1 22 16.9Z" />
    </svg>
  );
}

function SparkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z" />
      <path d="M19 3v4" />
      <path d="M21 5h-4" />
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

type BookingJourneyStage = {
  key: string;
  label: string;
  status: 'done' | 'active' | 'upcoming';
  timestamp?: string;
  note: string;
};

type BookingJourneyNotification = {
  id: string;
  type: string;
  audience: 'customer' | 'provider';
  message: string;
  timestamp: string;
};

type BookingJourney = {
  id: string;
  bookingRef: string;
  service: string;
  type: 'instant' | 'scheduled';
  customerName: string;
  providerName: string;
  currentStage: string;
  paymentMethod: string;
  paymentStatus: RecentPayment['status'];
  amountCents: number;
  commissionCents: number;
  providerEarningsCents: number;
  scheduledAt?: string;
  stages: BookingJourneyStage[];
  notifications: BookingJourneyNotification[];
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
type AuthRole = 'client' | 'supplier' | 'coach' | 'admin';
type PlannerTab = 'squad' | 'inspiration' | 'suppliers' | 'budget' | 'marketplace';
type EventType = 'wedding' | 'lobola' | 'funeral' | 'corporate' | 'birthday';
type VendorStatus = 'secured' | 'booked' | 'optional' | 'recommended' | 'at_risk';

type MockSession = {
  role: AuthRole;
  identity: string;
  contact: string;
};

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

type WeatherIconKey = 'sun' | 'cloud' | 'rain' | 'storm';

type ForecastDay = {
  day: string;
  temperature: string;
  rainChance: number;
  iconKey: WeatherIconKey;
  isEventDay: boolean;
};

type LiveWeatherSnapshot = {
  locationLabel: string;
  current: {
    label: string;
    temperature: string;
    rainChance: number;
    iconKey: WeatherIconKey;
  };
  forecast: ForecastDay[];
  shouldAlert: boolean;
  alertMessage: string;
  fetchedAt: number;
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

type PlannerWeatherForecast = {
  date: string;
  dayAbbr: string;
  condition: string;
  iconKey: WeatherIconKey;
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
    forecast: PlannerWeatherForecast[];
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

type PlannerAutoPickResponse = {
  title: string;
  core: PlannerVendorPayload[];
  support: PlannerVendorPayload[];
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

function mapBrowseSupplierToVendor(supplier: SupplierBrowseItem): VendorCardData {
  return {
    id: supplier.id,
    slot: supplier.slot,
    subcategory: supplier.subcategory,
    name: supplier.name,
    rating: supplier.rating,
    reviewCount: supplier.reviewCount,
    priceLabel: supplier.priceLabel,
    score: supplier.score,
    status: supplier.status,
    image: plannerImageByKey[supplier.imageKey] || plannerImage,
  };
}

const STAGING_HTTPS_API_BASE_URL = 'https://api-staging.stitchd.co.za/api/v1';
const LOCAL_API_BASE_URL = 'http://127.0.0.1:3002/api/v1';
const LOCAL_OPS_API_BASE_URL = 'http://127.0.0.1:3001/api/v1';

const plannerTabs: Array<{ id: PlannerTab; label: string }> = [
  { id: 'squad', label: 'Dashboard' },
  { id: 'inspiration', label: 'Timeline' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'budget', label: 'Budget' },
  { id: 'marketplace', label: 'Coach' },
];

const plannerTabIcons: Record<PlannerTab, (props: IconProps) => JSX.Element> = {
  squad: HomeIcon,
  inspiration: CalendarIcon,
  suppliers: TeamIcon,
  budget: WalletIcon,
  marketplace: ChatIcon,
};

const eventOptions: Array<{ value: EventType; label: string; strapline: string; intro: string }> = [
  {
    value: 'wedding',
    label: 'Wedding MVP',
    strapline: 'Luxury wedding planning with a fast read on health, budget, suppliers, and human support.',
    intro: 'Open STITCHD and understand wedding health, open risks, budget position, coach support, and recommended suppliers immediately.',
  },
];

const eventNames: Record<EventType, string> = {
  wedding: 'Thabo and Lelo Wedding Weekend',
  lobola: 'Masego Lobola Delegation',
  funeral: 'Ndlovu Memorial Service',
  corporate: 'Founders Summit 2026',
  birthday: 'Ayanda 30th Celebration',
};

const coachByEvent: Record<EventType, { name: string; role: string; score: string; events: number; image: string; cardLabel: string }> = {
  wedding: { name: 'Lungi', role: 'Senior Coordinator', score: '4.9', events: 92, image: coachCoordinatorImage, cardLabel: 'Senior Coach' },
  lobola: { name: 'Nono Dube', role: 'Tradition and Family Coordinator', score: '4.8', events: 94, image: coachPortraitImage, cardLabel: 'Culture Coach' },
  funeral: { name: 'Sizwe K', role: 'Family Support and Logistics Coach', score: '4.9', events: 156, image: coachCoordinatorImage, cardLabel: 'Care Coach' },
  corporate: { name: 'Karabo M', role: 'Event Operations Lead', score: '4.7', events: 203, image: coachCoordinatorImage, cardLabel: 'Ops Coach' },
  birthday: { name: 'Tumi N', role: 'Celebration Curator', score: '4.8', events: 88, image: coachPortraitImage, cardLabel: 'Vibe Coach' },
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

const weatherCoordinatesByEvent: Record<EventType, { latitude: number; longitude: number; locationLabel: string }> = {
  wedding: { latitude: -26.2041, longitude: 28.0473, locationLabel: 'Johannesburg, Gauteng' },
  lobola: { latitude: -25.7479, longitude: 28.2293, locationLabel: 'Pretoria, Gauteng' },
  funeral: { latitude: -29.8587, longitude: 31.0218, locationLabel: 'Durban, KwaZulu-Natal' },
  corporate: { latitude: -33.9249, longitude: 18.4241, locationLabel: 'Cape Town, Western Cape' },
  birthday: { latitude: -26.1076, longitude: 28.0567, locationLabel: 'Sandton, Gauteng' },
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
    return LOCAL_API_BASE_URL;
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
    || stored === 'http://localhost:3002/api/v1'
    || stored === LOCAL_API_BASE_URL
    || (onSecurePage && stored.startsWith('http://'))
    || (!isLocalHost && stored.includes('127.0.0.1'))
    || (!isLocalHost && stored.includes('localhost'))
  ) {
    return DEFAULT_API_BASE_URL;
  }

  return stored;
}

function resolveRequestBaseUrl(path: string, currentApiBaseUrl: string) {
  const hostname = window.location.hostname;
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isOpsPath = path.startsWith('/admin') || path.startsWith('/auth/admin');

  if (isLocalHost && currentApiBaseUrl === LOCAL_API_BASE_URL && isOpsPath) {
    return LOCAL_OPS_API_BASE_URL;
  }

  return currentApiBaseUrl;
}

function getMetricColor(value: string) {
  if (value === 'On Track') return 'is-green';
  if (value === 'Behind') return 'is-gold';
  if (value === 'At Risk') return 'is-red';
  if (value === 'Centralised') return 'is-gold';
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

function wrapVendorArtworkText(value: string, maxLineLength: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (candidate.length <= maxLineLength || !currentLine) {
      currentLine = candidate;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 2);
}

function getVendorArtwork(vendor: VendorCardData) {
  return `url("${vendor.image}")`;
}

function getVendorArtworkPosition(vendor: VendorCardData) {
  if (vendor.id === 'venue' || vendor.name === 'Luxe Manor') return 'center top';
  return 'center';
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
  if (rainChance > 40) return 'is-gold';
  if (rainChance < 20) return 'is-green';
  return '';
}

function getWeatherIcon(rainChance: number): WeatherIconKey {
  if (rainChance >= 70) return 'storm';
  if (rainChance > 40) return 'rain';
  if (rainChance < 20) return 'sun';
  return 'cloud';
}

function getWeatherDescriptor(weatherCode: number) {
  if ([95, 96, 99].includes(weatherCode)) return { label: 'Thunderstorms', iconKey: 'storm' as WeatherIconKey };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) return { label: 'Rain Showers', iconKey: 'rain' as WeatherIconKey };
  if ([1, 2, 3, 45, 48].includes(weatherCode)) return { label: 'Cloudy', iconKey: 'cloud' as WeatherIconKey };
  return { label: 'Clear', iconKey: 'sun' as WeatherIconKey };
}

function buildWeatherAlert(eventType: EventType, rainChance: number, label: string) {
  if (rainChance >= 60) {
    if (eventType === 'wedding') return 'High rain risk at your current location. Keep tenting and indoor ceremony backup on standby.';
    if (eventType === 'funeral') return 'Live forecast shows wet conditions. Covered seating and walkway protection should be prioritised.';
    if (eventType === 'lobola') return 'Rain risk is elevated. Confirm family transport timing and marquee backup before arrivals begin.';
    if (eventType === 'corporate') return 'Weather disruption risk is up. Tighten guest arrival flow and covered access planning.';
    return 'Rain risk is elevated at the current location. Build in weather cover and supplier contingency.';
  }

  if (rainChance <= 20) {
    if (eventType === 'corporate') return 'Weather is currently stable. Focus operations on AV timing, access control, and guest flow.';
    if (eventType === 'birthday') return 'Weather is currently stable. Outdoor setup, shade, and drinks stations remain the main comfort levers.';
    return `Current local weather is stable with ${label.toLowerCase()}. Keep the fallback plan visible, but conditions are favorable.`;
  }

  return `Local conditions are showing ${label.toLowerCase()}. Keep suppliers aligned and maintain a weather backup path.`;
}

function WeatherGlyph({ iconKey, className }: { iconKey: WeatherIconKey; className?: string }) {
  const glyphClassName = [className, `weatherTone-${iconKey}`].filter(Boolean).join(' ');

  if (iconKey === 'sun') return <SunIcon className={glyphClassName} />;
  if (iconKey === 'rain') return <RainIcon className={glyphClassName} />;
  if (iconKey === 'storm') return <StormIcon className={glyphClassName} />;
  return <CloudIcon className={glyphClassName} />;
}

function getCoachInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function parsePriceLabelToRands(priceLabel: string) {
  const numeric = Number(priceLabel.replace(/[^0-9]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getSupplierBadges(vendor: VendorCardData) {
  const badges: string[] = ['Verified'];

  if (vendor.rating >= 4.8) badges.push('Top Rated');
  if (vendor.reviewCount >= 80) badges.push('Fast Response');
  if (parsePriceLabelToRands(vendor.priceLabel) <= 18000 || vendor.score >= 90) badges.push('Best Value');

  return badges.slice(0, 4);
}

function getSupplierScorecard(vendor: VendorCardData) {
  return {
    reliability: clampNumber(Math.round(vendor.score + 2), 72, 98),
    communication: clampNumber(Math.round((vendor.rating / 5) * 100) - 5, 70, 96),
    value: clampNumber(Math.round(vendor.score - 4), 68, 94),
    quality: clampNumber(Math.round((vendor.rating / 5) * 100) + 2, 74, 98),
  };
}

function getSupplierCapacity(slot: string) {
  const normalized = slot.toLowerCase();

  if (normalized.includes('venue')) return '120 guests';
  if (normalized.includes('catering')) return 'Up to 180 guests';
  if (normalized.includes('photo')) return 'Full-day cover';
  if (normalized.includes('dj') || normalized.includes('entertainment')) return '300 pax setup';
  if (normalized.includes('transport')) return '6 to 18 guests';
  if (normalized.includes('tent')) return '200 seat marquee';

  return 'Custom package';
}

function getSupplierAvailability(status: VendorStatus) {
  if (status === 'secured' || status === 'booked') return 'Available now';
  if (status === 'recommended') return 'Priority hold';
  if (status === 'at_risk') return 'Limited availability';
  return 'Open this week';
}

function getSupplierDepositTerms(slot: string) {
  const normalized = slot.toLowerCase();

  if (normalized.includes('venue')) return '40% deposit, balance 14 days before event';
  if (normalized.includes('catering')) return '50% deposit, final headcount 7 days before event';
  if (normalized.includes('photo')) return '35% deposit, balance on delivery week';
  if (normalized.includes('dj') || normalized.includes('entertainment') || normalized.includes('host')) return '50% booking fee, balance 7 days before event';
  if (normalized.includes('decor') || normalized.includes('floral')) return '60% materials deposit, final approval 10 days before event';
  if (normalized.includes('transport')) return '30% booking fee, balance 48 hours before collection';

  return 'Deposit terms confirmed during coach review';
}

function getSupplierLeadTime(slot: string) {
  const normalized = slot.toLowerCase();

  if (normalized.includes('venue')) return 'Lock 6 to 8 months ahead';
  if (normalized.includes('catering')) return 'Menu sign-off 21 days ahead';
  if (normalized.includes('photo')) return 'Shot list sign-off 14 days ahead';
  if (normalized.includes('dj') || normalized.includes('entertainment') || normalized.includes('host')) return 'Run sheet due 10 days ahead';
  if (normalized.includes('decor') || normalized.includes('floral')) return 'Moodboard freeze 14 days ahead';
  if (normalized.includes('transport')) return 'Route confirmation 72 hours ahead';

  return 'Lead time depends on event complexity';
}

function getSupplierBestFit(vendor: VendorCardData, locationLabel: string) {
  const normalized = vendor.slot.toLowerCase();

  if (normalized.includes('venue')) return `Best for premium guest arrival flow in ${locationLabel}`;
  if (normalized.includes('catering')) return 'Best for high-touch service with easy family-style scaling';
  if (normalized.includes('photo')) return 'Best for editorial portraits plus ceremony coverage';
  if (normalized.includes('dj') || normalized.includes('entertainment')) return 'Best for dance-floor energy and timeline pacing';
  if (normalized.includes('decor') || normalized.includes('floral')) return 'Best for a polished hero-table and aisle finish';
  if (normalized.includes('transport')) return 'Best for on-time arrivals and VIP movements';

  return `${vendor.name} is a strong fit for ${vendor.slot.toLowerCase()} delivery.`;
}

function getSupplierDeliverables(slot: string) {
  const normalized = slot.toLowerCase();

  if (normalized.includes('venue')) return ['Site walkthrough', 'Floorplan confirmation', 'Power and access brief'];
  if (normalized.includes('catering')) return ['Menu tasting', 'Service staffing plan', 'Final guest-count lock'];
  if (normalized.includes('photo')) return ['Shot list', 'Family portrait plan', 'Next-day teaser delivery'];
  if (normalized.includes('dj') || normalized.includes('entertainment')) return ['Run-of-show cues', 'Sound check', 'Backup playlist'];
  if (normalized.includes('decor') || normalized.includes('floral')) return ['Moodboard approval', 'Mock table setup', 'On-site strike plan'];
  if (normalized.includes('transport')) return ['Collection schedule', 'Driver contact sheet', 'Route contingency'];

  return ['Scope sign-off', 'Delivery timing', 'Final approval checkpoint'];
}

function getInitialMockSession() {
  const stored = localStorage.getItem('stitchd.mock.session');

  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as MockSession;
    if (!parsed.role || !parsed.identity || !parsed.contact) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
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
  const [bookingJourneys, setBookingJourneys] = useState<BookingJourney[]>([]);
  const [pendingProviders, setPendingProviders] = useState<PendingProvider[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeveloperSettings, setShowDeveloperSettings] = useState(false);
  const [mockSession, setMockSession] = useState<MockSession | null>(getInitialMockSession);
  const [authRole, setAuthRole] = useState<AuthRole>('client');
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [authStep, setAuthStep] = useState<'identify' | 'verify'>('identify');
  const [authNotice, setAuthNotice] = useState('');
  const [authError, setAuthError] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [surfaceMode, setSurfaceMode] = useState<SurfaceMode>('planner');
  const [activeTab, setActiveTab] = useState<PlannerTab>('squad');
  const [selectedEventType, setSelectedEventType] = useState<EventType>('wedding');
  const [plannerExperience, setPlannerExperience] = useState<PlannerExperience | null>(null);
  const [plannerSurface, setPlannerSurface] = useState<PlannerSurfaceData | null>(null);
  const [plannerBoardOverride, setPlannerBoardOverride] = useState<{ core: VendorCardData[]; support: VendorCardData[] } | null>(null);
  const [liveWeather, setLiveWeather] = useState<LiveWeatherSnapshot | null>(null);
  const [browseCategory, setBrowseCategory] = useState<string | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [swapVendorId, setSwapVendorId] = useState<string | null>(null);
  const [clashVendorId, setClashVendorId] = useState<string | null>(null);
  const [compareVendorId, setCompareVendorId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [coachProfileOpen, setCoachProfileOpen] = useState(false);
  const [coachScheduleOpen, setCoachScheduleOpen] = useState(false);
  const [selectedCoachSlot, setSelectedCoachSlot] = useState<string | null>(null);
  const [readinessReportOpen, setReadinessReportOpen] = useState(false);
  const [plannerToast, setPlannerToast] = useState('');
  const [plannerLoading, setPlannerLoading] = useState(false);
  const [aiPicking, setAiPicking] = useState(false);
  const [revealedVendorIds, setRevealedVendorIds] = useState<string[]>([]);
  const [revealSequenceActive, setRevealSequenceActive] = useState(false);

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
        image: coachByEvent[selectedEventType].image,
        cardLabel: coachByEvent[selectedEventType].cardLabel,
      }
    : selectedEventType === 'birthday'
      ? null
      : coachByEvent[selectedEventType];
  const fallbackWeather = plannerExperience?.weather || weatherByEvent[selectedEventType];
  const eventForecast = liveWeather?.forecast.find((day) => day.isEventDay)
    || liveWeather?.forecast[0]
    || plannerSurface?.weather.forecast.find((day) => day.isEventDay)
    || plannerSurface?.weather.forecast[0];
  const selectedWeather = eventForecast
    ? {
        ...fallbackWeather,
        label: liveWeather?.current.label || ('condition' in eventForecast ? eventForecast.condition : fallbackWeather.label),
        temperature: liveWeather?.current.temperature || ('tempC' in eventForecast ? `${eventForecast.tempC}°` : eventForecast.temperature),
        rainChance: liveWeather?.current.rainChance || ('rainChancePct' in eventForecast ? eventForecast.rainChancePct : eventForecast.rainChance),
        alert: liveWeather?.alertMessage || plannerSurface?.weather.alert?.recommendation || buildWeatherAlert(selectedEventType, 'rainChancePct' in eventForecast ? eventForecast.rainChancePct : eventForecast.rainChance, liveWeather?.current.label || ('condition' in eventForecast ? eventForecast.condition : fallbackWeather.label)),
      }
    : fallbackWeather;
  const selectedSchedule = plannerScheduleByEvent[selectedEventType];
  const resolvedBoard = plannerExperience
    ? {
        core: plannerExperience.squad.core.map(mapPlannerVendor),
        support: plannerExperience.squad.support.map(mapPlannerVendor),
      }
    : vendorBoard[selectedEventType];
  const selectedBoard = plannerBoardOverride || resolvedBoard;
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
  const forecastDays = liveWeather?.forecast || plannerSurface?.weather.forecast.map((day) => ({
    day: day.dayAbbr,
    temperature: `${day.tempC}°`,
    rainChance: day.rainChancePct,
    iconKey: day.iconKey,
    isEventDay: day.isEventDay,
  })) || ['Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
    const rainChance = Math.max(selectedWeather.rainChance - (index * 12), 8);
    return {
      day,
      temperature: `${selectedEventType === 'birthday' ? 26 - index : 21 + index}°`,
      rainChance,
      iconKey: getWeatherIcon(rainChance),
      isEventDay: index === 2,
    };
  });
  const messageThreads = plannerSurface?.messages.threads || [];
  const activeThread = activeThreadId ? messageThreads.find((thread) => thread.id === activeThreadId) || null : null;
  const activeClash = plannerSurface?.clashCandidates.find((item) => item.currentVendorId === clashVendorId) || null;
  const swapChoices = swapVendorId ? plannerSurface?.swapOptions[swapVendorId] || [] : [];
  const compareLeadVendor = compareVendorId
    ? selectedBoard.core.concat(selectedBoard.support).find((vendor) => vendor.id === compareVendorId) || null
    : null;
  const activeWeatherAlert = liveWeather?.shouldAlert
    ? {
        title: 'Weather alert',
        recommendation: liveWeather.alertMessage,
        ctaLabel: 'View Tent Suppliers >',
        browseCategory: 'tents',
      }
    : plannerSurface?.weather.alert;
  const shouldShowWeatherAlert = liveWeather?.shouldAlert || (plannerSurface?.weather.shouldAlert && plannerSurface.weather.alert);
  const allVendors = selectedBoard.core.concat(selectedBoard.support);
  const selectedSupplier = selectedSupplierId ? allVendors.find((vendor) => vendor.id === selectedSupplierId) || null : null;
  const locationLabel = plannerSurface?.locationLabel || weatherCoordinatesByEvent[selectedEventType].locationLabel;
  const budgetUsed = plannerSurface?.budget.allocated || allocatedAmount;
  const budgetRemaining = Math.max((plannerSurface?.budget.total || totalBudget) - budgetUsed, 0);
  const spendByCategory = [
    { label: 'Venue', amount: allVendors.filter((vendor) => /venue/i.test(vendor.slot)).reduce((sum, vendor) => sum + parsePriceLabelToRands(vendor.priceLabel), 0) },
    { label: 'Decor', amount: allVendors.filter((vendor) => /(decor|floral|flowers)/i.test(vendor.slot)).reduce((sum, vendor) => sum + parsePriceLabelToRands(vendor.priceLabel), 0) },
    { label: 'Catering', amount: allVendors.filter((vendor) => /catering/i.test(vendor.slot)).reduce((sum, vendor) => sum + parsePriceLabelToRands(vendor.priceLabel), 0) },
    { label: 'Entertainment', amount: allVendors.filter((vendor) => /(entertainment|dj|mc|host|choir|av)/i.test(vendor.slot)).reduce((sum, vendor) => sum + parsePriceLabelToRands(vendor.priceLabel), 0) },
    { label: 'Photography', amount: allVendors.filter((vendor) => /photo/i.test(vendor.slot)).reduce((sum, vendor) => sum + parsePriceLabelToRands(vendor.priceLabel), 0) },
    { label: 'Other', amount: allVendors.filter((vendor) => !/(venue|decor|floral|flowers|catering|entertainment|dj|mc|host|choir|av|photo)/i.test(vendor.slot)).reduce((sum, vendor) => sum + parsePriceLabelToRands(vendor.priceLabel), 0) },
  ].filter((entry) => entry.amount > 0);
  const budgetChartStops = (() => {
    const colors = ['#007a4d', '#ffb81c', '#14532d', '#f59e0b', '#5b7f61', '#c88a14'];
    const total = spendByCategory.reduce((sum, entry) => sum + entry.amount, 0) || 1;
    let offset = 0;

    return spendByCategory.map((entry, index) => {
      const start = Math.round((offset / total) * 100);
      offset += entry.amount;
      const end = Math.round((offset / total) * 100);
      return `${colors[index % colors.length]} ${start}% ${end}%`;
    }).join(', ');
  })();
  const findVendorByMatch = (pattern: RegExp) => allVendors.find((vendor) => pattern.test(`${vendor.slot} ${vendor.name} ${vendor.subcategory}`));
  const venueVendor = findVendorByMatch(/venue/i);
  const photographyVendor = findVendorByMatch(/photo/i);
  const decorVendor = findVendorByMatch(/decor|floral|flowers/i);
  const entertainmentVendor = findVendorByMatch(/entertainment|dj|mc|host|choir|av/i);
  const cateringVendor = findVendorByMatch(/catering/i);
  const vendorCoverageCount = [venueVendor, decorVendor, cateringVendor, photographyVendor, entertainmentVendor].filter(Boolean).length;
  const completedTaskCount = clampNumber(12 + (vendorCoverageCount * 4) + Math.round(planningProgress / 6), 0, 52);
  const totalTaskCount = 52;
  const budgetLines = plannerSurface?.budget.lines || [];
  const settledBudgetLines = budgetLines.filter((line) => line.status === 'paid' || line.status === 'booked').length;
  const paymentsScore = budgetLines.length > 0
    ? Math.round((settledBudgetLines / budgetLines.length) * 15)
    : budgetProgress <= 70 ? 15 : budgetProgress <= 90 ? 11 : 6;
  const guestManagementScore = venueVendor
    ? completedTaskCount >= 34 ? 5 : 3
    : 0;
  const timelineTasksScore = Math.round((completedTaskCount / totalTaskCount) * 10);
  const readinessScore = clampNumber(
    (venueVendor ? 25 : 0)
    + (cateringVendor ? 15 : 0)
    + (decorVendor ? 10 : 0)
    + (photographyVendor ? 10 : 0)
    + (entertainmentVendor ? 10 : 0)
    + paymentsScore
    + guestManagementScore
    + timelineTasksScore,
    0,
    100,
  );
  const readinessTone = readinessScore >= 85 ? 'healthy' : readinessScore >= 70 ? 'watch' : 'risk';
  const readinessLabel = readinessTone === 'healthy' ? 'On Track' : readinessTone === 'watch' ? 'Watch' : 'Risk';
  const weatherStatus = selectedWeather.rainChance <= 20 ? 'Safe' : selectedWeather.rainChance <= 45 ? 'Watch' : 'Risk';
  const savingsIdentified = 12700;
  const coachQuickActions = [
    { label: 'Call', href: 'tel:+27821234567', Icon: PhoneIcon },
    { label: 'WhatsApp', href: 'https://wa.me/27821234567', Icon: WhatsAppIcon },
    { label: 'Message', action: () => openMessageThread(), Icon: MessageSquareIcon },
    { label: 'Schedule Meeting', action: () => setCoachScheduleOpen(true), Icon: CalendarIcon },
  ];
  const coachNote = 'Venue walkthrough recommended next week.';
  const riskAlerts = [
    !photographyVendor ? { title: 'Photographer not confirmed', impact: 'Medium', action: 'Confirm within 7 days' } : null,
    budgetProgress > 85 ? { title: 'Budget usage is climbing fast', impact: 'Medium', action: 'Review decor and add-on spend this week' } : null,
    shouldShowWeatherAlert ? { title: activeWeatherAlert?.title || 'Weather risk elevated', impact: 'High', action: activeWeatherAlert?.ctaLabel.replace(' >', '') || 'Review contingency suppliers' } : null,
  ].filter(Boolean) as Array<{ title: string; impact: string; action: string }>;
  const timelineItems = [
    { label: 'Venue Confirmed', status: venueVendor ? 'done' : 'upcoming', dependency: null },
    { label: 'Decor Selected', status: decorVendor ? 'done' : venueVendor ? 'active' : 'upcoming', dependency: venueVendor ? null : 'Cannot finalize decor until venue is selected.' },
    { label: 'Photographer Confirmed', status: photographyVendor ? 'done' : 'active', dependency: null },
    { label: 'Invitations', status: completedTaskCount >= 5 ? 'active' : 'upcoming', dependency: venueVendor ? null : 'Cannot start invitations until venue details are locked.' },
    { label: 'Seating Plan', status: completedTaskCount >= 6 ? 'active' : 'upcoming', dependency: venueVendor ? null : 'Cannot start seating plan until venue selected.' },
  ];
  const supplierBundles = { title: 'Venue + Decor + DJ', saveLabel: 'Save R8,500', boostLabel: 'Readiness Boost +12%' };
  const valueAddMarketplace = ['Drone Photography', 'Photo Booth', 'Luxury Cars', 'Jumping Castles', 'Kids Entertainment', 'Live Streaming', 'Fireworks', 'Wedding Website'];
  const insightCards = [
    'Decor quote is 15% above similar weddings. Potential saving: R4,200.',
    photographyVendor
      ? `${photographyVendor.name} is market-aligned, but confirmation should happen within 14 days.`
      : 'Photography is still open. That slot should be closed before the next planning checkpoint.',
  ];
  const readinessChecklist = [
    { label: 'Venue locked', complete: Boolean(venueVendor), detail: venueVendor ? `${venueVendor.name} confirmed.` : 'Lock venue to finish floorplan and invites.' },
    { label: 'Decor aligned', complete: Boolean(decorVendor), detail: decorVendor ? `${decorVendor.name} is in plan.` : 'Confirm decor direction and install window.' },
    { label: 'Photography covered', complete: Boolean(photographyVendor), detail: photographyVendor ? `${photographyVendor.name} has coverage.` : 'Close photo and video before the next checkpoint.' },
    { label: 'Budget healthy', complete: budgetProgress <= 90, detail: budgetProgress <= 90 ? 'Spend is within a manageable range.' : 'Reduce optional spend to protect the remaining budget.' },
    { label: 'Coach loop active', complete: messageThreads.length > 0, detail: messageThreads.length > 0 ? 'Coach and supplier communication is active.' : 'Open a coach thread to tighten coordination.' },
  ];
  const coachMeetingSlots = [
    `${plannerSurface?.coachProfile.nextAvailable || 'Tuesday 10:00'} • 20 min`,
    'Wednesday 14:30 • 30 min',
    'Friday 09:00 • 20 min',
  ];
  const activeCoachProfile: PlannerCoachProfile | null = plannerSurface?.coachProfile
    || (selectedCoach
      ? {
        name: selectedCoach.name,
        role: selectedCoach.role,
        rating: Number(selectedCoach.score),
        eventsCompleted: selectedCoach.events,
        bio: `${selectedCoach.name} helps keep supplier fit, budget movement, and planning risks visible before they become event-day problems.`,
        specialties: ['Supplier coordination', 'Readiness review', 'Planning support'],
        nextAvailable: 'Next available: Tuesday 10:00',
      }
      : null);
  const canAccessOps = mockSession?.role === 'admin';
  const authRoleConfig: Record<AuthRole, { label: string; signedInLabel: string; prompt: string; placeholder: string; helper: string; value: string }> = {
    client: {
      label: 'Client',
      signedInLabel: 'client',
      prompt: 'Phone number',
      placeholder: '+27 82 123 4567',
      helper: 'Clients sign in before building or reviewing their event plan.',
      value: 'Planner access',
    },
    supplier: {
      label: 'Supplier',
      signedInLabel: 'supplier',
      prompt: 'Phone number',
      placeholder: '+27 82 123 4567',
      helper: 'Suppliers sign in before they can view bookings, messages, and workflow updates.',
      value: 'Bookings and messages',
    },
    coach: {
      label: 'Coach',
      signedInLabel: 'coach',
      prompt: 'Phone number',
      placeholder: '+27 82 123 4567',
      helper: 'Coaches sign in before reviewing squad fit, messaging, and planning notes.',
      value: 'Planning oversight',
    },
    admin: {
      label: 'Admin',
      signedInLabel: 'admin',
      prompt: 'Work email',
      placeholder: 'admin@stitchd.co.za',
      helper: 'Admins sign in before opening the planner or operations console.',
      value: 'Platform control',
    },
  };
  const authFeatureCards = [
    { label: 'One secure entry', value: 'Planner, suppliers, and operations begin from one controlled sign-in surface.' },
    { label: 'Role-aware access', value: 'Each user lands in the right workspace with a cleaner first-touch experience.' },
    { label: 'Launch-ready presentation', value: 'The entry flow now matches the product tone expected in client review sessions.' },
  ];
  const browseSuppliers = useMemo(() => {
    if (!browseCategory || !plannerSurface) return [] as SupplierBrowseItem[];

    const baseItems = [
      ...plannerSurface.suppliers.shortlist,
      ...Object.values(plannerSurface.swapOptions).flat(),
    ];

    const deduped = baseItems.filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index);
    if (browseCategory === 'all') return deduped;

    const term = browseCategory.toLowerCase();
    const filtered = deduped.filter((item) => {
      const haystack = `${item.slot} ${item.name} ${item.subcategory}`.toLowerCase();
      return haystack.includes(term)
        || (term === 'tents' && /(tent|marquee|cover)/.test(haystack));
    });

    if (term === 'tents') {
      return [...filtered].sort((left, right) => right.rating - left.rating || right.score - left.score);
    }

    return filtered;
  }, [browseCategory, plannerSurface]);

  useEffect(() => {
    if (!plannerToast) return undefined;

    const timeout = window.setTimeout(() => setPlannerToast(''), 3200);
    return () => window.clearTimeout(timeout);
  }, [plannerToast]);

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
    if (mockSession) {
      localStorage.setItem('stitchd.mock.session', JSON.stringify(mockSession));
      return;
    }

    localStorage.removeItem('stitchd.mock.session');
  }, [mockSession]);

  useEffect(() => {
    if (!canAccessOps && surfaceMode === 'ops') {
      setSurfaceMode('planner');
    }
  }, [canAccessOps, surfaceMode]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [activeTab, selectedEventType, surfaceMode]);

  useEffect(() => {
    if (!token.trim()) return;
    void loadDashboard();
  }, []);

  useEffect(() => {
    if (surfaceMode !== 'planner' || !mockSession) return;

    let cancelled = false;
    const persona = mockSession.role;

    async function loadPlannerExperience() {
      setPlannerLoading(true);
      setPlannerBoardOverride(null);
      try {
        const [experienceResponse, surfaceResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/planner/mvp?eventType=${selectedEventType}&persona=${persona}`),
          fetch(`${apiBaseUrl}/planner/surface?eventType=${selectedEventType}`),
        ]);
        if (!experienceResponse.ok || !surfaceResponse.ok) {
          throw new Error('Planner request failed');
        }

        const [payload, surfacePayload] = await Promise.all([
          experienceResponse.json() as Promise<PlannerExperience>,
          surfaceResponse.json() as Promise<PlannerSurfaceData>,
        ]);
        if (!cancelled) {
          setPlannerExperience(payload);
          setPlannerSurface(surfacePayload);
          setActiveThreadId(null);
        }
      } catch {
        if (!cancelled) {
          setPlannerExperience(null);
          setPlannerSurface(null);
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
  }, [apiBaseUrl, mockSession, selectedEventType, surfaceMode]);

  useEffect(() => {
    if (surfaceMode !== 'planner') return;

    const withinWindow = daysToEvent <= 10;
    if (!withinWindow) {
      setLiveWeather(null);
      return;
    }

    const cacheKey = `stitchd.weather.${selectedEventType}.${selectedSchedule.eventDate}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as LiveWeatherSnapshot;
        if (Date.now() - parsed.fetchedAt < 3 * 60 * 60 * 1000) {
          setLiveWeather(parsed);
          return;
        }
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    const controller = new AbortController();
    const location = weatherCoordinatesByEvent[selectedEventType];

    async function loadLiveWeather() {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,weather_code&daily=temperature_2m_max,precipitation_probability_max,weather_code&forecast_days=5&timezone=auto`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error('Weather request failed');
        }

        const payload = await response.json() as {
          current: { temperature_2m: number; weather_code: number };
          daily: {
            time: string[];
            temperature_2m_max: number[];
            precipitation_probability_max: number[];
            weather_code: number[];
          };
        };

        const forecast = payload.daily.time.map((date, index) => {
          const descriptor = getWeatherDescriptor(payload.daily.weather_code[index] || 0);
          const dateValue = new Date(date);
          return {
            day: new Intl.DateTimeFormat('en-ZA', { weekday: 'short' }).format(dateValue),
            temperature: `${Math.round(payload.daily.temperature_2m_max[index] || 0)}°`,
            rainChance: payload.daily.precipitation_probability_max[index] || 0,
            iconKey: descriptor.iconKey,
            isEventDay: date === selectedSchedule.eventDate,
          };
        });

        const currentDescriptor = getWeatherDescriptor(payload.current.weather_code || 0);
        const eventDay = forecast.find((day) => day.isEventDay) || forecast[0];
        const nextSnapshot: LiveWeatherSnapshot = {
          locationLabel: plannerSurface?.locationLabel || location.locationLabel,
          current: {
            label: currentDescriptor.label,
            temperature: `${Math.round(payload.current.temperature_2m)}°`,
            rainChance: eventDay?.rainChance || 0,
            iconKey: currentDescriptor.iconKey,
          },
          forecast,
          shouldAlert: (eventDay?.rainChance || 0) > 50,
          alertMessage: buildWeatherAlert(selectedEventType, eventDay?.rainChance || 0, currentDescriptor.label),
          fetchedAt: Date.now(),
        };

        setLiveWeather(nextSnapshot);
        localStorage.setItem(cacheKey, JSON.stringify(nextSnapshot));
      } catch {
        setLiveWeather(null);
      }
    }

    void loadLiveWeather();

    return () => {
      controller.abort();
    };
  }, [daysToEvent, plannerSurface?.locationLabel, selectedEventType, selectedSchedule.eventDate, surfaceMode]);

  async function request<T>(path: string, init?: RequestInit, accessToken = token) {
    const requestBaseUrl = resolveRequestBaseUrl(path, apiBaseUrl);
    const response = await fetch(`${requestBaseUrl}${path}`, {
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
      const [settingsResponse, pendingResponse, metricsResponse, recentPaymentsResponse, bookingJourneysResponse] = await Promise.all([
        request<PlatformSettings>('/admin/settings', undefined, accessToken),
        request<PendingProvider[]>('/admin/providers/pending-verification', undefined, accessToken),
        request<DashboardMetrics>('/admin/dashboard-metrics', undefined, accessToken),
        request<RecentPayment[]>('/admin/payments/recent', undefined, accessToken),
        request<BookingJourney[]>('/admin/bookings/journey', undefined, accessToken),
      ]);

      setSettings(settingsResponse);
      setPendingProviders(pendingResponse);
      setMetrics(metricsResponse);
      setRecentPayments(recentPaymentsResponse);
      setBookingJourneys(bookingJourneysResponse);
      setStatusMessage(adminIdentity ? `Ops console connected as ${adminIdentity}.` : 'Ops console connected.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load admin dashboard.');
    } finally {
      setLoading(false);
    }
  }

  function clearAdminSession() {
    setToken('');
    setPassword('');
    setAdminIdentity('');
    setSettings(null);
    setMetrics(null);
    setRecentPayments([]);
    setBookingJourneys([]);
    setPendingProviders([]);
    setErrorMessage('');
  }

  function signOutApp() {
    clearAdminSession();
    setMockSession(null);
    setSurfaceMode('planner');
    setAuthStep('identify');
    setAuthIdentifier('');
    setAuthOtp('');
    setAuthNotice('');
    setAuthError('');
    setBrowseCategory(null);
    setActiveThreadId(null);
    setSwapVendorId(null);
    setClashVendorId(null);
    setCoachProfileOpen(false);
    setPlannerToast('');
    setStatusMessage('Signed out.');
  }

  function requestMockOtp(event: FormEvent) {
    event.preventDefault();
    setAuthError('');

    if (!authIdentifier.trim()) {
      setAuthError(`Enter your ${authRole === 'admin' ? 'work email' : 'phone number'} to continue.`);
      return;
    }

    setAuthStep('verify');
    setAuthNotice(`Verification code sent to ${authIdentifier.trim()}. Enter the 6-digit code to continue.`);
  }

  function completeMockSignIn(event: FormEvent) {
    event.preventDefault();
    setAuthError('');

    if (!/^\d{6}$/.test(authOtp.trim())) {
      setAuthError('Enter a valid 6-digit verification code.');
      return;
    }

    const config = authRoleConfig[authRole];
    const trimmedIdentifier = authIdentifier.trim();
    const baseIdentity = authRole === 'admin'
      ? 'STITCHD Admin'
      : authRole === 'supplier'
        ? 'Supplier Workspace'
        : authRole === 'coach'
          ? 'Coach Workspace'
          : 'Client Planner';

    setMockSession({
      role: authRole,
      identity: baseIdentity,
      contact: trimmedIdentifier,
    });
    setSurfaceMode(authRole === 'admin' ? surfaceMode : 'planner');
    setAuthStep('identify');
    setAuthOtp('');
    setAuthNotice(`${config.label} signed in successfully.`);
  }

  function handleRoleSelection(role: AuthRole) {
    setAuthRole(role);
    setAuthIdentifier(role === 'admin' ? 'admin@stitchd.co.za' : '');
    setAuthOtp('');
    setAuthStep('identify');
    setAuthNotice('');
    setAuthError('');
  }

  function handlePlannerTabChange(tabId: PlannerTab) {
    setActiveTab(tabId);
    setMobileNavOpen(false);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
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

  async function autoPickSquad() {
    setAiPicking(true);
    setRevealSequenceActive(false);
    setRevealedVendorIds([]);
    try {
      const payload = await request<PlannerAutoPickResponse>('/planner/auto-pick', {
        method: 'POST',
        body: JSON.stringify({ eventType: selectedEventType }),
      }, '');
      const nextBoard = {
        core: payload.core.map(mapPlannerVendor),
        support: payload.support.map(mapPlannerVendor),
      };
      const revealIds = nextBoard.core.concat(nextBoard.support).map((vendor) => vendor.id);
      setPlannerBoardOverride({
        core: nextBoard.core,
        support: nextBoard.support,
      });
      handlePlannerTabChange('squad');
      setPlannerToast(payload.title.replace(/^AI\s+/i, ''));
      setRevealSequenceActive(true);
      revealIds.forEach((id, index) => {
        window.setTimeout(() => {
          setRevealedVendorIds((current) => (current.includes(id) ? current : [...current, id]));
          if (index === revealIds.length - 1) {
            window.setTimeout(() => setRevealSequenceActive(false), 220);
          }
        }, 150 * index);
      });
    } catch {
      setPlannerToast('Recommended lineup is unavailable right now.');
    } finally {
      setAiPicking(false);
    }
  }

  function openMessageThread(vendorId?: string) {
    const thread = vendorId
      ? messageThreads.find((candidate) => candidate.vendorId === vendorId)
      : messageThreads[0];

    if (!thread) {
      setPlannerToast('No supplier conversation is available yet.');
      return;
    }

    setActiveThreadId(thread.id);
  }

  function replaceVendor(nextVendor: SupplierBrowseItem) {
    if (!swapVendorId) return;

    const nextVendorCard = mapBrowseSupplierToVendor(nextVendor);
    const replaceInList = (list: VendorCardData[]) => list.map((vendor) => (vendor.id === swapVendorId ? nextVendorCard : vendor));

    setPlannerBoardOverride({
      core: replaceInList(selectedBoard.core),
      support: replaceInList(selectedBoard.support),
    });
    setSwapVendorId(null);
    setPlannerToast(`${nextVendor.name} has replaced the current supplier.`);
  }

  function addSupportSupplier(nextVendor: SupplierBrowseItem) {
    const nextVendorCard = {
      ...mapBrowseSupplierToVendor(nextVendor),
      status: 'booked' as VendorStatus,
    };
    const existingIndex = selectedBoard.support.findIndex((vendor) => vendor.slot === nextVendor.slot);
    const nextSupport = [...selectedBoard.support];

    if (existingIndex >= 0) {
      nextSupport[existingIndex] = nextVendorCard;
    } else {
      nextSupport.push(nextVendorCard);
    }

    setPlannerBoardOverride({ core: [...selectedBoard.core], support: nextSupport });
    setBrowseCategory(null);
    setPlannerToast(`${nextVendor.name} has been added to the support squad.`);
  }

  function handleVendorAction(actionId: string, vendor: VendorCardData) {
    if (actionId === 'swap') {
      setSwapVendorId(vendor.id);
      return;
    }

    if (actionId === 'message') {
      openMessageThread(vendor.id);
      return;
    }

    if (actionId === 'compare') {
      if (!compareVendorId) {
        setCompareVendorId(vendor.id);
        setPlannerToast(`Compare mode armed for ${vendor.slot}. Choose another supplier in the same slot.`);
        return;
      }

      if (compareVendorId === vendor.id) {
        setCompareVendorId(null);
        setPlannerToast('Compare mode cleared.');
        return;
      }

      if (!compareLeadVendor) {
        setCompareVendorId(vendor.id);
        return;
      }

      if (compareLeadVendor.slot !== vendor.slot) {
        setPlannerToast(`Select another ${compareLeadVendor.slot.toLowerCase()} supplier to compare.`);
        return;
      }

      const clashCandidate = plannerSurface?.clashCandidates.find((candidate) => {
        const involved = [compareLeadVendor.id, vendor.id];
        if (!involved.includes(candidate.currentVendorId) && !involved.includes(candidate.winnerVendorId)) {
          return false;
        }

        return candidate.comparison.some((row) => row.current === compareLeadVendor.name || row.challenger === vendor.name || row.current === vendor.name || row.challenger === compareLeadVendor.name);
      });

      setCompareVendorId(null);
      if (clashCandidate) {
        setClashVendorId(clashCandidate.currentVendorId);
        return;
      }

      setPlannerToast('Comparison data is being prepared for these suppliers.');
      return;
    }

    if (actionId === 'timeline') {
      setPlannerToast(`${vendor.name} is synced to the event timeline.`);
      return;
    }

    setPlannerToast(`Notes for ${vendor.name} stay inside the planner thread.`);
  }

  if (!mockSession) {
    return (
      <main className="stitchdShell authShell">
        <div className="pageGlow pageGlowLeft" />
        <div className="pageGlow pageGlowRight" />
        <section className="authGate authGateCompact glassPanel">
          {authStep === 'identify' ? (
            <form className="authEntryCard authEntryCardCompact glassPanelNested" onSubmit={requestMockOtp}>
              <div className="authBrandLockup">
                <div className="brandWordmark">STITCHD</div>
                <span className="minorLabel">Sign in</span>
              </div>
              <div className="authIntroBlock">
                <h1>Sign in or sign up before entering the planner.</h1>
                <p>Choose how you want to enter STITCHD, then continue with your work email or mobile number.</p>
              </div>
              <span className="minorLabel">Sign in</span>
              <h2>{authRoleConfig[authRole].label} access</h2>
              <p>Use your {authRole === 'admin' ? 'work email' : 'mobile number'} to continue into the STITCHD experience.</p>
              <label>
                Continue as
                <select value={authRole} onChange={(event) => handleRoleSelection(event.target.value as AuthRole)}>
                  {(Object.keys(authRoleConfig) as AuthRole[]).map((role) => (
                    <option key={role} value={role}>{authRoleConfig[role].label}</option>
                  ))}
                </select>
              </label>
              <label>
                {authRoleConfig[authRole].prompt}
                <input
                  value={authIdentifier}
                  onChange={(event) => setAuthIdentifier(event.target.value)}
                  placeholder={authRoleConfig[authRole].placeholder}
                  type={authRole === 'admin' ? 'email' : 'tel'}
                  autoComplete={authRole === 'admin' ? 'email' : 'tel'}
                />
              </label>
              {authNotice ? <p className="statusOk">{authNotice}</p> : null}
              {authError ? <p className="statusError">{authError}</p> : null}
              <button type="submit" className="primaryButton">Continue</button>
            </form>
          ) : (
            <form className="authEntryCard authEntryCardCompact glassPanelNested" onSubmit={completeMockSignIn}>
              <div className="authBrandLockup">
                <div className="brandWordmark">STITCHD</div>
                <span className="minorLabel">Verify access</span>
              </div>
              <div className="authIntroBlock">
                <h1>Sign in or sign up before entering the planner.</h1>
                <p>Finish verification to continue into your STITCHD workspace.</p>
              </div>
              <span className="minorLabel">Verify access</span>
              <h2>Enter verification code</h2>
              <p>{authNotice || `A verification code was sent to ${authIdentifier}.`}</p>
              <label>
                Verification code
                <input value={authOtp} onChange={(event) => setAuthOtp(event.target.value)} placeholder="123456" inputMode="numeric" maxLength={6} />
              </label>
              {authError ? <p className="statusError">{authError}</p> : null}
              <div className="authActionsRow">
                <button type="button" className="secondaryButton" onClick={() => setAuthStep('identify')}>Back</button>
                <button type="submit" className="primaryButton">Enter app</button>
              </div>
            </form>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="stitchdShell">
      <div className="pageGlow pageGlowLeft" />
      <div className="pageGlow pageGlowRight" />
      <section className="topRail">
        <section className="modeRail">
        <button type="button" className={`modePill ${surfaceMode === 'planner' ? 'is-active' : ''}`} onClick={() => setSurfaceMode('planner')}>
          STITCHD Planner
        </button>
          {canAccessOps ? (
            <button type="button" className={`modePill ${surfaceMode === 'ops' ? 'is-active' : ''}`} onClick={() => setSurfaceMode('ops')}>
              STITCHD Ops Console
            </button>
          ) : null}
        </section>

        <section className="sessionRail glassPanelNested">
          <div>
            <span className="sessionStatus">Signed in as {authRoleConfig[mockSession.role].signedInLabel}</span>
            <p>{mockSession.contact}</p>
          </div>
          <button type="button" className="ghostButton" onClick={signOutApp}>Sign out</button>
      </section>
      </section>

      {surfaceMode === 'planner' ? (
        <section className="plannerSurface">
          {plannerToast ? <div className="plannerToast">{plannerToast}</div> : null}
          <header className="plannerHeader glassPanel">
            <div className="brandPanel">
              <div className="brandPanelRow">
                <div className="brandWordmark">STITCHD</div>
                <button type="button" className="headerMenuButton" aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((current) => !current)}>
                  {mobileNavOpen ? <CloseIcon className="plannerIcon" /> : <MenuIcon className="plannerIcon" />}
                </button>
              </div>
              <p>{selectedEventOption.label}</p>
            </div>

            <nav className={`plannerNav ${mobileNavOpen ? 'is-open' : ''}`} aria-label="Primary planner tabs">
              {plannerTabs.map((tab) => (
                <button key={tab.id} type="button" className={`plannerNavTab ${activeTab === tab.id ? 'is-active' : ''}`} onClick={() => handlePlannerTabChange(tab.id)}>
                  {tab.label}
                </button>
              ))}
            </nav>

            {selectedCoach ? (
              <div className="coachCard glassPanel">
                <div className="coachAvatar" aria-hidden="true" style={{ backgroundImage: `linear-gradient(180deg, rgba(16, 33, 22, 0.04) 0%, rgba(16, 33, 22, 0.46) 100%), url(${selectedCoach.image})` }}>
                  <span className="coachAvatarLabel">{selectedCoach.cardLabel}</span>
                  <div className="coachAvatarScore">
                    <span>OVR</span>
                    <strong>{selectedCoach.score}</strong>
                  </div>
                </div>
                <div className="coachCardContent">
                  <div className="coachInfo">
                    <span className="minorLabel">COACH</span>
                    <strong>{selectedCoach.name}</strong>
                    <p>{selectedCoach.role}</p>
                    <div className="coachMeta">
                      <span className="scorePill">Rated {selectedCoach.score}</span>
                      <span>{selectedCoach.events} events led</span>
                    </div>
                  </div>
                  <div className="coachActions">
                    <button type="button" className="ghostButton coachButton" onClick={() => {
                      if (!activeCoachProfile) {
                        setPlannerToast('Coach profile is still loading.');
                        return;
                      }
                      setCoachProfileOpen(true);
                    }}>View Profile &gt;</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="coachCard coachCardEmpty glassPanel">
                <div className="coachAvatar coachAvatarEmpty" aria-hidden="true">+</div>
                <div className="coachCardContent">
                  <div className="coachInfo">
                    <span className="minorLabel">COACH</span>
                    <strong>Find a Coach</strong>
                    <p>Get a curated planning partner assigned to this event.</p>
                  </div>
                  <div className="coachActions">
                    <button type="button" className="ghostButton coachButton" onClick={() => setPlannerToast('Coach matching will open after the next shortlist refresh.')}>Assign Coach &gt;</button>
                  </div>
                </div>
              </div>
            )}
          </header>

          <section className="heroStrip glassPanel">
            <div>
              <span className="minorLabel">Wedding Pulse</span>
              <h1>{plannerExperience?.title || eventNames[selectedEventType]}</h1>
              <p>{selectedEventOption.intro}</p>
            </div>
            <div className="heroActions">
              <span className="eventChip is-active">Wedding MVP</span>
            </div>
            <div className={`heroSummary pulseScoreCard is-${readinessTone}`}>
              <span className="minorLabel">Wedding Readiness</span>
              <div className="pulseScoreCircle">
                <strong>{readinessScore}%</strong>
                <span>{readinessLabel}</span>
              </div>
              <p>{readinessTone === 'healthy' ? 'Healthy' : readinessTone === 'watch' ? 'Watch closely' : 'Action required'}</p>
              {plannerLoading ? <p>Refreshing live planner data...</p> : null}
            </div>
          </section>

          <section className="plannerLayout">
            <aside className="plannerLeftRail">
              <div className="summaryCard glassPanel">
                <span className="minorLabel">STITCHD Insights</span>
                <strong>{formatCurrencyFromRands(savingsIdentified)}</strong>
                <p>Savings identified right now.</p>
                <div className="insightBulletList">
                  {insightCards.map((insight) => (
                    <span key={insight}>{insight}</span>
                  ))}
                </div>
              </div>

              <div className="summaryCard glassPanel">
                <span className="minorLabel">Readiness Engine</span>
                <strong>{readinessScore}%</strong>
                <div className="chemistryBars">
                  {[0, 1, 2, 3, 4, 5].map((value) => (
                    <span key={value} className={value < Math.round(readinessScore / 16) ? 'is-filled' : ''} />
                  ))}
                </div>
                <p>Venue, budget, timeline, and supplier lock-ins are driving the current pulse.</p>
              </div>

              <div className="summaryCard glassPanel">
                <span className="minorLabel">Recommended Bundle</span>
                <strong>{supplierBundles.title}</strong>
                <div className="bundleMeta">
                  <span>{supplierBundles.saveLabel}</span>
                  <span>{supplierBundles.boostLabel}</span>
                </div>
                <p>This bundle tightens readiness while reducing back-and-forth across key wedding-day suppliers.</p>
              </div>

              {readinessScore >= 90 ? (
                <div className="summaryCard summaryCardAccent glassPanel">
                  <span className="minorLabel">Wedding Ready</span>
                  <strong>{readinessScore}%</strong>
                  <p>Everything is on track. Estimated stress reduction 41% and savings {formatCurrencyFromRands(9300)}.</p>
                  <div className="summaryCardActions">
                    <button type="button" className="ghostButton" onClick={() => setReadinessReportOpen(true)}>Open Ready Report</button>
                  </div>
                </div>
              ) : null}
            </aside>

            <section className="plannerMainBoard">
              <div className="sectionHeadingRow">
                <div>
                  <span className="minorLabel">{plannerTabs.find((tab) => tab.id === activeTab)?.label}</span>
                  <h2>{activeTab === 'squad' ? 'How healthy your wedding is right now' : `${plannerTabs.find((tab) => tab.id === activeTab)?.label} view`}</h2>
                </div>
                <button type="button" className="ghostButton" onClick={() => void autoPickSquad()} disabled={aiPicking}>
                  {aiPicking ? 'Refreshing picks...' : 'Refresh recommendations'}
                </button>
              </div>
              {activeTab === 'squad' ? (
                <div className="dashboardTab">
                  <div className="kpiGrid">
                    <article className="kpiMetricCard glassPanelNested">
                      <span className="minorLabel">Days To Wedding</span>
                      <strong>{daysToEvent}</strong>
                    </article>
                    <article className="kpiMetricCard glassPanelNested">
                      <span className="minorLabel">Tasks Complete</span>
                      <strong>{completedTaskCount}/{totalTaskCount}</strong>
                    </article>
                    <article className="kpiMetricCard glassPanelNested">
                      <span className="minorLabel">Budget Used</span>
                      <strong>{formatCurrencyFromRands(budgetUsed)} / {formatCurrencyFromRands(plannerSurface?.budget.total || totalBudget)}</strong>
                    </article>
                    <article className="kpiMetricCard glassPanelNested">
                      <span className="minorLabel">Risk Alerts</span>
                      <strong>{riskAlerts.length}</strong>
                    </article>
                  </div>

                  <div className="tabPanelGrid twoUpGrid">
                    <article className="tabInsightCard glassPanelNested weatherWidgetCard">
                      <span className="minorLabel">Wedding Day Forecast</span>
                      <strong>{selectedWeather.temperature}</strong>
                      <p>{selectedWeather.rainChance}% Rain • {weatherStatus}</p>
                      <div className="splitMeta"><span>{selectedWeather.label}</span><span>{locationLabel}</span></div>
                    </article>
                    <article className="tabInsightCard glassPanelNested insightsBoxCard">
                      <span className="minorLabel">STITCHD Insights</span>
                      <strong>{insightCards[0]}</strong>
                      <p>{insightCards[1]}</p>
                    </article>
                  </div>

                  <div className="riskList">
                    {riskAlerts.map((alert) => (
                      <article key={alert.title} className="riskAlertCard glassPanelNested">
                        <div>
                          <span className="minorLabel">Risk Alert</span>
                          <strong>{alert.title}</strong>
                        </div>
                        <div className="splitMeta"><span>Impact: {alert.impact}</span><span>Action: {alert.action}</span></div>
                      </article>
                    ))}
                  </div>

                  <div className="sectionHeadingRow supportHeading">
                    <div>
                      <span className="minorLabel">Recommended Suppliers</span>
                      <h2>What needs attention next</h2>
                    </div>
                  </div>
                  <div className="supplierRail">
                    {selectedBoard.core.slice(0, 4).map((vendor) => {
                      const scorecard = getSupplierScorecard(vendor);
                      return (
                        <article key={vendor.id} className="supplierSpotlightCard glassPanelNested">
                          <div className="supplierSpotlightMedia" style={{ backgroundImage: `linear-gradient(180deg, rgba(16, 33, 22, 0.12), rgba(16, 33, 22, 0.2)), ${getVendorArtwork(vendor)}`, backgroundPosition: getVendorArtworkPosition(vendor) }} />
                          <div className="supplierSpotlightBody">
                            <div className="supplierBadges">
                              {getSupplierBadges(vendor).map((badge) => <span key={badge} className="miniTag">{badge}</span>)}
                            </div>
                            <strong>{vendor.name}</strong>
                            <p>{vendor.slot} • {locationLabel}</p>
                            <div className="supplierStatRow">
                              <span>{formatStars(vendor.rating)}</span>
                              <span>Reliability {scorecard.reliability}</span>
                              <span>{vendor.priceLabel}</span>
                            </div>
                            <button type="button" className="ghostButton" onClick={() => handlePlannerTabChange('suppliers')}>Open Marketplace</button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {activeTab === 'suppliers' ? (
                <div className="marketplaceScreen">
                  <div className="supplierRail">
                    {allVendors.map((vendor) => {
                      const scorecard = getSupplierScorecard(vendor);
                      return (
                        <article key={vendor.id} className="supplierMarketplaceCard glassPanelNested">
                          <div className="supplierMarketplaceMedia" style={{ backgroundImage: `linear-gradient(180deg, rgba(16, 33, 22, 0.06), rgba(16, 33, 22, 0.28)), ${getVendorArtwork(vendor)}`, backgroundPosition: getVendorArtworkPosition(vendor) }}>
                            <span className="vendorSlot">{vendor.slot}</span>
                            <strong className="vendorScore">{scorecard.reliability}</strong>
                          </div>
                          <div className="supplierMarketplaceBody">
                            <div className="supplierBadges">
                              {getSupplierBadges(vendor).map((badge) => <span key={badge} className="miniTag">{badge}</span>)}
                            </div>
                            <div className="supplierMarketplaceIdentity">
                              <strong>{vendor.name}</strong>
                              <p>{vendor.subcategory}</p>
                            </div>
                            <div className="supplierStatGrid">
                              <span>Overall {vendor.rating.toFixed(1)}</span>
                              <span>Reliability {scorecard.reliability}</span>
                              <span>Communication {scorecard.communication}</span>
                              <span>Value {scorecard.value}</span>
                              <span>Quality {scorecard.quality}</span>
                              <span>{vendor.priceLabel}</span>
                              <span>{getSupplierCapacity(vendor.slot)}</span>
                              <span>{locationLabel}</span>
                              <span>{getSupplierAvailability(vendor.status)}</span>
                            </div>
                            <div className="vendorActions">
                              <button type="button" className="ghostButton" onClick={() => setSelectedSupplierId(vendor.id)}>View</button>
                              <button type="button" className="primaryButton" onClick={() => setBrowseCategory(vendor.slot.toLowerCase())}>Shortlist</button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  <article className="bundleCard glassPanelNested">
                    <div>
                      <div className="bundleTitleRow">
                        <span className="minorLabel">Recommended Bundle</span>
                        <strong>{supplierBundles.title}</strong>
                      </div>
                      <p>{supplierBundles.saveLabel}</p>
                    </div>
                    <div className="bundleMeta">
                      <span>{supplierBundles.boostLabel}</span>
                      <button type="button" className="ghostButton" onClick={() => setPlannerToast(`${supplierBundles.title} has been pinned for coach review.`)}>Pin Bundle</button>
                    </div>
                  </article>

                  <div className="valueAddCarousel">
                    {valueAddMarketplace.map((item) => (
                      <article key={item} className="valueAddCard glassPanelNested">
                        <span className="minorLabel">Value add</span>
                        <strong>{item}</strong>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null}

              {activeTab === 'budget' ? (
                <div className="budgetPulseGrid">
                  <article className="budgetOverviewCard glassPanelNested">
                    <span className="minorLabel">Budget Pulse</span>
                    <div className="budgetSummaryRow"><span>Budget</span><strong>{formatCurrencyFromRands(plannerSurface?.budget.total || totalBudget)}</strong></div>
                    <div className="budgetSummaryRow"><span>Spent</span><strong>{formatCurrencyFromRands(budgetUsed)}</strong></div>
                    <div className="budgetSummaryRow"><span>Remaining</span><strong>{formatCurrencyFromRands(budgetRemaining)}</strong></div>
                    <div className="budgetSummaryRow"><span>Budget Health</span><strong className={budgetProgress <= 70 ? 'is-green' : budgetProgress <= 90 ? 'is-gold' : 'is-red'}>{budgetProgress <= 70 ? 'Healthy' : budgetProgress <= 90 ? 'Watch' : 'Risk'}</strong></div>
                    <div className="progressTrack"><span className={budgetProgress > 95 ? 'is-over' : ''} style={{ width: `${budgetProgress}%` }} /></div>
                  </article>

                  <article className="budgetChartCard glassPanelNested">
                    <span className="minorLabel">Category Split</span>
                    <div className="budgetDonut" style={{ backgroundImage: `conic-gradient(${budgetChartStops})` }}>
                      <div>
                        <strong>{formatCurrencyFromRands(budgetUsed)}</strong>
                        <span>Spent</span>
                      </div>
                    </div>
                    <div className="budgetLegend">
                      {spendByCategory.map((entry) => (
                        <div key={entry.label} className="budgetLegendRow">
                          <span>{entry.label}</span>
                          <strong>{formatCurrencyFromRands(entry.amount)}</strong>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="budgetPanel glassPanelNested fullWidthPanel">
                    <div className="budgetHeader">
                      <div>
                        <span className="minorLabel">Savings Found</span>
                        <strong>{formatCurrencyFromRands(savingsIdentified)}</strong>
                        <p>Small recommendation changes are still available before final lock-in.</p>
                      </div>
                    </div>
                    <div className="budgetLineList">
                      {(plannerSurface?.budget.lines || []).map((line) => (
                        <article key={line.id} className="budgetLineItem">
                          <div>
                            <strong>{line.label}</strong>
                            <p>{line.owner}</p>
                          </div>
                          <div className="budgetLineMeta">
                            <span className={`statusBadge status-${line.status === 'pending' ? 'at_risk' : line.status === 'quote' ? 'optional' : line.status === 'booked' ? 'booked' : 'secured'}`}>{line.status}</span>
                            <strong>{formatCurrencyFromRands(line.amount)}</strong>
                            <p>{line.dueLabel}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </article>
                </div>
              ) : null}

              {activeTab === 'inspiration' ? (
                <div className="journeyPanel">
                  {timelineItems.map((item, index) => (
                    <article key={item.label} className={`journeyStep glassPanelNested ${item.status === 'done' ? 'is-done' : item.status === 'active' ? 'is-active' : ''}`}>
                      <div className="journeyStepMarker">
                        <span>{item.status === 'done' ? '✓' : item.status === 'active' ? '⚠' : '○'}</span>
                        {index < timelineItems.length - 1 ? <div className="journeyConnector" /> : null}
                      </div>
                      <div>
                        <strong>{item.label}</strong>
                        {item.dependency ? <p>{item.dependency}</p> : <p>{item.status === 'done' ? 'Completed and synced into your wedding plan.' : 'Next action is still open.'}</p>}
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

              {activeTab === 'marketplace' ? (
                <div className="coachScreen">
                  {selectedCoach ? (
                    <article className="coachPrimaryCard glassPanelNested">
                      <div className="coachAvatar" aria-hidden="true" style={{ backgroundImage: `linear-gradient(180deg, rgba(16, 33, 22, 0.04) 0%, rgba(16, 33, 22, 0.46) 100%), url(${selectedCoach.image})` }}>
                        <span className="coachAvatarLabel">{selectedCoach.cardLabel}</span>
                        <div className="coachAvatarScore">
                          <span>OVR</span>
                          <strong>{selectedCoach.score}</strong>
                        </div>
                      </div>
                      <div className="coachInfoStack">
                        <span className="minorLabel">Coach Profile</span>
                        <strong>{selectedCoach.name}</strong>
                        <p>{selectedCoach.role}</p>
                        <div className="coachMeta">
                          <span className="scorePill">{selectedCoach.score} Rating</span>
                          <span>{selectedCoach.events} Weddings Managed</span>
                        </div>
                        <div className="coachQuickActions">
                          {coachQuickActions.map((item) => item.href ? (
                            <a key={item.label} className={`coachActionLink ${item.label === 'WhatsApp' ? 'is-whatsapp' : ''}`} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noreferrer' : undefined}>
                              <item.Icon className="plannerIcon" />
                              <span>{item.label}</span>
                            </a>
                          ) : (
                            <button key={item.label} type="button" className="coachActionLink" onClick={item.action}>
                              <item.Icon className="plannerIcon" />
                              <span>{item.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </article>
                  ) : null}

                  <article className="coachNoteCard glassPanelNested">
                    <span className="minorLabel">Coach Notes</span>
                    <strong>{coachNote}</strong>
                    <p>{plannerSurface?.coachProfile.bio}</p>
                  </article>

                  <article className="coachConversationPreview glassPanelNested">
                    <span className="minorLabel">Latest Messages</span>
                    {(messageThreads.slice(0, 2)).map((thread) => (
                      <div key={thread.id} className="coachConversationRow">
                        <strong>{thread.vendorName}</strong>
                        <p>{thread.lastMessage}</p>
                      </div>
                    ))}
                  </article>
                </div>
              ) : null}
            </section>

            <aside className="plannerSidebar">
              <div className="summaryCard glassPanel">
                <div className="widgetHeader">
                  <ClockIcon className="plannerIcon widgetIcon" />
                  <span className="minorLabel">Days To Wedding</span>
                </div>
                <strong>{daysToEvent}</strong>
                <p className="countdownLabel">Days to go</p>
                <div className="progressTrack"><span style={{ width: `${planningProgress}%` }} /></div>
                <div className="splitMeta"><span>{formatPlannerDateLabel(selectedSchedule.eventDate)}</span><span>Planning active</span></div>
              </div>

              <div className="summaryCard glassPanel">
                <div className="widgetHeader">
                  <SparkIcon className="plannerIcon widgetIcon" />
                  <span className="minorLabel">Readiness Summary</span>
                </div>
                <strong>{readinessScore}%</strong>
                <p>{readinessLabel}</p>
                <div className="progressTrack"><span style={{ width: `${readinessScore}%` }} /></div>
                <div className="splitMeta"><span>{completedTaskCount}/{totalTaskCount} tasks landed</span><span>{riskAlerts.length} alerts open</span></div>
              </div>

              <div className="summaryCard glassPanel">
                <div className="widgetHeader">
                  <CloudIcon className="plannerIcon widgetIcon" />
                  <span className="minorLabel">Wedding Day Forecast</span>
                </div>
                <div className="weatherHero">
                  <div className="weatherIcon"><WeatherGlyph iconKey={eventForecast?.iconKey || getWeatherIcon(selectedWeather.rainChance)} className="weatherGlyph" /></div>
                  <div>
                    <strong>{selectedWeather.temperature}</strong>
                    <p>{selectedWeather.label}</p>
                  </div>
                </div>
                <div className="weatherStatusRow">
                  <span>{plannerSurface?.locationLabel || 'Planner event forecast'}</span>
                  <span>Event-day forecast active</span>
                </div>
                <div className="splitMeta emphasised"><span>Chance of rain</span><span className={getWeatherTone(selectedWeather.rainChance)}>{selectedWeather.rainChance}%</span></div>
                <div className="forecastStrip">
                  {forecastDays.map((day) => (
                    <div key={day.day} className={`forecastDay ${day.isEventDay ? 'is-active' : ''}`}>
                      <span>{day.day}</span>
                      <small className="forecastIcon"><WeatherGlyph iconKey={day.iconKey} className="forecastGlyph" /></small>
                      <strong>{day.temperature}</strong>
                      <small className={getWeatherTone(day.rainChance)}>{day.rainChance}%</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="summaryCard glassPanel">
                <div className="widgetHeader">
                  <ChatIcon className="plannerIcon widgetIcon" />
                  <span className="minorLabel">Coach Note</span>
                </div>
                <strong>{selectedCoach?.name || 'Coach'}</strong>
                <p>{coachNote}</p>
                <button type="button" className="ghostButton" onClick={() => handlePlannerTabChange('marketplace')}>Open coach screen</button>
              </div>
            </aside>
          </section>

          <footer className="statusBar glassPanel">
            {[
              { label: 'Secured', value: `${securedCount}/${totalSlots}`, note: 'Essential suppliers are locked in.' },
              { label: 'Squad Chemistry', value: `${readinessScore}%`, note: 'Wedding readiness is easy to understand.' },
              { label: 'Labour Tracker', value: `${completedTaskCount}/${totalTaskCount}`, note: 'Your task journey is visible at a glance.' },
              { label: 'Timeline Sync', value: timelineValue, note: 'Dependencies are visible before they become blockers.' },
              { label: 'Communication', value: 'Coach Live', note: 'A human coordinator remains in the loop.' },
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
            <button type="button" className="messageButton" onClick={() => openMessageThread()}>
              View Messages <span>{plannerSurface?.unreadCount || 0}</span>
            </button>
          </footer>

          <nav className="plannerBottomNav glassPanel" aria-label="Primary planner navigation">
            {plannerTabs.map((tab) => {
              const Icon = plannerTabIcons[tab.id];
              return (
                <button key={tab.id} type="button" className={`plannerBottomNavButton ${activeTab === tab.id ? 'is-active' : ''}`} onClick={() => handlePlannerTabChange(tab.id)}>
                  <Icon className="plannerIcon" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {coachProfileOpen && activeCoachProfile ? (
            <div className="overlayShell" role="dialog" aria-modal="true">
              <div className="overlayPanel glassPanel">
                <div className="overlayHeader">
                  <div>
                    <span className="minorLabel">Assigned coach</span>
                    <strong>{activeCoachProfile.name}</strong>
                    <p>{activeCoachProfile.role}</p>
                  </div>
                  <button type="button" className="ghostButton" onClick={() => setCoachProfileOpen(false)}>Close</button>
                </div>
                <p>{activeCoachProfile.bio}</p>
                <div className="tagRow">
                  {activeCoachProfile.specialties.map((specialty) => (
                    <span key={specialty} className="miniTag">{specialty}</span>
                  ))}
                </div>
                <div className="splitMeta emphasised">
                  <span>{activeCoachProfile.rating.toFixed(1)} rating</span>
                  <span>{activeCoachProfile.eventsCompleted} events</span>
                </div>
                <p>{activeCoachProfile.nextAvailable}</p>
              </div>
            </div>
          ) : null}

          {readinessReportOpen ? (
            <div className="overlayShell" role="dialog" aria-modal="true">
              <div className="overlayPanel glassPanel">
                <div className="overlayHeader">
                  <div>
                    <span className="minorLabel">Wedding Ready Report</span>
                    <strong>{readinessScore}% readiness</strong>
                    <p>{eventNames[selectedEventType]} is being tracked across suppliers, budget, weather, and coach coordination.</p>
                  </div>
                  <button type="button" className="ghostButton" onClick={() => setReadinessReportOpen(false)}>Close</button>
                </div>
                <div className="detailMetricGrid">
                  <article className="detailMetricCard">
                    <span className="minorLabel">Budget Remaining</span>
                    <strong>{formatCurrencyFromRands(budgetRemaining)}</strong>
                    <p>{budgetProgress <= 90 ? 'Budget is still in a controllable zone.' : 'Optional lines should be reviewed this week.'}</p>
                  </article>
                  <article className="detailMetricCard">
                    <span className="minorLabel">Open Risks</span>
                    <strong>{riskAlerts.length}</strong>
                    <p>{riskAlerts.length === 0 ? 'No major risks are open.' : 'Risks are visible early enough to resolve cleanly.'}</p>
                  </article>
                  <article className="detailMetricCard">
                    <span className="minorLabel">Coach Status</span>
                    <strong>{selectedCoach?.name || 'Assigned'}</strong>
                    <p>{coachNote}</p>
                  </article>
                </div>
                <div className="detailChecklist">
                  {readinessChecklist.map((item) => (
                    <article key={item.label} className={`detailChecklistItem ${item.complete ? 'is-complete' : ''}`}>
                      <strong>{item.complete ? '✓' : '○'} {item.label}</strong>
                      <p>{item.detail}</p>
                    </article>
                  ))}
                </div>
                <div className="actionRow actionRowWrap">
                  <button type="button" className="primaryButton" onClick={() => {
                    setReadinessReportOpen(false);
                    setCoachScheduleOpen(true);
                  }}>Book Coach Review</button>
                  <button type="button" className="ghostButton" onClick={() => {
                    setReadinessReportOpen(false);
                    handlePlannerTabChange('suppliers');
                  }}>Review Suppliers</button>
                </div>
              </div>
            </div>
          ) : null}

          {selectedSupplier ? (
            <div className="overlayShell" role="dialog" aria-modal="true">
              <div className="overlayPanel glassPanel">
                <div className="overlayHeader">
                  <div>
                    <span className="minorLabel">Supplier review</span>
                    <strong>{selectedSupplier.name}</strong>
                    <p>{selectedSupplier.slot} • {selectedSupplier.subcategory}</p>
                  </div>
                  <button type="button" className="ghostButton" onClick={() => setSelectedSupplierId(null)}>Close</button>
                </div>
                <div className="supplierDetailHero">
                  <div className="supplierDetailMedia" style={{ backgroundImage: `linear-gradient(180deg, rgba(16, 33, 22, 0.08), rgba(16, 33, 22, 0.42)), ${getVendorArtwork(selectedSupplier)}`, backgroundPosition: getVendorArtworkPosition(selectedSupplier) }} />
                  <div className="supplierDetailContent">
                    <div className="supplierBadges">
                      {getSupplierBadges(selectedSupplier).map((badge) => <span key={badge} className="miniTag">{badge}</span>)}
                    </div>
                    <strong>{formatStars(selectedSupplier.rating)} • {selectedSupplier.reviewCount} reviews</strong>
                    <p>{getSupplierBestFit(selectedSupplier, locationLabel)}</p>
                    <div className="supplierDetailStats">
                      <span>Reliability {getSupplierScorecard(selectedSupplier).reliability}</span>
                      <span>Communication {getSupplierScorecard(selectedSupplier).communication}</span>
                      <span>Capacity {getSupplierCapacity(selectedSupplier.slot)}</span>
                      <span>{getSupplierAvailability(selectedSupplier.status)}</span>
                    </div>
                  </div>
                </div>
                <div className="detailMetricGrid">
                  <article className="detailMetricCard">
                    <span className="minorLabel">Price</span>
                    <strong>{selectedSupplier.priceLabel}</strong>
                    <p>{getSupplierDepositTerms(selectedSupplier.slot)}</p>
                  </article>
                  <article className="detailMetricCard">
                    <span className="minorLabel">Lead Time</span>
                    <strong>{getSupplierLeadTime(selectedSupplier.slot)}</strong>
                    <p>Timing is aligned to your current event date and planning window.</p>
                  </article>
                  <article className="detailMetricCard">
                    <span className="minorLabel">Delivery Scope</span>
                    <strong>{selectedSupplier.slot}</strong>
                    <p>{selectedSupplier.subcategory}</p>
                  </article>
                </div>
                <div className="detailChecklist">
                  {getSupplierDeliverables(selectedSupplier.slot).map((item) => (
                    <article key={item} className="detailChecklistItem is-complete">
                      <strong>✓ {item}</strong>
                      <p>{selectedSupplier.name} can cover this checkpoint inside the current plan.</p>
                    </article>
                  ))}
                </div>
                <div className="actionRow actionRowWrap">
                  <button type="button" className="primaryButton" onClick={() => {
                    setSelectedSupplierId(null);
                    setBrowseCategory(selectedSupplier.slot.toLowerCase());
                  }}>Open Shortlist</button>
                  <button type="button" className="ghostButton" onClick={() => {
                    setSelectedSupplierId(null);
                    openMessageThread(selectedSupplier.id);
                  }}>Message Supplier</button>
                </div>
              </div>
            </div>
          ) : null}

          {coachScheduleOpen ? (
            <div className="overlayShell overlaySheet" role="dialog" aria-modal="true">
              <div className="overlayPanel glassPanel bottomSheetPanel">
                <div className="overlayHeader">
                  <div>
                    <span className="minorLabel">Coach Scheduling</span>
                    <strong>Book a planning review with {selectedCoach?.name || 'your coach'}</strong>
                    <p>Select a live planning slot and keep the wedding plan moving.</p>
                  </div>
                  <button type="button" className="ghostButton" onClick={() => {
                    setCoachScheduleOpen(false);
                    setSelectedCoachSlot(null);
                  }}>Close</button>
                </div>
                <div className="coachScheduleGrid">
                  {coachMeetingSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`coachScheduleOption ${selectedCoachSlot === slot ? 'is-active' : ''}`}
                      onClick={() => setSelectedCoachSlot(slot)}
                    >
                      <strong>{slot}</strong>
                      <span>{selectedCoach?.role || 'Lead Planner'}</span>
                    </button>
                  ))}
                </div>
                <div className="actionRow actionRowWrap">
                  <button
                    type="button"
                    className="primaryButton"
                    disabled={!selectedCoachSlot}
                    onClick={() => {
                      if (!selectedCoachSlot) {
                        return;
                      }

                      setPlannerToast(`Coach review booked for ${selectedCoachSlot}.`);
                      setCoachScheduleOpen(false);
                      setSelectedCoachSlot(null);
                    }}
                  >
                    Confirm Slot
                  </button>
                  <button type="button" className="ghostButton" onClick={() => openMessageThread()}>Open Coach Messages</button>
                </div>
              </div>
            </div>
          ) : null}

          {browseCategory ? (
            <div className="overlayShell" role="dialog" aria-modal="true">
              <div className="overlayPanel glassPanel">
                <div className="overlayHeader">
                  <div>
                    <span className="minorLabel">Supplier browse</span>
                    <strong>{browseCategory === 'all' ? 'Recommended suppliers' : browseCategory}</strong>
                  </div>
                  <button type="button" className="ghostButton" onClick={() => setBrowseCategory(null)}>Close</button>
                </div>
                <div className="modalList">
                  {browseSuppliers.map((supplier) => (
                    <article key={supplier.id} className="modalListItem">
                      <div>
                        <strong>{supplier.name}</strong>
                        <p>{supplier.slot} · {supplier.subcategory}</p>
                        {browseCategory === 'tents' ? <span className="miniTag">Recommended for your event date</span> : null}
                        <p>{supplier.compatibilityNote}</p>
                      </div>
                      <div className="modalListMeta">
                        <span>{supplier.priceLabel}</span>
                        <span>{formatStars(supplier.rating)}</span>
                        <button type="button" className="ghostButton" onClick={() => addSupportSupplier(supplier)}>Add to squad</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {swapVendorId ? (
            <div className="overlayShell overlaySheet" role="dialog" aria-modal="true">
              <div className="overlayPanel glassPanel bottomSheetPanel">
                <div className="overlayHeader">
                  <div>
                    <span className="minorLabel">Swap supplier</span>
                    <strong>Alternative matches</strong>
                  </div>
                  <button type="button" className="ghostButton" onClick={() => setSwapVendorId(null)}>Close</button>
                </div>
                <div className="modalList compactList">
                  {swapChoices.map((supplier) => (
                    <article key={supplier.id} className="modalListItem compactItem">
                      <div>
                        <strong>{supplier.name}</strong>
                        <p>{supplier.compatibilityNote}</p>
                      </div>
                      <div className="modalListMeta">
                        <span>{supplier.priceLabel}</span>
                        <button type="button" className="ghostButton" onClick={() => replaceVendor(supplier)}>Use this supplier</button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {activeClash ? (
            <div className="overlayShell" role="dialog" aria-modal="true">
              <div className="overlayPanel glassPanel">
                <div className="overlayHeader">
                  <div>
                    <span className="minorLabel">Vendor clash</span>
                    <strong>{activeClash.summary}</strong>
                  </div>
                  <button type="button" className="ghostButton" onClick={() => setClashVendorId(null)}>Close</button>
                </div>
                <div className="comparisonGrid">
                  {activeClash.comparison.map((row) => (
                    <div key={row.label} className="comparisonRow">
                      <span>{row.current}</span>
                      <strong>{row.label}</strong>
                      <span>{row.challenger}</span>
                    </div>
                  ))}
                </div>
                <div className="splitMeta emphasised">
                  <span>Winner: {activeClash.winnerVendorId}</span>
                  <span>{activeClash.communityChoicePct}% community choice</span>
                </div>
              </div>
            </div>
          ) : null}

          {activeThread ? (
            <div className="drawerShell" role="dialog" aria-modal="true">
              <div className="drawerPanel glassPanel">
                <div className="overlayHeader">
                  <div>
                    <span className="minorLabel">Messages</span>
                    <strong>{activeThread.vendorName}</strong>
                    <p>{activeThread.slot}</p>
                  </div>
                  <button type="button" className="ghostButton" onClick={() => setActiveThreadId(null)}>Close</button>
                </div>
                <div className="threadPickerRow">
                  {messageThreads.map((thread) => (
                    <button key={thread.id} type="button" className={`threadPill ${thread.id === activeThread.id ? 'is-active' : ''}`} onClick={() => setActiveThreadId(thread.id)}>
                      {thread.vendorName} <span>{thread.unreadCount}</span>
                    </button>
                  ))}
                </div>
                <div className="messageThread">
                  {activeThread.messages.map((message) => (
                    <article key={message.id} className={`messageBubble sender-${message.sender}`}>
                      <strong>{message.senderName}</strong>
                      <p>{message.text}</p>
                      <small>{new Intl.DateTimeFormat('en-ZA', { hour: '2-digit', minute: '2-digit' }).format(new Date(message.timestamp))}</small>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="opsSurface">
          <header className="opsHero glassPanel">
            <div>
              <span className="minorLabel">Event Command Centre</span>
              <h1>Weddings at risk, overdue tasks, and supplier escalations in one place.</h1>
              <p>
                This is the admin and coordinator layer for active events. Use it to review marketplace quality,
                keep teams on track, and monitor readiness across the live wedding book.
              </p>
            </div>
            <div className="opsHeroBadge glassPanel">
              <span>Coordinator view</span>
              <strong>Readiness heatmap active</strong>
              <p>Provider review, payment monitoring, and controls remain connected.</p>
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
                  <button type="button" className="primaryButton" onClick={signOutApp}>Sign out</button>
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

                  <div>
                    <div className="sectionHeader compactHeader">
                      <div>
                        <p className="eyebrow compact">Booking Inspector</p>
                        <h2>Booking journey logic</h2>
                      </div>
                    </div>

                    {bookingJourneys.length === 0 ? (
                      <p className="emptyState">No booking journeys are available yet.</p>
                    ) : (
                      <div className="journeyFeed">
                        {bookingJourneys.map((journey) => (
                          <article className="journeyCard glassPanelNested" key={journey.id}>
                            <div className="journeyCardHeader">
                              <div>
                                <strong>{journey.bookingRef}</strong>
                                <p>{journey.service} • {journey.type.toUpperCase()}</p>
                              </div>
                              <span className={`statusPill ${journey.paymentStatus === 'paid' ? 'approved' : 'pending'}`}>
                                {journey.currentStage.replace('_', ' ')}
                              </span>
                            </div>

                            <div className="journeyMetaGrid">
                              <div>
                                <span>Customer</span>
                                <strong>{journey.customerName}</strong>
                              </div>
                              <div>
                                <span>Provider</span>
                                <strong>{journey.providerName}</strong>
                              </div>
                              <div>
                                <span>Payment</span>
                                <strong>{journey.paymentMethod.toUpperCase()} • {journey.paymentStatus.toUpperCase()}</strong>
                              </div>
                              <div>
                                <span>Settlement</span>
                                <strong>{formatCurrency(journey.providerEarningsCents)} payout</strong>
                              </div>
                            </div>

                            <div className="journeyStageRail" aria-label={`${journey.bookingRef} booking stages`}>
                              {journey.stages.map((stage) => (
                                <div key={stage.key} className={`journeyStage ${stage.status === 'active' ? 'is-active' : stage.status === 'done' ? 'is-done' : ''}`}>
                                  <span className="journeyStageDot" />
                                  <strong>{stage.label}</strong>
                                  <small>{stage.timestamp ? new Date(stage.timestamp).toLocaleString() : 'Pending'}</small>
                                  <p>{stage.note}</p>
                                </div>
                              ))}
                            </div>

                            <div className="journeyFooter">
                              <div className="journeySettlementSummary">
                                <span>Total charged {formatCurrency(journey.amountCents)}</span>
                                <span>Commission {formatCurrency(journey.commissionCents)}</span>
                                {journey.scheduledAt ? <span>Scheduled {new Date(journey.scheduledAt).toLocaleString()}</span> : <span>Instant dispatch</span>}
                              </div>
                              <div className="journeyNotifications">
                                <span className="minorLabel">Notifications sent</span>
                                {journey.notifications.map((notification) => (
                                  <div key={notification.id} className="journeyNotificationRow">
                                    <strong>{notification.audience}</strong>
                                    <span>{notification.message}</span>
                                    <small>{new Date(notification.timestamp).toLocaleString()}</small>
                                  </div>
                                ))}
                              </div>
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
