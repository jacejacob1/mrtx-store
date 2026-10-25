-- Release unpaid prepaid holds every 5 minutes, inside the database.
-- Runs even if the website is down; no Vercel cron needed.
create extension if not exists pg_cron;

select cron.unschedule(jobid) from cron.job where jobname = 'release-expired-holds';
select cron.schedule('release-expired-holds', '*/5 * * * *', $$select public.release_expired()$$);
