'use strict';
// Where the shared board lives. The publishable key is meant to ship inside the app (anyone
// could read it out of the apk anyway); the database rules in supabase/schema.sql are what
// keep each board private to the devices that joined it. Never put a secret/service key here.
window.SYNC_CONFIG = {
  url: 'https://mamvyebdtxhucpxnzskk.supabase.co',
  key: 'sb_publishable_LOj1tpsQKr2-9nXw-IDFYg_56AjLNzV',
};
