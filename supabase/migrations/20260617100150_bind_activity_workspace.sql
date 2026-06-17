alter table public.activity_events
  add constraint activity_events_workspace_fk
  foreign key (workspace_id)
  references public.workspaces(id);
