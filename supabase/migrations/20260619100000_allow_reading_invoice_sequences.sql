create or replace function public.get_workspace_invoice_sequences(target_workspace_id uuid)
returns table (assessment_year_id uuid, next_serial bigint)
security definer
as $$
begin
  if not private.is_workspace_member(target_workspace_id) then
    raise exception 'Access denied';
  end if;

  return query
  select s.assessment_year_id, s.next_serial
  from public.invoice_sequences s
  where s.workspace_id = target_workspace_id;
end;
$$ language plpgsql;

revoke all on function public.get_workspace_invoice_sequences(uuid) from public, anon;
grant execute on function public.get_workspace_invoice_sequences(uuid) to authenticated;
