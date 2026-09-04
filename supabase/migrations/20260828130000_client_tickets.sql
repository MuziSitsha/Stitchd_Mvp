-- Phase 1 of the cross-interface gap-closing pass: clients currently have
-- no way to raise a ticket at all (tickets_insert only allowed supplier/
-- admin) — the doc wants all three actors able to. tickets_select already
-- supports this without changes: a client's own tickets are always visible
-- to them via `created_by = auth.uid()`, and a supplier-scoped one becomes
-- visible to that supplier automatically via the existing
-- `visibility = 'supplier'` clause once we let a client set that.
drop policy tickets_insert on public.tickets;
create policy tickets_insert on public.tickets for insert to authenticated
  with check (
    created_by = auth.uid()
    and (
      (created_by_role = 'supplier' and supplier_id in (select id from public.suppliers where profile_id = auth.uid()))
      or (created_by_role = 'admin' and public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]))
      or (created_by_role = 'client' and event_id in (select id from public.events where owner_id = auth.uid()))
    )
  );

-- Hardening found while designing the above: ticket_comments_insert checked
-- that you could see the ticket, but never that the author_role you're
-- claiming matches who you actually are — a supplier could post a comment
-- claiming author_role 'client'. Now that clients are about to actually use
-- this table, worth closing. Scoped to "this ticket's event/supplier is
-- genuinely yours" per role, same three-way shape as tickets_select.
drop policy ticket_comments_insert on public.ticket_comments;
create policy ticket_comments_insert on public.ticket_comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and (
      (author_role = 'admin' and public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]))
      or (author_role = 'supplier' and ticket_id in (
        select t.id from public.tickets t
        join public.suppliers s on s.id = t.supplier_id
        where s.profile_id = auth.uid()
      ))
      or (author_role = 'client' and ticket_id in (
        select t.id from public.tickets t
        join public.events e on e.id = t.event_id
        where e.owner_id = auth.uid()
      ))
    )
  );
