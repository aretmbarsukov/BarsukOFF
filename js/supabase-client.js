(() => {
  if (window.barsukonSupabaseClient || !window.supabase?.createClient) return;

  const projectUrl = 'https://zjfkrqkuezdvhgbudjnt.supabase.co';
  const publishableKey = 'sb_publishable_ngq1y4Zr9wCu86KTBgocSw_HmmmwEY6';
  window.barsukonSupabaseClient = window.supabase.createClient(projectUrl, publishableKey);
})();
