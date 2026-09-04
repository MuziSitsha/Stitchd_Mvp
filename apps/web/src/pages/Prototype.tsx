import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { AppShell, type LensKey } from "../components/proto/AppShell";
import { Onboarding } from "../components/proto/Onboarding";
import { ProtoStateProvider, useProtoState } from "../state/ProtoState";
import { useTheme } from "../theme/ThemeContext";
import { Today } from "./lenses/Today";
import { Week } from "./lenses/Week";
import { Squad } from "./Squad";
import { SupplierPortalLens } from "./lenses/SupplierPortalLens";
import { Budget } from "./lenses/Budget";
import { Payments } from "./lenses/Payments";
import { GuestList } from "./lenses/GuestList";
import { Rsvp } from "./lenses/Rsvp";
import { Passes } from "./lenses/Passes";
import { Seating } from "./lenses/Seating";
import { OurDay } from "./lenses/OurDay";
import { Vision } from "./lenses/Vision";
import { Gifts } from "./lenses/Gifts";
import { Runsheet } from "./lenses/Runsheet";
import { Documents } from "./lenses/Documents";
import { CoachClient } from "./lenses/CoachClient";
import { Support } from "./lenses/Support";
import { StitchIt } from "./lenses/StitchIt";
import { Chat } from "./lenses/Chat";
import { ComingSoon } from "./lenses/ComingSoon";

// Interim map while the redesign lands screen by screen (see the phased
// plan): every new Screen key already routes somewhere real — either its
// finished new-design component, the closest existing lens reused as-is,
// or a ComingSoon placeholder for screens with no old equivalent yet.
function Lens({ lens, setLens }: { lens: LensKey; setLens: (l: LensKey) => void }) {
  switch (lens) {
    // Today
    case "today": return <Today setLens={setLens} />;
    case "week": return <Week />;
    // Suppliers
    case "team": return <Squad />;
    // Guests
    case "guestlist": return <GuestList />;
    case "rsvp": return <Rsvp setLens={setLens} />;
    case "passes": return <Passes />;
    case "seating": return <Seating />;
    // Money
    case "budget": return <Budget setLens={setLens} />;
    case "payments": return <Payments setLens={setLens} />;
    // Us
    case "ourday": return <OurDay setLens={setLens} />;
    case "vision": return <Vision setLens={setLens} />;
    case "gifts": return <Gifts />;
    case "runsheet": return <Runsheet />;
    case "docs": return <Documents />;
    case "coach": return <CoachClient />;
    case "support": return <Support />;
    // Stitch It
    case "stitchit": return <StitchIt />;
    // Ask Lungi
    case "lungi": return <Chat setLens={setLens} />;
    // Staff-only
    case "portal": return <SupplierPortalLens />;
    default: return <ComingSoon label="This screen" icon={ShoppingBag} />;
  }
}

function PrototypeInner({ initialLens, isStaff }: { initialLens: LensKey; isStaff: boolean }) {
  const [lens, setLens] = useState<LensKey>(initialLens);
  const { T, pal, setPal } = useTheme();
  const { guests, setGuests, profile, showOnb, finishOnboarding } = useProtoState();

  return (
    <>
      {showOnb && (
        <Onboarding T={T} guests={guests} setGuests={setGuests} pal={pal} setPal={setPal} initial={profile} onDone={finishOnboarding} />
      )}
      <AppShell lens={lens} setLens={setLens} isStaff={isStaff}>
        <Lens lens={lens} setLens={setLens} />
      </AppShell>
    </>
  );
}

// initialLens/skipOnboarding/isStaff/ownerId come from Entry.tsx, which
// already resolved who's signed in and routed them here — a client with no
// `events` row yet gets skipOnboarding=false (wizard runs once), everyone
// returning gets true; staff always land straight on the "portal" lens and
// are the only ones who ever see its nav tab at all (isStaff defaults false
// — hidden unless explicitly granted, not the other way round).
export function Prototype({
  initialLens = "today",
  skipOnboarding = false,
  isStaff = false,
  ownerId,
}: {
  initialLens?: LensKey;
  skipOnboarding?: boolean;
  isStaff?: boolean;
  ownerId?: string;
}) {
  return (
    <ProtoStateProvider initialShowOnb={!skipOnboarding} ownerId={ownerId}>
      <PrototypeInner initialLens={initialLens} isStaff={isStaff} />
    </ProtoStateProvider>
  );
}
