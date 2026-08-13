import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Header } from "../components/Header";

interface AdminSupplier {
  id: string;
  name: string;
  category: string;
  status: string;
  verified: boolean;
}

interface AdminLead {
  id: string;
  ref: string;
  requester_name: string;
  requester_phone: string;
  status: "new" | "accepted" | "declined";
  created_at: string;
  suppliers: { name: string; category: string } | null;
}

// FR-ADMIN-01/02: a live cross-supplier lead board, and verify/feature
// toggles. Both are read/write against real tables/functions that already
// existed with zero UI — this page is the first face on them.
export function AdminConsole() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [suppliers, setSuppliers] = useState<AdminSupplier[]>([]);
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadSuppliers = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("suppliers")
      .select("id, name, category, status, verified")
      .order("category");
    if (fetchError) setError(fetchError.message);
    else setSuppliers(data ?? []);
  }, []);

  const loadLeads = useCallback(async () => {
    const { data, error: fetchError } = await supabase
      .from("leads")
      .select("id, ref, requester_name, requester_phone, status, created_at, suppliers(name, category)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (fetchError) setError(fetchError.message);
    else setLeads((data as unknown as AdminLead[]) ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function checkAccess() {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) {
        navigate("/admin/login");
        return;
      }
      const { data: roles, error: roleErr } = await supabase
        .from("role_assignments")
        .select("role")
        .eq("user_id", userRes.user.id)
        .eq("status", "active")
        .in("role", ["admin", "super"]);
      if (cancelled) return;
      if (roleErr) {
        setError(roleErr.message);
        setAuthorized(false);
        return;
      }
      setAuthorized((roles ?? []).length > 0);
    }
    checkAccess();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!authorized) return;
    loadSuppliers();
    loadLeads();

    const channel = supabase
      .channel("admin-console")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, loadLeads)
      .on("postgres_changes", { event: "*", schema: "public", table: "suppliers" }, loadSuppliers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authorized, loadSuppliers, loadLeads]);

  async function setVerification(supplierId: string, decision: "verified" | "rejected") {
    setBusyId(supplierId);
    setError(null);
    const { error: fnError } = await supabase.functions.invoke("verifications-toggle", {
      body: { supplier_id: supplierId, decision },
    });
    if (fnError) setError(fnError.message);
    setBusyId(null);
  }

  if (authorized === null) {
    return (
      <>
        <Header />
        <main className="portal-page">Checking access...</main>
      </>
    );
  }

  if (!authorized) {
    return (
      <>
        <Header />
        <main className="portal-page">
          <h1>Not authorised</h1>
          <p>This account doesn't hold an admin or ops role.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="admin-console portal-page">
        <h1>Ops / Admin Console</h1>

        {error && <p className="error">{error}</p>}

        <section>
          <h2>Suppliers ({suppliers.length})</h2>
          <ul className="supplier-list">
            {suppliers.map((s) => (
              <li key={s.id}>
                <div>
                  <strong>{s.name}</strong> · {s.category}
                  <div className="badges">
                    <span className={`badge ${s.verified ? "verified" : ""}`}>{s.verified ? "Verified" : "Unverified"}</span>
                    <span className={`status status-${s.status}`}>{s.status}</span>
                  </div>
                </div>
                <div className="lead-actions">
                  <button type="button" disabled={busyId === s.id || s.verified} onClick={() => setVerification(s.id, "verified")}>
                    {busyId === s.id ? "Working..." : "Verify"}
                  </button>
                  <button type="button" disabled={busyId === s.id || !s.verified} onClick={() => setVerification(s.id, "rejected")}>
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Lead board ({leads.filter((l) => l.status === "new").length} new)</h2>
          <ul className="lead-list">
            {leads.map((lead) => (
              <li key={lead.id} className={`lead lead-${lead.status}`}>
                <div>
                  <strong>{lead.requester_name}</strong> · {lead.requester_phone}
                  <p>
                    {lead.suppliers?.name ?? "unknown supplier"} · {lead.suppliers?.category}
                  </p>
                  <span className="ref">{lead.ref}</span>
                </div>
                <span className={`status status-${lead.status}`}>{lead.status}</span>
              </li>
            ))}
            {leads.length === 0 && <li>No leads yet.</li>}
          </ul>
        </section>
      </main>
    </>
  );
}
