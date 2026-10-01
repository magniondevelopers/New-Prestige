# Server setup (cPanel)

1. Upload `pricing-api.php` to the same folder as `website-api.php`:
   `app.prestigevacations.in/website-media/pricing-api.php`
2. Make sure the folder is writable by PHP (it creates `website-media/data/pricing.json`
   and a `.htaccess` that blocks direct access to that folder).
3. PHP 7.0+ with the cURL extension (standard on cPanel).
4. Open Admin Panel → Room Pricing, check the values, click **Save Pricing** once.
   Until the first save, the API serves the default (current) prices.

Admin logins are verified by calling `website-api.php?action=check_auth` with the
admin's token, so no passwords are stored in this file.

Inquiries from all website forms use the existing
`website-api.php?action=submit_inquiry` endpoint — no server change needed.
Extra fields (city, family size, travel period, etc.) are also included
in the message text so they always show in Contact Inquiries.
