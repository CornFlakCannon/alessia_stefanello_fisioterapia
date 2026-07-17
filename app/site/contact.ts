import { CONTACT } from "./data";

/** Build a mailto: URL to Alessia with a subject + plain-text body. */
export function mailto(subject: string, body: string): string {
  return (
    `mailto:${CONTACT.email}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`
  );
}

export type AppointmentFields = {
  nome?: string;
  cognome?: string;
  email?: string;
  telefono?: string;
  eta?: string;
  datetime?: string;
  descrizione?: string;
};

/** Compose the appointment-request email (subject + prefilled body) from whatever
 *  fields are present. Used by the contact form and the "Contattami" CTA. */
export function appointmentMailto(f: AppointmentFields): string {
  const who = [f.nome, f.cognome].filter(Boolean).join(" ").trim();
  const subject = `Richiesta appuntamento${who ? ` — ${who}` : ""}`;
  const lines: string[] = [
    `Nome: ${who || "—"}`,
    f.email ? `Email: ${f.email}` : null,
    f.telefono ? `Telefono: ${f.telefono}` : null,
    f.eta ? `Età: ${f.eta}` : null,
    f.datetime ? `Data/ora preferita: ${f.datetime}` : null,
    "",
    "Descrizione:",
    f.descrizione || "—",
  ].filter((l): l is string => l !== null);
  return mailto(subject, lines.join("\n"));
}
