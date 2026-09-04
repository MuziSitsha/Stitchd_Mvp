-- Phase H — a real version of the doc's promotion builder ("supplier
-- selects date/capacity → discount/bundle → publish → marketplace update").
-- Supplier self-publishes (same tier as supplier_addons — plain CRUD on
-- their own row); admin's role is post-publish moderation only, which is a
-- cross-actor write so it goes through an Edge Function like every other
-- admin-acting-on-someone-else's-row case in this codebase.
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default next_ref('PRO'),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  title text not null,
  description text,
  discount_label text,
  applicable_date date,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger promotions_audit after insert or update on public.promotions
  for each row execute function public.log_activity();

alter table public.promotions enable row level security;

-- Published promotions are visible platform-wide (the marketplace deals
-- strip needs this); a supplier always sees their own regardless of status;
-- admin sees everything for moderation.
create policy promotions_select on public.promotions for select to authenticated
  using (
    status = 'published'
    or supplier_id in (select id from public.suppliers where profile_id = auth.uid())
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );

create policy promotions_manage_own on public.promotions for all to authenticated
  using (supplier_id in (select id from public.suppliers where profile_id = auth.uid()))
  with check (supplier_id in (select id from public.suppliers where profile_id = auth.uid()));

alter publication supabase_realtime add table public.promotions;
