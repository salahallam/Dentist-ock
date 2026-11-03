# Centre Dentaire Dr Mohamed Selloum

## Included
- `index.html`: French clinic landing page and appointment form
- `css/style.css`: responsive styling
- `js/main.js`: client validation, API submission, and printable receipt
- `assets/images/`: supplied clinic images
- `server/`: Node.js/Express email backend

## Appointment workflow
The patient enters only essential details: name, phone, service, requested date/time, and optional email/note. The site sends the request to `POST /api/bookings`; the backend emails it to `salahallam036@gmail.com`. The form does not ask the patient to upload a file.

Only after the server confirms email delivery does the page show the request receipt. The patient can print it or choose “Save as PDF” and bring it to the clinic. It is a request receipt, not an appointment confirmation. The clinic must confirm availability manually.

## Run locally
1. Install Node.js 18+.
2. In `server/`, run `npm install`.
3. Copy `server/.env.example` to `server/.env` and set Gmail SMTP credentials (Google App Password).
4. In `server/`, run `npm start`.
5. Visit `http://localhost:3000`.

See `server/README.md` for SMTP and deployment details. Do not put SMTP credentials in browser code or commit `.env`. Supabase is not needed for this email-only flow.

## Before public launch
Verify the clinic's phone, address, service list, images, opening hours, and email. Deploy the Node backend and frontend together behind HTTPS, configure environment variables in the hosting dashboard, and test successful and failed email delivery.
