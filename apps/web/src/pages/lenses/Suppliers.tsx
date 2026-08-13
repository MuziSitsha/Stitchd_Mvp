import { useTheme } from "../../theme/ThemeContext";
import { FutCard } from "../../components/proto/FutCard";
import { roleRank } from "../../components/proto/data";
import { useProtoState } from "../../state/ProtoState";
import { useLiveSupplierStatus } from "../../state/useLiveSupplierStatus";

// Ported exactly from stitchd-v9.jsx lines 1817-1822. The live-status merge
// (VERIFIED/BOOSTED badges) is a deliberate addition beyond the prototype —
// it's what actually lets a real Boost/Verify done in the Supplier Portal
// show up here, closing the loop FR-RANK-01 describes.
export function Suppliers() {
  const { T, pal } = useTheme();
  const { sup, secure, moveZone, setSelSup } = useProtoState();
  const live = useLiveSupplierStatus();
  const sorted = [...sup].sort((a, b) => roleRank(a.role) - roleRank(b.role));

  return (
    <div className="space-y-3 rise">
      <div className="text-sm" style={{ color: T.sub }}>
        Every card carries a <b style={{ color: T.ink }}>performance score</b> and a status border —{" "}
        <span style={{ color: T.good }}>green confirmed</span>, <span style={{ color: T.faint }}>grey pending</span>,{" "}
        <span style={{ color: T.bad }}>red issue</span>. Ordered by service flow.
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sorted.map((s) => (
          <FutCard key={s.id} s={s} T={T} pal={pal} w={150} live={live.get(s.name)} onOpen={() => setSelSup(s.id)} onSecure={() => secure(s.id)} onMove={() => moveZone(s.id)} />
        ))}
      </div>
    </div>
  );
}
