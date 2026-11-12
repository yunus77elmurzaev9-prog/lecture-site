-- Выполните этот SQL в Supabase → SQL Editor.
create table if not exists public.lectures (
  id uuid primary key,
  title text not null,
  file_path text not null unique,
  file_name text not null,
  created_at timestamptz not null default now()
);

alter table public.lectures enable row level security;

-- Всем посетителям разрешено читать каталог лекций.
create policy "Public can read lectures"
on public.lectures for select
to anon, authenticated
using (true);

-- Изменять каталог могут только вошедшие пользователи.
create policy "Authenticated users can add lectures"
on public.lectures for insert
to authenticated
with check (true);

create policy "Authenticated users can delete lectures"
on public.lectures for delete
to authenticated
using (true);

-- Создайте Storage bucket с именем lecture-files и включите Public bucket.
-- Политики для Storage:
create policy "Public can download lecture files"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'lecture-files');

create policy "Authenticated users can upload lecture files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'lecture-files');

create policy "Authenticated users can delete lecture files"
on storage.objects for delete
to authenticated
using (bucket_id = 'lecture-files');
