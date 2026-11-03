# Email backend setup

The frontend sends appointment requests to `POST /api/bookings`. The backend emails each request to the clinic address configured in `server.js` (`salahallam036@gmail.com`). No Supabase database is required for this email-only workflow.

## Local setup
1. Install Node.js 18 or newer.
2. Open a terminal in this `server` directory and run `npm install`.
3. Copy `.env.example` to `.env`.
4. Set `SMTP_USER` to a Gmail mailbox authorized to send and `SMTP_PASS` to its Google **App Password**. Do not use the normal Gmail password and never put SMTP credentials in frontend files.
5. From this directory, run `npm start`.
6. Open `http://localhost:3000`. The page and `/api/bookings` endpoint must be served by the same Node app.
7. Check `http://localhost:3000/api/health`. `emailConfigured` must be `true` after SMTP variables are set.
8. Test a booking using a real date, then verify the clinic inbox and spam folder.

## Gmail setup
For a Gmail sender account, enable 2-Step Verification and create an App Password in Google Account security settings. Use that generated password for `SMTP_PASS`. The recipient is fixed to the clinic address. `MAIL_FROM` should use the sender mailbox, not a fabricated address.

## Deployment
Deploy the entire project with the Node server to a host that supports Node.js and HTTPS. Set the environment variables in the host's secret/environment settings. Do not upload `.env` to public hosting or commit it. The static page hosted separately cannot send through this backend unless its API URL and CORS/security configuration are intentionally adapted.

## Booking behavior
- Only essential appointment fields are requested; no patient file upload.
- The email is sent before the frontend displays a successful submission.
- The receipt can be printed or saved as PDF after successful email delivery.
- The receipt is a request summary, not confirmation of an appointment.
- Requests are rate-limited and basic server-side field validation is applied.
- This prototype does not reserve calendar slots or prevent double-booking. The clinic must confirm availability manually.
