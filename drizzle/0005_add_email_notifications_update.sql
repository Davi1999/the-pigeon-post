-- Publish Issue #3.1 to the Updates page.
-- Idempotent so applying this after a manual insert does not duplicate it.
insert into public.site_updates (title, body)
select
  'Issue #3.1 - Email notifications',
  $body$
New: Email notifications

* When a fellow reader replies to a story you wrote, The Pigeon Post will now send a note straight to your inbox.
* Each note includes who replied, a short excerpt of their message and a link back to the discussion.
* Replies deeper in a comment thread are included too.
* You will never be emailed about your own comments.

That's all for this dispatch — see you in the next issue.
$body$
where not exists (
  select 1
  from public.site_updates
  where title = 'Issue #3.1 - Email notifications'
);
