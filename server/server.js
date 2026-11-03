require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
const clinicEmail = "salahallam036@gmail.com";
const allowedServices = new Set([
  "Consultation dentaire",
  "Hygiène & prévention",
  "Soins restaurateurs",
  "Prothèses dentaires",
  "Orthodontie",
  "Autre soin"
]);
const allowedTimes = new Set([
  "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"
]);

app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, emailConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) });
});

app.use(express.static(path.join(__dirname, ".."), {
  extensions: ["html"],
  dotfiles: "ignore"
}));

app.use("/api/bookings", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "طلبات كثيرة خلال وقت قصير. يرجى المحاولة لاحقاً." }
}));

function clean(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}
function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

app.post("/api/bookings", async (req, res) => {
  const name = clean(req.body?.name, 100);
  const phone = clean(req.body?.phone, 25);
  const service = clean(req.body?.service, 80);
  const email = clean(req.body?.email, 150);
  const date = clean(req.body?.date, 10);
  const time = clean(req.body?.time, 5);
  const note = clean(req.body?.note, 300);

  if (!name || !phone || !service || !date || !time) {
    return res.status(400).json({ error: "يرجى إكمال الحقول الأساسية." });
  }
  if (name.length < 2 || !/^[+\d\s().-]{6,25}$/.test(phone)) {
    return res.status(400).json({ error: "يرجى التحقق من الاسم ورقم الهاتف." });
  }
  if (!allowedServices.has(service) || !allowedTimes.has(time) || !validDate(date)) {
    return res.status(400).json({ error: "الخدمة أو التاريخ أو الوقت غير صالح." });
  }
  if (date < new Date().toISOString().slice(0, 10)) {
    return res.status(400).json({ error: "لا يمكن اختيار تاريخ سابق." });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "يرجى إدخال بريد إلكتروني صالح." });
  }

  const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter((key) => !process.env[key]);
  if (missing.length) {
    return res.status(503).json({ error: "إعداد إرسال البريد غير مكتمل على الخادم." });
  }

  try {
    const port = Number(process.env.SMTP_PORT || 587);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000
    });

    const reference = `CDS-${Date.now().toString(36).toUpperCase()}`;
    const text = [
      "Nouvelle demande de rendez-vous",
      `Référence: ${reference}`,
      `Nom: ${name}`,
      `Téléphone: ${phone}`,
      `Service: ${service}`,
      `Date souhaitée: ${date}`,
      `Heure souhaitée: ${time}`,
      `Email: ${email || "Non renseigné"}`,
      `Note: ${note || "Aucune"}`,
      "",
      "Cette demande doit être confirmée par le cabinet."
    ].join("\n");

    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: clinicEmail,
      replyTo: email || undefined,
      subject: `Nouvelle demande de rendez-vous ${reference}`,
      text
    });

    return res.status(200).json({ ok: true, reference });
  } catch (error) {
    console.error("Email delivery failed:", error.message);
    return res.status(502).json({ error: "تعذر إرسال الطلب إلى العيادة. يرجى المحاولة لاحقاً." });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Clinic site listening on port ${port}`));
