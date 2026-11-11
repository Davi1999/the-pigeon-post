-- Publish Issue #3.2 to the Updates page.
-- Idempotent so applying this after a manual insert does not duplicate it.
insert into public.site_updates (title, body)
select
  'Issue #3.2 - Friend request notifications and email polish',
  $body$
New: Friend request notifications

* When someone sends you a friend request, The Pigeon Post will now send a note straight to your inbox so you can act on it right away.
* Each note shows who is asking and links straight to your friends page, where you can accept or decline.

Improved: A masthead fit for the presses

* Notification emails now use The Pigeon Post's masthead font, so every dispatch carries the paper's look.
* This applies to both reply notifications and friend request notifications.

That's all for this dispatch — see you in the next issue.
$body$
where not exists (
  select 1
  from public.site_updates
  where title = 'Issue #3.2 - Friend request notifications and email polish'
);
