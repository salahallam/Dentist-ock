// Appointment request: send to the clinic backend, then show a printable receipt.
const $ = (selector) => document.querySelector(selector);
const form = $("#bookingForm");
const statusBox = $("#status");
const receipt = $("#receipt");
const toast = $("#toast");
const submitButton = form.querySelector('button[type="submit"]');
const originalSubmitLabel = submitButton.innerHTML;

$("#year").textContent = new Date().getFullYear();

const now = new Date();
const localToday = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  .toISOString().slice(0, 10);
$("#date").min = localToday;

document.querySelectorAll(".service-book").forEach((link) => {
  link.addEventListener("click", () => {
    $("#service").value = link.dataset.service || "";
    window.setTimeout(() => $("#name").focus({ preventScroll: true }), 250);
  });
});

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[character]));
}

function showStatus(message, isError = false) {
  statusBox.className = `status show${isError ? " error" : ""}`;
  statusBox.textContent = message;
}

function buildReceipt(data, reference) {
  const dateLabel = new Date(`${data.date}T12:00:00`).toLocaleDateString("fr-FR");
  $("#receiptDate").textContent = new Date().toLocaleDateString("fr-FR");
  const rows = [
    ["Référence", reference],
    ["Nom", data.name],
    ["Téléphone", data.phone],
    ["Service", data.service],
    ["Date souhaitée", dateLabel],
    ["Heure souhaitée", data.time],
    ["Email", data.email || "Non renseigné"]
  ];
  if (data.note) rows.push(["Note", data.note]);

  $("#receiptDetails").innerHTML = rows.map(([label, value]) =>
    `<div${label === "Note" ? ' style="grid-column:1/-1"' : ""}><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`
  ).join("");
  receipt.classList.add("show");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const data = {
    name: String(formData.get("name") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    service: String(formData.get("service") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    date: String(formData.get("date") || ""),
    time: String(formData.get("time") || ""),
    note: String(formData.get("note") || "").trim()
  };

  submitButton.disabled = true;
  submitButton.setAttribute("aria-busy", "true");
  submitButton.textContent = "Envoi en cours…";
  receipt.classList.remove("show");
  statusBox.classList.remove("show", "error");

  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok || !result.ok || !result.reference) {
      throw new Error(result.error || "La demande n’a pas pu être envoyée.");
    }

    buildReceipt(data, result.reference);
    showStatus(`Votre demande a été envoyée au cabinet. Référence : ${result.reference}. Le rendez-vous reste à confirmer par la clinique.`);
    receipt.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    const message = error instanceof TypeError
      ? "Impossible de joindre le serveur de réservation. Vérifiez que le site est publié avec son backend, puis réessayez."
      : (error.message || "Erreur lors de l’envoi. Réessayez plus tard.");
    showStatus(message, true);
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute("aria-busy");
    submitButton.innerHTML = originalSubmitLabel;
  }
});

$("#printReceipt").addEventListener("click", () => window.print());
$("#newRequest").addEventListener("click", () => {
  form.reset();
  receipt.classList.remove("show");
  statusBox.classList.remove("show", "error");
  $("#date").min = localToday;
  $("#booking").scrollIntoView({ behavior: "smooth" });
});
