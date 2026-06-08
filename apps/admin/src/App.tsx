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
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#25D366" />
      <path fill="#ffffff" d="M16 7.5A8.5 8.5 0 0 0 7.5 16c0 1.5.4 2.96 1.15 4.25L7.2 24.8l4.65-1.22A8.5 8.5 0 1 0 16 7.5zm0 15.6a7.1 7.1 0 0 1-3.62-.99l-.26-.15-2.7.7.72-2.62-.18-.27A7.1 7.1 0 1 1 16 23.1zm3.9-5.3c-.21-.1-1.26-.62-1.45-.69-.2-.07-.34-.1-.49.1-.14.21-.56.69-.68.83-.13.14-.25.16-.47.05a5.9 5.9 0 0 1-1.74-1.07 6.6 6.6 0 0 1-1.2-1.51c-.13-.21-.01-.32.1-.43l.31-.36.21-.33a.39.39 0 0 0 0-.38l-.48-1.17c-.12-.32-.25-.27-.35-.28l-.36-.01a.7.7 0 0 0-.51.24 2.14 2.14 0 0 0-.67 1.59 3.72 3.72 0 0 0 .78 1.98 8.53 8.53 0 0 0 3.27 2.88c.46.2.88.33 1.25.43a2.9 2.9 0 0 0 1.34.08 2.1 2.1 0 0 0 1.38-.97 1.7 1.7 0 0 0 .12-.97c-.05-.08-.19-.13-.4-.23z" />
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

function StitchdWordmark({ variant = 'header' }: { variant?: 'header' | 'landing' | 'auth' }) {
  return (
    <div className="stitchdWordmark" data-variant={variant} aria-label="STITCH-D">
      <span className="stitchdWordmarkText">STITCH</span>
      <span className="stitchdWordmarkDash">-</span>
      <span className="stitchdWordmarkText">D</span>
    </div>
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
type PlannerTab = 'squad' | 'rsvp' | 'inspiration' | 'suppliers' | 'budget' | 'milestones' | 'marketplace' | 'event-admin';
type EventType = 'wedding' | 'lobola' | 'funeral' | 'corporate' | 'birthday';
type VendorStatus = 'secured' | 'booked' | 'optional' | 'recommended' | 'at_risk' | 'shortlisted';

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

type RsvpGroup = {
  id: string;
  label: string;
  invited: number;
  confirmed: number;
  pending: number;
  declined: number;
  risk: 'Low' | 'Medium' | 'High';
};

type RsvpGuest = {
  id: string;
  name: string;
  phone: string;
  group: string;
  status: 'Confirmed' | 'Pending' | 'Declined' | 'No Response' | 'Maybe' | 'Verbal Confirmation';
  plusOnes: number;
  lastContacted: string;
  notes: string;
};

type CulturalMilestone = {
  id: string;
  title: string;
  status: 'complete' | 'in-progress' | 'pending';
  dueDate: string;
  ownerName: string;
  notes: string;
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

const plannerTabs: Array<{ id: PlannerTab; label: string; adminOnly?: boolean }> = [
  { id: 'squad', label: 'Dashboard' },
  { id: 'rsvp', label: 'RSVP' },
  { id: 'inspiration', label: 'Timeline' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'budget', label: 'Budget' },
  { id: 'milestones', label: 'Culture' },
  { id: 'marketplace', label: 'Coach' },
  { id: 'event-admin', label: 'Admin', adminOnly: true },
];

const plannerTabIcons: Record<PlannerTab, (props: IconProps) => JSX.Element> = {
  squad: HomeIcon,
  rsvp: UsersIcon,
  inspiration: CalendarIcon,
  suppliers: TeamIcon,
  budget: WalletIcon,
  milestones: SparkIcon,
  marketplace: ChatIcon,
  'event-admin': ShieldIcon,
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

const coachByEvent: Record<EventType, { name: string; company: string; role: string; score: string; events: number; image: string; cardLabel: string; responseTime: string; specialty: string }> = {
  wedding: { name: 'Lungi Dlodlo', company: 'VIP Hosting', role: 'Senior Wedding Coordinator', score: '4.9', events: 92, image: coachCoordinatorImage, cardLabel: 'Senior Coach', responseTime: '2 hours', specialty: 'Premium Gauteng Weddings' },
  lobola: { name: 'Nono Dube', company: 'Ubuntu Coordination', role: 'Tradition and Family Coordinator', score: '4.8', events: 94, image: coachPortraitImage, cardLabel: 'Culture Coach', responseTime: '3 hours', specialty: 'Lobola and Traditional Ceremonies' },
  funeral: { name: 'Sizwe K', company: 'Dignity Services', role: 'Family Support and Logistics Coach', score: '4.9', events: 156, image: coachCoordinatorImage, cardLabel: 'Care Coach', responseTime: '1 hour', specialty: 'Memorial and Funeral Services' },
  corporate: { name: 'Karabo M', company: 'Elite Events', role: 'Event Operations Lead', score: '4.7', events: 203, image: coachCoordinatorImage, cardLabel: 'Ops Coach', responseTime: '2 hours', specialty: 'Corporate and Summit Events' },
  birthday: { name: 'Tumi N', company: 'Vibe Co', role: 'Celebration Curator', score: '4.8', events: 88, image: coachPortraitImage, cardLabel: 'Vibe Coach', responseTime: '2 hours', specialty: 'Milestone Celebrations' },
};

const weatherByEvent: Record<EventType, { label: string; temperature: string; rainChance: number; alert: string }> = {
  wedding: { label: 'Partly Cloudy', temperature: '23°', rainChance: 65, alert: 'We recommend adding a tent supplier to protect the aisle and reception layout.' },
  lobola: { label: 'Clear Evening', temperature: '19°', rainChance: 10, alert: 'Weather is stable. Prioritise transport and family arrival sequencing instead.' },
  funeral: { label: 'Light Showers', temperature: '17°', rainChance: 55, alert: 'Add tenting and covered seating to reduce disruption for mourners.' },
  corporate: { label: 'Sunny', temperature: '25°', rainChance: 5, alert: 'No weather risk. AV and guest-flow coordination are the tighter constraints.' },
  birthday: { label: 'Warm Breeze', temperature: '27°', rainChance: 18, alert: 'Plan shade and drinks stations if the event is outdoors.' },
};

const plannerScheduleByEvent: Record<EventType, { eventDate: string; planningStartDate: string }> = {
  wedding: { eventDate: '2026-09-26', planningStartDate: '2025-12-01' },
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

const rsvpGroups: RsvpGroup[] = [
  { id: 'bride-family', label: "Bride's Family", invited: 180, confirmed: 96, pending: 72, declined: 12, risk: 'High' },
  { id: 'groom-family', label: "Groom's Family", invited: 160, confirmed: 118, pending: 30, declined: 12, risk: 'Medium' },
  { id: 'work-friends', label: 'Work Friends', invited: 60, confirmed: 42, pending: 10, declined: 8, risk: 'Low' },
  { id: 'church-community', label: 'Church / Community', invited: 100, confirmed: 62, pending: 30, declined: 8, risk: 'Medium' },
];

const rsvpGuestsDemo: RsvpGuest[] = [
  { id: 'g1', name: 'Sipho Dlamini', phone: '+27 82 123 4567', group: "Bride's Family", status: 'Confirmed', plusOnes: 1, lastContacted: '2026-05-20', notes: '' },
  { id: 'g2', name: 'Nomsa Khumalo', phone: '+27 72 234 5678', group: "Bride's Family", status: 'Pending', plusOnes: 2, lastContacted: '2026-05-15', notes: 'Travelling from Cape Town' },
  { id: 'g3', name: 'Thandi Mokoena', phone: '+27 83 345 6789', group: "Groom's Family", status: 'Confirmed', plusOnes: 0, lastContacted: '2026-05-22', notes: '' },
  { id: 'g4', name: 'Bongani Ndlovu', phone: '+27 71 456 7890', group: "Groom's Family", status: 'Verbal Confirmation', plusOnes: 1, lastContacted: '2026-05-18', notes: 'Confirmed verbally at church' },
  { id: 'g5', name: 'Lerato Sithole', phone: '+27 84 567 8901', group: 'Work Friends', status: 'Confirmed', plusOnes: 0, lastContacted: '2026-05-21', notes: '' },
  { id: 'g6', name: 'Karabo Molefe', phone: '+27 73 678 9012', group: 'Work Friends', status: 'Pending', plusOnes: 0, lastContacted: '2026-05-10', notes: '' },
  { id: 'g7', name: 'Zanele Nkosi', phone: '+27 82 789 0123', group: 'Church / Community', status: 'Confirmed', plusOnes: 3, lastContacted: '2026-05-19', notes: '' },
  { id: 'g8', name: 'Tshepo Mahlangu', phone: '+27 74 890 1234', group: "Bride's Family", status: 'No Response', plusOnes: 2, lastContacted: '2026-04-28', notes: 'Needs follow-up' },
  { id: 'g9', name: 'Ayanda Shabalala', phone: '+27 85 901 2345', group: "Groom's Family", status: 'Declined', plusOnes: 0, lastContacted: '2026-05-12', notes: 'Out of country' },
  { id: 'g10', name: 'Nandi Zwane', phone: '+27 76 012 3456', group: 'Church / Community', status: 'Maybe', plusOnes: 1, lastContacted: '2026-05-16', notes: 'Awaiting family confirmation' },
  { id: 'g11', name: 'Musa Cele', phone: '+27 83 123 4568', group: "Bride's Family", status: 'Pending', plusOnes: 0, lastContacted: '2026-05-08', notes: '' },
  { id: 'g12', name: 'Palesa Tau', phone: '+27 72 234 5679', group: "Groom's Family", status: 'Confirmed', plusOnes: 1, lastContacted: '2026-05-23', notes: '' },
];

const culturalMilestonesDemo: CulturalMilestone[] = [
  { id: 'cm1', title: 'Lobola Agreed', status: 'complete', dueDate: '2026-02-15', ownerName: 'Both Families', notes: 'Lobola negotiations concluded successfully.' },
  { id: 'cm2', title: 'Family Introduction Completed', status: 'complete', dueDate: '2026-03-01', ownerName: 'Both Families', notes: '' },
  { id: 'cm3', title: 'Delegation Meeting Completed', status: 'complete', dueDate: '2026-03-20', ownerName: 'Groom Family', notes: 'All elders attended.' },
  { id: 'cm4', title: 'Traditional Ceremony Date Confirmed', status: 'in-progress', dueDate: '2026-06-15', ownerName: 'Couple', notes: 'Date being finalised with both families.' },
  { id: 'cm5', title: 'Church Ceremony Confirmed', status: 'complete', dueDate: '2026-04-01', ownerName: 'Couple', notes: 'St Francis Church, Midrand.' },
  { id: 'cm6', title: 'Traditional Attire Confirmed', status: 'pending', dueDate: '2026-08-01', ownerName: 'Bride', notes: '' },
  { id: 'cm7', title: 'Family Gifts Confirmed', status: 'pending', dueDate: '2026-09-01', ownerName: 'Groom Family', notes: '' },
  { id: 'cm8', title: 'Elders / VIP List Confirmed', status: 'in-progress', dueDate: '2026-07-01', ownerName: 'Both Families', notes: '12 elders confirmed, 6 still pending.' },
];

const vendorBoard: Record<EventType, { core: VendorCardData[]; support: VendorCardData[] }> = {
  wedding: {
    core: [
      { id: 'planner', slot: 'Planner', subcategory: 'The Perfect Plan Co.', name: 'Wedding Planner', rating: 4.9, reviewCount: 128, priceLabel: 'R35,000', score: 92, status: 'secured', image: plannerImage },
      { id: 'venue', slot: 'Venue', subcategory: 'Premium Venue', name: 'Luxe Manor', rating: 4.8, reviewCount: 96, priceLabel: 'R85,000', score: 90, status: 'secured', image: venueImage },
      { id: 'photo', slot: 'Photography', subcategory: 'Photo and Video', name: 'Memories by TK', rating: 4.9, reviewCount: 201, priceLabel: 'R28,000', score: 89, status: 'at_risk', image: photographyImage },
      { id: 'catering', slot: 'Catering', subcategory: 'Luxury Catering', name: 'Taste Affair', rating: 4.7, reviewCount: 80, priceLabel: 'R65,000', score: 88, status: 'secured', image: cateringImage },
      { id: 'florals', slot: 'Florals', subcategory: 'Floral Designer', name: 'Bloom Room', rating: 4.9, reviewCount: 74, priceLabel: 'R22,000', score: 87, status: 'secured', image: floralsImage },
      { id: 'entertainment', slot: 'Entertainment', subcategory: 'DJ', name: 'Vibe Creators', rating: 4.8, reviewCount: 156, priceLabel: 'R15,000', score: 85, status: 'booked', image: entertainmentImage },
      { id: 'traditional', slot: 'Traditional Services', subcategory: 'Ubuntu Traditions', name: 'Ubuntu Traditions', rating: 4.8, reviewCount: 43, priceLabel: 'R14,000', score: 83, status: 'recommended', image: mcImage },
    ],
    support: [
      { id: 'mc', slot: 'MC', subcategory: 'Ceremony Host', name: 'Master of Ceremonies', rating: 4.8, reviewCount: 65, priceLabel: 'R6,000', score: 84, status: 'optional', image: mcImage },
      { id: 'hair', slot: 'Hair and Makeup', subcategory: 'Glam Squad', name: 'Glam Squad', rating: 4.7, reviewCount: 68, priceLabel: 'R9,000', score: 83, status: 'optional', image: glamImage },
      { id: 'transport', slot: 'Transport', subcategory: 'VIP Transport', name: 'VIP Transport', rating: 4.8, reviewCount: 40, priceLabel: 'R12,000', score: 82, status: 'optional', image: transportImage },
      { id: 'decor', slot: 'Decor', subcategory: 'Decor Elegance', name: 'Decor Elegance', rating: 4.6, reviewCount: 47, priceLabel: 'R18,000', score: 80, status: 'optional', image: decorImage },
      { id: 'tent', slot: 'Tent Supplier', subcategory: 'Weather Backup', name: 'Tent Supplier', rating: 4.8, reviewCount: 54, priceLabel: 'R18,500', score: 79, status: 'recommended', image: tentImage },
      { id: 'security', slot: 'Security', subcategory: 'Event Security', name: 'Shield Guard', rating: 4.6, reviewCount: 38, priceLabel: 'R8,000', score: 77, status: 'optional', image: transportImage },
      { id: 'drone', slot: 'Drone Photography', subcategory: 'Aerial Coverage', name: 'Sky Lens ZA', rating: 4.9, reviewCount: 62, priceLabel: 'R7,500', score: 88, status: 'optional', image: photographyImage },
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
  if (status === 'shortlisted') return 'On your shortlist';
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

function getSupplierScopeDetails(slot: string): { included: string[]; excluded: string[] } {
  const s = slot.toLowerCase();
  if (s.includes('venue')) return {
    included: ['Venue hire', 'Tables and chairs', 'Basic lighting', 'Security staff', 'Bridal suite access'],
    excluded: ['Catering', 'DJ or entertainment', 'Flowers and decor', 'Additional lighting', 'Accommodation'],
  };
  if (s.includes('catering')) return {
    included: ['Buffet setup and service', 'Waitstaff', 'Crockery and cutlery', 'Cake table setup'],
    excluded: ['Wedding cake', 'Bar and beverages', 'Linen and decor', 'Grazing tables'],
  };
  if (s.includes('photo')) return {
    included: ['Full-day coverage (ceremony + reception)', 'Edited digital gallery', '2 photographers', 'Online delivery within 6 weeks'],
    excluded: ['Printed albums', 'Same-day edits', 'Drone footage', 'Engagement shoot'],
  };
  if (s.includes('entertainment') || s.includes('dj')) return {
    included: ['DJ equipment and setup', 'MC duties', 'Music planning session', 'Lighting rig'],
    excluded: ['Live band', 'Additional sound system', 'Ceremony music', 'Photobooth'],
  };
  if (s.includes('decor') || s.includes('floral')) return {
    included: ['Centrepieces', 'Ceremony arch', 'Bridal table decor', 'Setup and breakdown'],
    excluded: ['Venue draping', 'Hanging installations', 'Candles', 'Chair covers'],
  };
  if (s.includes('tent')) return {
    included: ['Marquee structure', 'Flooring', 'Side walls and entrance', 'Setup and breakdown'],
    excluded: ['Lighting', 'Furniture inside marquee', 'Generator power', 'Climate control'],
  };
  return {
    included: ['Core service as described', 'Basic setup and logistics'],
    excluded: ['Custom add-ons', 'Extended hours', 'Additional locations'],
  };
}

function getSupplierOptionalExtras(slot: string): Array<{ label: string; price: string }> {
  const s = slot.toLowerCase();
  if (s.includes('venue')) return [
    { label: 'In-house catering package', price: 'R65,000' },
    { label: 'In-house DJ', price: 'R15,000' },
    { label: 'Decor package', price: 'R25,000' },
  ];
  if (s.includes('catering')) return [
    { label: 'Open bar service', price: 'R22,000' },
    { label: 'Grazing table', price: 'R8,500' },
    { label: 'Late-night snack station', price: 'R6,000' },
  ];
  if (s.includes('photo')) return [
    { label: 'Printed album (30 pages)', price: 'R6,500' },
    { label: 'Engagement shoot', price: 'R4,500' },
    { label: 'Same-day highlight reel', price: 'R8,000' },
  ];
  if (s.includes('decor') || s.includes('floral')) return [
    { label: 'Floral arch upgrade', price: 'R8,500' },
    { label: 'Full venue draping', price: 'R18,000' },
    { label: 'Candle package', price: 'R4,200' },
  ];
  if (s.includes('entertainment') || s.includes('dj')) return [
    { label: 'Live saxophonist', price: 'R5,500' },
    { label: 'Photobooth with prints', price: 'R7,000' },
    { label: 'Extra sound system', price: 'R4,000' },
  ];
  return [];
}

function getSupplierCoachNote(slot: string): string | null {
  const s = slot.toLowerCase();
  if (s.includes('venue')) return 'Using the venue\'s in-house catering may reduce coordination risk and save approximately R8,500 on external logistics.';
  if (s.includes('catering')) return 'Confirm final headcount no later than 7 days before the event to avoid overage charges.';
  if (s.includes('photo')) return 'Deposit is currently unpaid — this is flagged as a risk. Confirm within 7 days to protect the booking.';
  if (s.includes('decor') || s.includes('floral')) return 'The floral arch extra (R8,500) has not been approved yet. Review this line item before the next budget checkpoint.';
  if (s.includes('tent')) return 'Weather forecast shows 65% rain chance. This supplier should be confirmed before any other optional spend is approved.';
  return null;
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
  const [authStep, setAuthStep] = useState<'landing' | 'identify' | 'verify'>('landing');
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
  const [rsvpGuests, setRsvpGuests] = useState<RsvpGuest[]>(rsvpGuestsDemo);
  const [milestones, setMilestones] = useState<CulturalMilestone[]>(culturalMilestonesDemo);
  const [rsvpReminderGuestId, setRsvpReminderGuestId] = useState<string | null>(null);
  const [rsvpFilter, setRsvpFilter] = useState<string>('all');
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [adminCoachNote, setAdminCoachNote] = useState('Venue walkthrough recommended next week. RSVP follow-up required for Bride\'s Family group. Decor quote has unapproved extras — review before approving payment.');
  const [adminAlerts, setAdminAlerts] = useState([
    { id: 'a1', severity: 'High', message: 'RSVP confidence is low — 142 guests still pending.', action: 'Start follow-ups this week.' },
    { id: 'a2', severity: 'Medium', message: 'Decor quote has R18,500 in unapproved extras.', action: 'Review before approving payment.' },
    { id: 'a3', severity: 'Medium', message: 'Photographer deposit not confirmed.', action: 'Confirm within 7 days.' },
    { id: 'a4', severity: 'Low', message: 'Weather backup (tent supplier) not confirmed.', action: 'Add tent supplier to squad.' },
  ]);
  const [adminNewAlert, setAdminNewAlert] = useState({ severity: 'Medium', message: '', action: '' });

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
  // RSVP computed values
  const rsvpTotalInvited = rsvpGroups.reduce((s, g) => s + g.invited, 0);
  const rsvpTotalConfirmed = rsvpGroups.reduce((s, g) => s + g.confirmed, 0);
  const rsvpTotalPending = rsvpGroups.reduce((s, g) => s + g.pending, 0);
  const rsvpTotalDeclined = rsvpGroups.reduce((s, g) => s + g.declined, 0);
  const rsvpConfidence = Math.round((rsvpTotalConfirmed / rsvpTotalInvited) * 100);

  // Cultural milestones computed values
  const completedMilestonesCount = milestones.filter((m) => m.status === 'complete').length;
  const totalMilestonesCount = milestones.length;

  const weatherStatus = selectedWeather.rainChance <= 20 ? 'Safe' : selectedWeather.rainChance <= 45 ? 'Watch' : 'Risk';

  // 7-factor weighted readiness engine (per brief)
  const supplierReadinessScore = Math.round((Math.min(vendorCoverageCount, 5) / 5) * 25);
  const rsvpReadinessScore = rsvpConfidence >= 80 ? 20 : rsvpConfidence >= 65 ? 14 : rsvpConfidence >= 50 ? 10 : 5;
  const budgetReadinessScore = budgetProgress <= 90 ? 15 : budgetProgress <= 100 ? 10 : 5;
  const timelineTasksScore = Math.round((completedTaskCount / totalTaskCount) * 15);
  const paymentsReadinessScore = budgetLines.length > 0
    ? Math.round((settledBudgetLines / budgetLines.length) * 10)
    : budgetProgress <= 70 ? 10 : budgetProgress <= 90 ? 7 : 4;
  const weatherReadinessScore = weatherStatus === 'Safe' ? 5 : weatherStatus === 'Watch' ? 3 : 1;
  const milestoneReadinessScore = Math.round((completedMilestonesCount / Math.max(totalMilestonesCount, 1)) * 5);
  const coachReadinessScore = messageThreads.length > 0 ? 5 : 2;
  const readinessScore = clampNumber(
    supplierReadinessScore + rsvpReadinessScore + budgetReadinessScore + timelineTasksScore +
    paymentsReadinessScore + weatherReadinessScore + milestoneReadinessScore + coachReadinessScore,
    0,
    100,
  );
  const readinessDrivers = [
    { label: 'Supplier readiness', score: supplierReadinessScore, max: 25 },
    { label: 'RSVP confidence', score: rsvpReadinessScore, max: 20 },
    { label: 'Budget health', score: budgetReadinessScore, max: 15 },
    { label: 'Timeline tasks', score: timelineTasksScore, max: 15 },
    { label: 'Payments & deposits', score: paymentsReadinessScore, max: 10 },
    { label: 'Weather & logistics', score: weatherReadinessScore, max: 5 },
    { label: 'Cultural milestones', score: milestoneReadinessScore, max: 5 },
    { label: 'Coach coordination', score: coachReadinessScore, max: 5 },
  ].sort((a, b) => (b.max - b.score) - (a.max - a.score));
  const readinessTone = readinessScore >= 85 ? 'healthy' : readinessScore >= 70 ? 'watch' : 'risk';
  const readinessLabel = readinessTone === 'healthy' ? 'On Track' : readinessTone === 'watch' ? 'Watch' : 'Risk';
  const savingsIdentified = 12700;
  const coachQuickActions = [
    { label: 'Call', href: 'tel:+27821234567', Icon: PhoneIcon },
    { label: 'WhatsApp', href: 'https://wa.me/27821234567', Icon: WhatsAppIcon },
    { label: 'Message', action: () => openMessageThread(), Icon: MessageSquareIcon },
    { label: 'Schedule Meeting', action: () => setCoachScheduleOpen(true), Icon: CalendarIcon },
  ];
  const coachNote = adminCoachNote;
  const tentVendor = findVendorByMatch(/tent/i);
  const coachRecommendations = [
    rsvpConfidence < 75 ? `Follow up with ${rsvpTotalPending} pending guests — especially Bride's Family group (72 still unconfirmed).` : null,
    photographyVendor?.status === 'at_risk' ? 'Pay the photographer deposit this week to secure Memories by TK before the booking expires.' : null,
    selectedWeather.rainChance > 45 && !tentVendor ? 'Add a tent supplier to the squad before final payment approvals. Rain chance is elevated.' : null,
    'Schedule a venue walkthrough before the month end to lock the floorplan and seating layout.',
    'Review and approve or reject the R18,500 in unapproved decor extras before they delay supplier confirmation.',
  ].filter(Boolean).slice(0, 3) as string[];
  const photographyAtRisk = photographyVendor?.status === 'at_risk';
  const riskAlerts = [
    // Risk 1: RSVP confidence low
    rsvpConfidence < 75 ? { title: `RSVP confidence is low — ${rsvpTotalPending} guests still pending`, impact: 'High', action: 'Start follow-ups this week to protect catering and seating.' } : null,
    // Risk 2: Decor extras awaiting approval (unapproved R18,500 in extras)
    { title: 'Decor quote has R18,500 in unapproved extras', impact: 'Medium', action: 'Review before approving payment.' },
    // Risk 3: Photographer deposit not confirmed
    photographyAtRisk || !photographyVendor ? { title: 'Photographer deposit not confirmed', impact: 'High', action: 'Confirm deposit with Memories by TK within 7 days.' } : null,
    // Risk 4: Weather backup not confirmed
    shouldShowWeatherAlert && !tentVendor ? { title: 'Weather backup (tent supplier) not confirmed', impact: 'Medium', action: 'Rain chance is elevated. Add a tent supplier to the squad.' } : null,
    // Fallback: budget climbing
    budgetProgress > 92 ? { title: 'Budget usage is above 92%', impact: 'Medium', action: 'Review decor and add-on spend this week.' } : null,
  ].filter(Boolean) as Array<{ title: string; impact: string; action: string }>;
  const timelineItems = [
    // Phase: Discovery
    { phase: 'Discovery', label: 'Wedding Vision Defined', status: 'done', criticality: 'High', dependency: null },
    { phase: 'Discovery', label: 'Guest Count Estimated', status: 'done', criticality: 'High', dependency: null },
    { phase: 'Discovery', label: 'Budget Range Set', status: 'done', criticality: 'Critical', dependency: null },
    // Phase: Planning
    { phase: 'Planning', label: 'Coach Assigned', status: 'done', criticality: 'High', dependency: null },
    { phase: 'Planning', label: 'Venue Shortlist Created', status: 'done', criticality: 'High', dependency: null },
    { phase: 'Planning', label: 'Event Date Locked', status: 'done', criticality: 'Critical', dependency: null },
    // Phase: Supplier Booking
    { phase: 'Supplier Booking', label: 'Venue Confirmed', status: venueVendor && venueVendor.status === 'secured' ? 'done' : venueVendor ? 'active' : 'upcoming', criticality: 'Critical', dependency: null },
    { phase: 'Supplier Booking', label: 'Catering Booked', status: cateringVendor && cateringVendor.status === 'secured' ? 'done' : cateringVendor ? 'active' : 'upcoming', criticality: 'Critical', dependency: venueVendor ? null : 'Venue must be confirmed before catering headcount can be finalised.' },
    { phase: 'Supplier Booking', label: 'Photographer Deposit Paid', status: photographyVendor && photographyVendor.status !== 'at_risk' ? 'done' : 'overdue', criticality: 'High', dependency: null },
    { phase: 'Supplier Booking', label: 'Decor Supplier Selected', status: decorVendor ? 'done' : venueVendor ? 'active' : 'upcoming', criticality: 'High', dependency: venueVendor ? null : 'Cannot finalise decor until venue floorplan is locked.' },
    { phase: 'Supplier Booking', label: 'Entertainment Confirmed', status: entertainmentVendor && (entertainmentVendor.status === 'secured' || entertainmentVendor.status === 'booked') ? 'done' : 'active', criticality: 'Medium', dependency: null },
    // Phase: Cultural Milestones
    { phase: 'Cultural Milestones', label: 'Traditional Ceremony Date Set', status: milestones.find((m) => m.title.includes('Traditional Ceremony'))?.status === 'complete' ? 'done' : 'active', criticality: 'High', dependency: null },
    { phase: 'Cultural Milestones', label: 'Traditional Attire Confirmed', status: milestones.find((m) => m.title.includes('Attire'))?.status === 'complete' ? 'done' : 'upcoming', criticality: 'Medium', dependency: null },
    // Phase: Finalisation
    { phase: 'Finalisation', label: 'Finalise Catering Count', status: rsvpConfidence >= 80 ? 'active' : 'blocked', criticality: 'High', dependency: rsvpConfidence < 80 ? `Blocked: RSVP confidence is ${rsvpConfidence}% — needs 80% before catering count can be finalised.` : null },
    { phase: 'Finalisation', label: 'Seating Plan Complete', status: rsvpConfidence >= 80 && venueVendor ? 'active' : 'blocked', criticality: 'High', dependency: rsvpConfidence < 80 ? 'Blocked: Cannot complete seating plan until RSVP confidence reaches 80%.' : !venueVendor ? 'Venue must be selected first.' : null },
    { phase: 'Finalisation', label: 'Invitations Sent', status: completedTaskCount >= 22 ? 'done' : completedTaskCount >= 12 ? 'active' : 'upcoming', criticality: 'High', dependency: venueVendor ? null : 'Cannot send invitations until venue address and date are locked.' },
    // Phase: Wedding Week
    { phase: 'Wedding Week', label: 'Supplier Briefing Done', status: completedTaskCount >= 40 ? 'done' : 'upcoming', criticality: 'Critical', dependency: null },
    { phase: 'Wedding Week', label: 'Final Payments Settled', status: completedTaskCount >= 45 ? 'done' : 'upcoming', criticality: 'Critical', dependency: null },
    { phase: 'Wedding Week', label: 'Weather Contingency Ready', status: tentVendor ? 'done' : selectedWeather.rainChance > 45 ? 'overdue' : 'upcoming', criticality: selectedWeather.rainChance > 45 ? 'High' : 'Medium', dependency: selectedWeather.rainChance > 45 && !tentVendor ? 'Rain chance is elevated. Tent supplier not yet confirmed.' : null },
    // Phase: Wedding Day
    { phase: 'Wedding Day', label: 'Ceremony Run Sheet Ready', status: completedTaskCount >= 48 ? 'done' : 'upcoming', criticality: 'Critical', dependency: null },
    { phase: 'Wedding Day', label: 'Coach On-Site Confirmed', status: completedTaskCount >= 48 ? 'done' : 'upcoming', criticality: 'Critical', dependency: null },
    // Phase: Post-Event
    { phase: 'Post-Event', label: 'Supplier Feedback Submitted', status: 'upcoming', criticality: 'Low', dependency: null },
    { phase: 'Post-Event', label: 'Final Invoice Reconciliation', status: 'upcoming', criticality: 'Medium', dependency: null },
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
    setActiveTab('squad');
    setAuthStep('landing');
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
    setSurfaceMode('planner');
    setActiveTab('squad');
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
    // Landing hero screen
    if (authStep === 'landing') {
      return (
        <main className="stitchdShell landingShell">
          <div className="pageGlow pageGlowLeft" />
          <div className="pageGlow pageGlowRight" />
          <div className="landingBg" style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.72) 100%), url(${venueImage})` }} />
          <section className="landingContent">
            <div className="landingBrand">
              <StitchdWordmark variant="landing" />
              <p className="landingTagline">Your wedding, fully coordinated.</p>
            </div>
            <div className="landingHero">
              <h1 className="landingHeadline">A premium wedding command centre.</h1>
              <p className="landingSubtext">Track your suppliers, budget, RSVP confidence, cultural milestones, and wedding readiness from one place. Built for South African weddings.</p>
            </div>
            <div className="landingCtas">
              <button type="button" className="landingPrimaryBtn" onClick={() => {
                setMockSession({ role: 'client', identity: 'demo@stitchd.co.za', contact: 'demo@stitchd.co.za' });
                localStorage.setItem('stitchd.mock.session', JSON.stringify({ role: 'client', identity: 'demo@stitchd.co.za', contact: 'demo@stitchd.co.za' }));
              }}>
                View Demo Wedding
              </button>
              <button type="button" className="landingSecondaryBtn" onClick={() => setAuthStep('identify')}>
                Sign In
              </button>
            </div>
            <p className="landingDisclaimer">Thabo &amp; Lelo Wedding • Midrand, Gauteng • 26 September 2026</p>
          </section>
        </main>
      );
    }

    return (
      <main className="stitchdShell authShell">
        <div className="pageGlow pageGlowLeft" />
        <div className="pageGlow pageGlowRight" />
        <section className="authGate authGateCompact glassPanel">
          {authStep === 'identify' ? (
            <form className="authEntryCard authEntryCardCompact glassPanelNested" onSubmit={requestMockOtp}>
              <div className="authBrandLockup">
                <StitchdWordmark variant="auth" />
                <span className="minorLabel">{authRoleConfig[authRole].label} access</span>
              </div>
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
              <div className="authActionsRow">
                <button type="button" className="secondaryButton" onClick={() => setAuthStep('landing')}>Back</button>
                <button type="submit" className="primaryButton">Continue</button>
              </div>
            </form>
          ) : (
            <form className="authEntryCard authEntryCardCompact glassPanelNested" onSubmit={completeMockSignIn}>
              <div className="authBrandLockup">
                <StitchdWordmark variant="auth" />
                <span className="minorLabel">Verify your number</span>
              </div>
              <p className="authVerifyHint">{authNotice || `A code was sent to ${authIdentifier}.`}</p>
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
                <StitchdWordmark variant="header" />
                <button type="button" className="headerMenuButton" aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((current) => !current)}>
                  {mobileNavOpen ? <CloseIcon className="plannerIcon" /> : <MenuIcon className="plannerIcon" />}
                </button>
              </div>
              <p>{selectedEventOption.label}</p>
            </div>

            <nav className={`plannerNav ${mobileNavOpen ? 'is-open' : ''}`} aria-label="Primary planner tabs">
              {plannerTabs.filter((tab) => !tab.adminOnly || mockSession?.role === 'admin').map((tab) => (
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
                  {/* Top hero strip — brief requirement */}
                  <div className="dashboardHeroStrip glassPanelNested">
                    <div className="heroStripLeft">
                      <div className="heroStripCouple">Thabo &amp; Lelo Wedding</div>
                      <div className="heroStripMeta">
                        <span>26 September 2026</span>
                        <span className="heroStripDot">·</span>
                        <span>{locationLabel}</span>
                        <span className="heroStripDot">·</span>
                        <span>{rsvpTotalInvited} invited guests</span>
                      </div>
                    </div>
                    <div className="heroStripRight">
                      <span className="heroStripDays">{daysToEvent}</span>
                      <span className="heroStripDaysLabel">days to go</span>
                    </div>
                  </div>
                  <div className="kpiGrid">
                    <article className="kpiMetricCard glassPanelNested kpiClickable" onClick={() => handlePlannerTabChange('budget')}>
                      <span className="minorLabel">Budget Pulse</span>
                      <strong>{formatCurrencyFromRands(budgetUsed)}</strong>
                      <p className="kpiSub">{formatCurrencyFromRands(plannerSurface?.budget.total || totalBudget)} total • {formatCurrencyFromRands(budgetRemaining)} left</p>
                    </article>
                    <article className={`kpiMetricCard glassPanelNested kpiClickable ${rsvpConfidence < 75 ? 'kpiAtRisk' : rsvpConfidence >= 80 ? 'kpiHealthy' : 'kpiWatch'}`} onClick={() => handlePlannerTabChange('rsvp')}>
                      <span className="minorLabel">RSVP Confidence</span>
                      <strong>{rsvpConfidence}%</strong>
                      <p className="kpiSub">{rsvpTotalConfirmed} / {rsvpTotalInvited} confirmed</p>
                    </article>
                    <article className="kpiMetricCard glassPanelNested kpiClickable" onClick={() => handlePlannerTabChange('inspiration')}>
                      <span className="minorLabel">Tasks Complete</span>
                      <strong>{completedTaskCount}/{totalTaskCount}</strong>
                      <p className="kpiSub">{riskAlerts.filter((a) => a.impact === 'High').length > 0 ? `${riskAlerts.filter((a) => a.impact === 'High').length} overdue` : 'On track'}</p>
                    </article>
                    <article className={`kpiMetricCard glassPanelNested ${riskAlerts.length > 0 ? 'kpiAtRisk' : 'kpiHealthy'}`}>
                      <span className="minorLabel">Open Risks</span>
                      <strong>{riskAlerts.length}</strong>
                      <p className="kpiSub">{riskAlerts.filter((a) => a.impact === 'High').length} high priority</p>
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
                    {riskAlerts.slice(0, 3).map((alert) => (
                      <article key={alert.title} className="riskAlertCard glassPanelNested">
                        <div>
                          <span className={`riskSeverityDot ${alert.impact === 'High' ? 'dot-high' : 'dot-medium'}`} />
                          <span className="minorLabel">Risk · {alert.impact}</span>
                          <strong>{alert.title}</strong>
                        </div>
                        <div className="splitMeta"><span>{alert.action}</span></div>
                      </article>
                    ))}
                  </div>

                  {/* Coach Recommendations — brief requirement */}
                  <article className="coachRecommendationsCard glassPanelNested">
                    <div className="coachRecHeader">
                      <div className="coachRecAvatar" style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.05), rgba(0,0,0,0.4)), url(${coachByEvent.wedding.image})` }} />
                      <div>
                        <span className="minorLabel">Coach Recommendations</span>
                        <strong>{coachByEvent.wedding.name}</strong>
                        <span className="coachCompanyTag">{coachByEvent.wedding.company}</span>
                      </div>
                    </div>
                    <ol className="coachRecList">
                      {coachRecommendations.map((rec, i) => (
                        <li key={i} className="coachRecItem">
                          <span className="coachRecNum">{i + 1}</span>
                          <p>{rec}</p>
                        </li>
                      ))}
                    </ol>
                    <button type="button" className="ghostButton" onClick={() => handlePlannerTabChange('marketplace')}>Open Coach Screen</button>
                  </article>

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
                    <div className="budgetSummaryRow"><span>Total Budget</span><strong>{formatCurrencyFromRands(plannerSurface?.budget.total || totalBudget)}</strong></div>
                    <div className="budgetSummaryRow"><span>Approved Spend</span><strong>{formatCurrencyFromRands(budgetUsed)}</strong></div>
                    <div className="budgetSummaryRow"><span>Paid</span><strong>{formatCurrencyFromRands(Math.round(budgetUsed * 0.5625))}</strong></div>
                    <div className="budgetSummaryRow"><span>Outstanding</span><strong>{formatCurrencyFromRands(Math.round(budgetUsed * 0.4375))}</strong></div>
                    <div className="budgetSummaryRow budgetExtrasRow"><span>Unapproved Extras</span><strong className="is-amber">{formatCurrencyFromRands(18500)}</strong></div>
                    <div className="budgetSummaryRow"><span>Estimated Savings Found</span><strong className="is-green">{formatCurrencyFromRands(savingsIdentified)}</strong></div>
                    <div className="progressTrack budgetProgressTrack"><span className={budgetProgress > 95 ? 'is-over' : ''} style={{ width: `${budgetProgress}%` }} /></div>
                    <div className="budgetHealthBadge">
                      <span className="budgetHealthTag health-review">
                        Needs Review — Unapproved Extras
                      </span>
                    </div>
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

                  {/* Unapproved extras panel — per brief */}
                  <article className="budgetExtrasPanel glassPanelNested fullWidthPanel">
                    <div className="budgetExtrasHeader">
                      <div>
                        <span className="minorLabel">Unapproved Extras</span>
                        <strong>Items awaiting your approval before they enter the budget</strong>
                      </div>
                      <span className="budgetExtrasTotal is-amber">{formatCurrencyFromRands(18500)} pending</span>
                    </div>
                    {[
                      { id: 'ex1', label: 'Additional floral arch', supplier: 'Bloom Room', amount: 8500, status: 'Awaiting Approval' },
                      { id: 'ex2', label: 'Extended DJ set (2 extra hours)', supplier: 'Vibe Creators', amount: 5000, status: 'Awaiting Approval' },
                      { id: 'ex3', label: 'Upgraded chair covers', supplier: 'Decor Elegance', amount: 5000, status: 'Awaiting Approval' },
                    ].map((extra) => (
                      <div key={extra.id} className="budgetExtraRow">
                        <div className="budgetExtraInfo">
                          <strong>{extra.label}</strong>
                          <span className="budgetExtraSupplier">{extra.supplier}</span>
                        </div>
                        <div className="budgetExtraMeta">
                          <strong className="is-amber">{formatCurrencyFromRands(extra.amount)}</strong>
                          <span className="budgetExtraStatus">{extra.status}</span>
                        </div>
                        <div className="budgetExtraActions">
                          <button type="button" className="budgetExtraBtn is-approve" onClick={() => setPlannerToast(`${extra.label} approved and added to budget.`)}>Approve</button>
                          <button type="button" className="budgetExtraBtn is-reject" onClick={() => setPlannerToast(`${extra.label} rejected and removed.`)}>Reject</button>
                          <button type="button" className="budgetExtraBtn is-coach" onClick={() => handlePlannerTabChange('marketplace')}>Ask Coach</button>
                        </div>
                      </div>
                    ))}
                  </article>
                </div>
              ) : null}

              {activeTab === 'inspiration' ? (
                <div className="journeyPanel">
                  {(() => {
                    const phases = [...new Set(timelineItems.map((i) => i.phase))];
                    return phases.map((phase) => {
                      const items = timelineItems.filter((i) => i.phase === phase);
                      return (
                        <div key={phase} className="timelinePhase">
                          <div className="timelinePhaseHeader">
                            <span className="minorLabel">Phase</span>
                            <strong>{phase}</strong>
                          </div>
                          {items.map((item, index) => (
                            <article key={item.label} className={`journeyStep glassPanelNested ${item.status === 'done' ? 'is-done' : item.status === 'active' ? 'is-active' : item.status === 'blocked' ? 'is-blocked' : item.status === 'overdue' ? 'is-overdue' : ''}`}>
                              <div className="journeyStepMarker">
                                <span className="journeyStepIcon">
                                  {item.status === 'done' ? '✓' : item.status === 'active' ? '⚡' : item.status === 'blocked' ? '⛔' : item.status === 'overdue' ? '⚠' : '○'}
                                </span>
                                {index < items.length - 1 ? <div className="journeyConnector" /> : null}
                              </div>
                              <div className="journeyStepBody">
                                <div className="journeyStepHeader">
                                  <strong>{item.label}</strong>
                                  <span className={`criticalityBadge criticality-${item.criticality.toLowerCase()}`}>{item.criticality}</span>
                                </div>
                                {item.dependency
                                  ? <p className="journeyBlockReason">{item.dependency}</p>
                                  : <p>{item.status === 'done' ? 'Completed and synced into your wedding plan.' : item.status === 'overdue' ? 'This task is overdue and affecting readiness.' : 'Next action is open.'}</p>}
                              </div>
                            </article>
                          ))}
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : null}

              {activeTab === 'rsvp' ? (
                <div className="rsvpScreen">
                  {/* Hero confidence score */}
                  <div className="rsvpHero glassPanelNested">
                    <div className="rsvpHeroLeft">
                      <span className="minorLabel">RSVP Confidence</span>
                      <div className={`rsvpConfidenceScore ${rsvpConfidence >= 80 ? 'is-healthy' : rsvpConfidence >= 65 ? 'is-watch' : 'is-risk'}`}>
                        <strong>{rsvpConfidence}%</strong>
                        <span>{rsvpConfidence >= 80 ? 'Healthy' : rsvpConfidence >= 65 ? 'Needs Attention' : 'At Risk'}</span>
                      </div>
                      <div className="rsvpHeroStats">
                        <span className="rsvpStatPill is-confirmed">{rsvpTotalConfirmed} Confirmed</span>
                        <span className="rsvpStatPill is-pending">{rsvpTotalPending} Pending</span>
                        <span className="rsvpStatPill is-declined">{rsvpTotalDeclined} Declined</span>
                        <span className="rsvpStatPill">{rsvpTotalInvited} Invited</span>
                      </div>
                    </div>
                    <div className="rsvpHeroProgress">
                      <div className="rsvpProgressBar">
                        <div className="rsvpProgressFill" style={{ width: `${rsvpConfidence}%`, background: rsvpConfidence >= 80 ? '#2ECC71' : rsvpConfidence >= 65 ? '#FFB81C' : '#D9534F' }} />
                      </div>
                      <p className="rsvpProgressLabel">Target: 80% for a confirmed catering and seating plan</p>
                    </div>
                  </div>

                  {/* RSVP risk alert */}
                  {rsvpConfidence < 75 ? (
                    <article className="rsvpRiskAlert glassPanelNested">
                      <span className="minorLabel">RSVP Risk</span>
                      <strong>Your RSVP confidence is low</strong>
                      <p>Catering and seating may be inaccurate unless follow-ups start this week. {rsvpTotalPending} guests are still pending confirmation.</p>
                    </article>
                  ) : null}

                  {/* Group breakdown */}
                  <div className="sectionHeadingRow">
                    <div><span className="minorLabel">Guest Groups</span><h2>Breakdown by family and group</h2></div>
                  </div>
                  <div className="rsvpGroupGrid">
                    {rsvpGroups.map((group) => {
                      const groupConfidence = Math.round((group.confirmed / group.invited) * 100);
                      return (
                        <article key={group.id} className={`rsvpGroupCard glassPanelNested ${group.risk === 'High' ? 'is-high-risk' : group.risk === 'Medium' ? 'is-medium-risk' : 'is-low-risk'}`}>
                          <div className="rsvpGroupHeader">
                            <strong>{group.label}</strong>
                            <span className={`rsvpRiskBadge risk-${group.risk.toLowerCase()}`}>{group.risk} Risk</span>
                          </div>
                          <div className="rsvpGroupStats">
                            <div className="rsvpGroupStat"><span className="minorLabel">Invited</span><strong>{group.invited}</strong></div>
                            <div className="rsvpGroupStat"><span className="minorLabel">Confirmed</span><strong className="text-healthy">{group.confirmed}</strong></div>
                            <div className="rsvpGroupStat"><span className="minorLabel">Pending</span><strong className="text-warning">{group.pending}</strong></div>
                            <div className="rsvpGroupStat"><span className="minorLabel">Declined</span><strong>{group.declined}</strong></div>
                          </div>
                          <div className="rsvpGroupBar">
                            <div className="rsvpGroupBarFill" style={{ width: `${groupConfidence}%`, background: group.risk === 'High' ? '#D9534F' : group.risk === 'Medium' ? '#FFB81C' : '#2ECC71' }} />
                          </div>
                          <p className="rsvpGroupConfidence">{groupConfidence}% confirmed</p>
                        </article>
                      );
                    })}
                  </div>

                  {/* Guest list */}
                  <div className="sectionHeadingRow">
                    <div><span className="minorLabel">Guest List</span><h2>Individual tracking</h2></div>
                    <div className="rsvpGuestActions">
                      <button type="button" className="primaryButton rsvpActionBtn" onClick={() => {
                        const newGuest: RsvpGuest = { id: `g-${Date.now()}`, name: 'New Guest', phone: '', group: "Bride's Family", status: 'Pending', plusOnes: 0, lastContacted: '', notes: '' };
                        setRsvpGuests((prev) => [...prev, newGuest]);
                        setPlannerToast('New guest added. Update their details below.');
                      }}>+ Add Guest</button>
                      <button type="button" className="ghostButton rsvpActionBtn" onClick={() => setPlannerToast('CSV import coming soon. Export your guest list from WhatsApp or Excel and paste here.')}>Import CSV</button>
                    </div>
                    <div className="rsvpFilterRow">
                      {(['all', 'Confirmed', 'Pending', 'No Response', 'Declined', 'Maybe'] as const).map((f) => (
                        <button key={f} type="button" className={`filterChip ${rsvpFilter === f ? 'is-active' : ''}`} onClick={() => setRsvpFilter(f)}>{f === 'all' ? 'All' : f}</button>
                      ))}
                    </div>
                  </div>
                  <div className="rsvpGuestList glassPanelNested">
                    {rsvpGuests.filter((g) => rsvpFilter === 'all' || g.status === rsvpFilter).map((guest) => (
                      <div key={guest.id} className="rsvpGuestRow">
                        <div className="rsvpGuestInfo">
                          <strong>{guest.name}</strong>
                          <span className="rsvpGuestGroup">{guest.group}</span>
                          {guest.plusOnes > 0 ? <span className="rsvpGuestPlus">+{guest.plusOnes}</span> : null}
                        </div>
                        <div className="rsvpGuestMeta">
                          <span className={`rsvpStatusBadge status-${guest.status.toLowerCase().replace(/\s+/g, '-')}`}>{guest.status}</span>
                          <span className="rsvpGuestPhone">{guest.phone}</span>
                        </div>
                        <div className="rsvpGuestActions">
                          <button type="button" className="ghostButton" onClick={() => {
                            setRsvpGuests((prev) => prev.map((g) => g.id === guest.id ? { ...g, status: 'Confirmed' } : g));
                          }}>Confirm</button>
                          <button type="button" className="ghostButton" onClick={() => setRsvpReminderGuestId(guest.id)}>Reminder</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* WhatsApp reminder modal */}
              {rsvpReminderGuestId ? (() => {
                const guest = rsvpGuests.find((g) => g.id === rsvpReminderGuestId);
                if (!guest) return null;
                const reminderText = `Hi ${guest.name.split(' ')[0]}, Thabo &amp; Lelo Wedding • Midrand, Gauteng • 26 September 2026. Please reply YES or NO. Thank you.`;
                return (
                  <div className="overlayShell" role="dialog" aria-modal="true">
                    <div className="overlayPanel glassPanel">
                      <div className="overlayHeader">
                        <div><span className="minorLabel">WhatsApp Reminder</span><strong>{guest.name}</strong></div>
                        <button type="button" className="ghostButton" onClick={() => setRsvpReminderGuestId(null)}>Close</button>
                      </div>
                      <p className="reminderText">{reminderText}</p>
                      <div className="reminderActions">
                        <button type="button" className="primaryButton" onClick={() => { navigator.clipboard.writeText(reminderText); setPlannerToast('Reminder text copied to clipboard'); setRsvpReminderGuestId(null); }}>Copy Text</button>
                        <a className="primaryButton whatsappButton" href={`https://wa.me/${guest.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(reminderText)}`} target="_blank" rel="noreferrer">Open WhatsApp</a>
                      </div>
                    </div>
                  </div>
                );
              })() : null}

              {activeTab === 'milestones' ? (
                <div className="milestonesScreen">
                  {/* Progress header */}
                  <div className="milestonesHero glassPanelNested">
                    <span className="minorLabel">Cultural Milestones</span>
                    <strong>{completedMilestonesCount} of {totalMilestonesCount} milestones complete</strong>
                    <div className="milestonesProgressBar">
                      <div className="milestonesProgressFill" style={{ width: `${Math.round((completedMilestonesCount / totalMilestonesCount) * 100)}%` }} />
                    </div>
                    <p>Cultural milestones are optional — add only what applies to your ceremony.</p>
                  </div>

                  {/* Milestone cards */}
                  <div className="milestonesList">
                    {milestones.map((milestone) => (
                      <article key={milestone.id} className={`milestoneCard glassPanelNested milestone-${milestone.status}`}>
                        <div className="milestoneCardLeft">
                          <div className={`milestoneStatusDot dot-${milestone.status}`}>
                            {milestone.status === 'complete' ? '✓' : milestone.status === 'in-progress' ? '⚡' : '○'}
                          </div>
                        </div>
                        <div className="milestoneCardBody">
                          <strong>{milestone.title}</strong>
                          <div className="milestoneMeta">
                            <span className="minorLabel">Owner: {milestone.ownerName}</span>
                            {milestone.dueDate ? <span className="minorLabel">Due: {milestone.dueDate}</span> : null}
                          </div>
                          {milestone.notes ? <p>{milestone.notes}</p> : null}
                        </div>
                        <div className="milestoneCardActions">
                          {milestone.status !== 'complete' ? (
                            <button type="button" className="ghostButton" onClick={() => setMilestones((prev) => prev.map((m) => m.id === milestone.id ? { ...m, status: 'complete' } : m))}>Mark Complete</button>
                          ) : <span className="milestoneCompletedLabel">Completed</span>}
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* Add custom milestone */}
                  <div className="milestonesAddRow glassPanelNested">
                    <span className="minorLabel">Add Custom Milestone</span>
                    <div className="milestonesAddForm">
                      <input
                        type="text"
                        placeholder="e.g. White wedding confirmed"
                        value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                        className="milestonesInput"
                      />
                      <button type="button" className="primaryButton" onClick={() => {
                        if (!newMilestoneTitle.trim()) return;
                        setMilestones((prev) => [...prev, { id: `cm-${Date.now()}`, title: newMilestoneTitle.trim(), status: 'pending', dueDate: '', ownerName: 'Couple', notes: '' }]);
                        setNewMilestoneTitle('');
                      }}>Add</button>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === 'event-admin' ? (
                <div className="eventAdminScreen">
                  <div className="adminSectionBanner glassPanelNested">
                    <span className="minorLabel">Admin Mode</span>
                    <strong>Wedding Demo Management</strong>
                    <p>Edit demo data live. All changes reflect immediately across the dashboard without a code deploy.</p>
                  </div>

                  {/* Event details */}
                  <details className="adminSection glassPanelNested" open>
                    <summary className="adminSectionTitle">Event Details</summary>
                    <div className="adminSectionBody">
                      <div className="adminFieldGrid">
                        <label className="adminField"><span>Couple Name</span><input defaultValue="Thabo & Lelo" className="adminInput" /></label>
                        <label className="adminField"><span>Event Date</span><input defaultValue="26 September 2026" className="adminInput" /></label>
                        <label className="adminField"><span>Location</span><input defaultValue="Midrand, Gauteng" className="adminInput" /></label>
                        <label className="adminField"><span>Guest Target</span><input defaultValue="500" type="number" className="adminInput" /></label>
                        <label className="adminField"><span>Total Budget (R)</span><input defaultValue="400000" type="number" className="adminInput" /></label>
                      </div>
                    </div>
                  </details>

                  {/* Supplier status manager */}
                  <details className="adminSection glassPanelNested">
                    <summary className="adminSectionTitle">Supplier Status Manager</summary>
                    <div className="adminSectionBody">
                      <p className="adminHint">Change supplier statuses to simulate different readiness scenarios.</p>
                      {allVendors.map((vendor) => (
                        <div key={vendor.id} className="adminSupplierRow">
                          <span className="adminSupplierName">{vendor.slot} — {vendor.name}</span>
                          <select
                            defaultValue={vendor.status}
                            className="adminSelect"
                            onChange={(e) => {
                              const newStatus = e.target.value as VendorStatus;
                              const updatedBoard = {
                                core: selectedBoard.core.map((v) => v.id === vendor.id ? { ...v, status: newStatus } : v),
                                support: selectedBoard.support.map((v) => v.id === vendor.id ? { ...v, status: newStatus } : v),
                              };
                              setPlannerBoardOverride(updatedBoard);
                            }}
                          >
                            <option value="secured">Secured</option>
                            <option value="booked">Booked</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="optional">Optional</option>
                            <option value="recommended">Recommended</option>
                            <option value="at_risk">At Risk</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </details>

                  {/* Alerts manager */}
                  <details className="adminSection glassPanelNested">
                    <summary className="adminSectionTitle">Alerts & Risks</summary>
                    <div className="adminSectionBody">
                      {adminAlerts.map((alert) => (
                        <div key={alert.id} className="adminAlertRow">
                          <select value={alert.severity} className="adminSelect adminSelectSmall" onChange={(e) => setAdminAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, severity: e.target.value } : a))}>
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                          </select>
                          <input value={alert.message} className="adminInput adminInputGrow" onChange={(e) => setAdminAlerts((prev) => prev.map((a) => a.id === alert.id ? { ...a, message: e.target.value } : a))} />
                          <button type="button" className="ghostButton adminDeleteBtn" onClick={() => setAdminAlerts((prev) => prev.filter((a) => a.id !== alert.id))}>✕</button>
                        </div>
                      ))}
                      <div className="adminAlertRow adminAlertAdd">
                        <select value={adminNewAlert.severity} className="adminSelect adminSelectSmall" onChange={(e) => setAdminNewAlert((prev) => ({ ...prev, severity: e.target.value }))}>
                          <option>High</option>
                          <option>Medium</option>
                          <option>Low</option>
                        </select>
                        <input value={adminNewAlert.message} placeholder="New alert message..." className="adminInput adminInputGrow" onChange={(e) => setAdminNewAlert((prev) => ({ ...prev, message: e.target.value }))} />
                        <button type="button" className="primaryButton" onClick={() => {
                          if (!adminNewAlert.message.trim()) return;
                          setAdminAlerts((prev) => [...prev, { id: `a-${Date.now()}`, ...adminNewAlert }]);
                          setAdminNewAlert({ severity: 'Medium', message: '', action: '' });
                        }}>Add</button>
                      </div>
                    </div>
                  </details>

                  {/* Coach note editor */}
                  <details className="adminSection glassPanelNested">
                    <summary className="adminSectionTitle">Coach Note</summary>
                    <div className="adminSectionBody">
                      <p className="adminHint">This note appears on the Dashboard and Coach tab.</p>
                      <textarea value={adminCoachNote} rows={4} className="adminTextarea" onChange={(e) => setAdminCoachNote(e.target.value)} />
                    </div>
                  </details>

                  {/* RSVP guest manager */}
                  <details className="adminSection glassPanelNested">
                    <summary className="adminSectionTitle">Guest List ({rsvpGuests.length} guests)</summary>
                    <div className="adminSectionBody">
                      {rsvpGuests.map((guest) => (
                        <div key={guest.id} className="adminGuestRow">
                          <span className="adminGuestName">{guest.name}</span>
                          <span className="adminGuestGroup">{guest.group}</span>
                          <select value={guest.status} className="adminSelect adminSelectSmall" onChange={(e) => setRsvpGuests((prev) => prev.map((g) => g.id === guest.id ? { ...g, status: e.target.value as RsvpGuest['status'] } : g))}>
                            <option>Confirmed</option>
                            <option>Pending</option>
                            <option>Declined</option>
                            <option>No Response</option>
                            <option>Maybe</option>
                            <option>Verbal Confirmation</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </details>

                  {/* Milestone manager */}
                  <details className="adminSection glassPanelNested">
                    <summary className="adminSectionTitle">Cultural Milestones</summary>
                    <div className="adminSectionBody">
                      {milestones.map((milestone) => (
                        <div key={milestone.id} className="adminMilestoneRow">
                          <span className="adminMilestoneName">{milestone.title}</span>
                          <select value={milestone.status} className="adminSelect adminSelectSmall" onChange={(e) => setMilestones((prev) => prev.map((m) => m.id === milestone.id ? { ...m, status: e.target.value as CulturalMilestone['status'] } : m))}>
                            <option value="complete">Complete</option>
                            <option value="in-progress">In Progress</option>
                            <option value="pending">Pending</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </details>
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
                        {'company' in selectedCoach ? <span className="coachCompanyTag">{(selectedCoach as typeof coachByEvent.wedding).company}</span> : null}
                        <div className="coachMeta">
                          <span className="scorePill">{selectedCoach.score} Rating</span>
                          <span>{selectedCoach.events} Events Managed</span>
                        </div>
                        {'responseTime' in selectedCoach ? (
                          <div className="coachMeta">
                            <span>Response: {(selectedCoach as typeof coachByEvent.wedding).responseTime}</span>
                            <span>Specialty: {(selectedCoach as typeof coachByEvent.wedding).specialty}</span>
                          </div>
                        ) : null}
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
            {plannerTabs.filter((tab) => !tab.adminOnly || mockSession?.role === 'admin').map((tab) => {
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
                {/* Included / Excluded / Optional Extras */}
                {(() => {
                  const details = getSupplierScopeDetails(selectedSupplier.slot);
                  return (
                    <div className="supplierScopeGrid">
                      <div className="supplierScopeSection is-included">
                        <span className="minorLabel">Included</span>
                        {details.included.map((item) => <div key={item} className="scopeItem"><span className="scopeDot dot-included">✓</span>{item}</div>)}
                      </div>
                      <div className="supplierScopeSection is-excluded">
                        <span className="minorLabel">Excluded</span>
                        {details.excluded.map((item) => <div key={item} className="scopeItem"><span className="scopeDot dot-excluded">✕</span>{item}</div>)}
                      </div>
                    </div>
                  );
                })()}

                {/* Optional Extras */}
                {(() => {
                  const extras = getSupplierOptionalExtras(selectedSupplier.slot);
                  if (extras.length === 0) return null;
                  return (
                    <div className="supplierExtrasSection glassPanelNested">
                      <span className="minorLabel">Optional Extras</span>
                      <p className="extrasDisclaimer">These are NOT included in the quoted price. Add them individually after coach review.</p>
                      {extras.map((extra) => (
                        <div key={extra.label} className="extraRow">
                          <span className="extraLabel">{extra.label}</span>
                          <span className="extraPrice">{extra.price}</span>
                          <button type="button" className="ghostButton extraAddBtn" onClick={() => setPlannerToast(`${extra.label} added as pending budget item — awaiting approval.`)}>Add Extra</button>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Coach Note */}
                {(() => {
                  const note = getSupplierCoachNote(selectedSupplier.slot);
                  return note ? (
                    <div className="supplierCoachNote glassPanelNested">
                      <span className="minorLabel">Coach Note</span>
                      <p>{note}</p>
                    </div>
                  ) : null;
                })()}

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
