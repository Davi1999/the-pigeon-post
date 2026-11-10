-- Featured images for posts.
-- Public read so <img> tags can load objects directly; writes happen only
-- through the server-side service-role client, so no insert/update policy
-- is granted to anon or authenticated users.

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read post images" on storage.objects;

create policy "Public read post images"
on storage.objects
for select
to public
using (bucket_id = 'post-images');
