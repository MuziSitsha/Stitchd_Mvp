import { useState } from "react";
import { AppShell, type LensKey } from "../components/proto/AppShell";
import { Onboarding } from "../components/proto/Onboarding";
import { ProtoStateProvider, useProtoState } from "../state/ProtoState";
import { useTheme } from "../theme/ThemeContext";
import { Squad } from "./Squad";
import { Suppliers } from "./lenses/Suppliers";
import { SupplierPortalLens } from "./lenses/SupplierPortalLens";
import { Budget } from "./lenses/Budget";
import { Rsvp } from "./lenses/Rsvp";
import { Seating } from "./lenses/Seating";
import { StitchIt } from "./lenses/StitchIt";
import { Tasks } from "./lenses/Tasks";
import { Timeline } from "./lenses/Timeline";
import { Chat } from "./lenses/Chat";
import { Coach } from "./lenses/Coach";

function Lens({ lens, setLens }: { lens: LensKey; setLens: (l: LensKey) => void }) {
  switch (lens) {
    case "squad": return <Squad setLens={setLens} />;
    case "suppliers": return <Suppliers />;
    case "portal": return <SupplierPortalLens />;
    case "budget": return <Budget setLens={setLens} />;
    case "rsvp": return <Rsvp />;
    case "seating": return <Seating />;
    case "stitchit": return <StitchIt />;
    case "tasks": return <Tasks />;
    case "timeline": return <Timeline setLens={setLens} />;
    case "chat": return <Chat setLens={setLens} />;
    case "coach": return <Coach setLens={setLens} />;
    default: return null;
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
  initialLens = "squad",
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
