import "server-only";
import { absoluteUrl } from "@/lib/seo";

const RESEND_KEY = process.env.AUTH_RESEND_KEY;
const FROM = process.env.EMAIL_FROM ?? "coursed.pl <noreply@coursed.pl>";

/**
 * Wysyłka maila przez Resend REST API (ten sam klucz co magic-link auth).
 * Best-effort: bez klucza to no-op (dev), błędy logujemy, nie rzucamy —
 * powiadomienia nie mogą wywalić akcji biznesowej.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<void> {
  if (!RESEND_KEY) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) {
      console.error("[mailer] Resend błąd", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.error("[mailer] wysyłka nieudana", e);
  }
}

function layout(heading: string, bodyHtml: string): string {
  return `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;color:#18181b">
    <div style="background:#18181b;color:#fff;padding:14px 20px;border-radius:8px 8px 0 0;font-weight:700">coursed.pl</div>
    <div style="border:1px solid #e4e4e7;border-top:0;border-radius:0 0 8px 8px;padding:20px">
      <h1 style="font-size:18px;margin:0 0 12px">${heading}</h1>
      ${bodyHtml}
    </div>
  </div>`;
}

const STATUS_TEXT: Record<string, string> = {
  HIDDEN: "ukryta — jest widoczna tylko dla Ciebie i redakcji",
  REMOVED: "usunięta z katalogu",
};

export function reviewModeratedEmail(input: {
  courseTitle: string;
  courseSlug: string;
  status: "HIDDEN" | "REMOVED";
}) {
  const what = STATUS_TEXT[input.status];
  return {
    subject: `Twoja opinia o kursie „${input.courseTitle}" została zmoderowana`,
    html: layout(
      "Zmiana statusu Twojej opinii",
      `<p style="font-size:14px;line-height:1.6">Twoja opinia o kursie
        <a href="${absoluteUrl(`/kursy/${input.courseSlug}`)}" style="color:#18181b">${input.courseTitle}</a>
        została <strong>${what}</strong>.</p>
       <p style="font-size:14px;line-height:1.6">Zasady publikacji i moderacji opisuje
        <a href="${absoluteUrl("/zasady")}" style="color:#18181b">strona Zasady</a>.</p>`,
    ),
  };
}

export function courseRequestDecisionEmail(input: {
  title: string;
  decision: "ACCEPTED" | "REJECTED";
}) {
  const accepted = input.decision === "ACCEPTED";
  return {
    subject: accepted
      ? `Zgłoszony kurs „${input.title}" trafił do katalogu`
      : `Zgłoszenie kursu „${input.title}" zostało odrzucone`,
    html: layout(
      accepted ? "Dziękujemy za zgłoszenie kursu" : "Decyzja w sprawie zgłoszenia",
      accepted
        ? `<p style="font-size:14px;line-height:1.6">Zgłoszony przez Ciebie kurs <strong>${input.title}</strong>
            został przyjęty do katalogu coursed.pl i wkrótce pojawi się publicznie po opracowaniu przez redakcję.</p>`
        : `<p style="font-size:14px;line-height:1.6">Po weryfikacji zgłoszenie kursu <strong>${input.title}</strong>
            nie zostało przyjęte. Jeśli uważasz, że to pomyłka, odpowiedz na tę wiadomość.</p>`,
    ),
  };
}

export function criticGrantedEmail() {
  return {
    subject: "Otrzymujesz status zweryfikowanego krytyka na coursed.pl",
    html: layout(
      "Witamy w gronie krytyków",
      `<p style="font-size:14px;line-height:1.6">Redakcja nadała Twojemu kontu status
        <strong>zweryfikowanego krytyka</strong>. Twoje oceny i opinie są teraz oznaczane jako krytyk
        i wliczane do średniej krytyków.</p>
       <p style="font-size:14px;line-height:1.6">Prosimy o zapoznanie się z
        <a href="${absoluteUrl("/zasady")}" style="color:#18181b">zasadami</a> wystawiania opinii.</p>`,
    ),
  };
}

export function newReviewEmail(input: { courseTitle: string; courseSlug: string }) {
  return {
    subject: `Nowa opinia o kursie „${input.courseTitle}"`,
    html: layout(
      "Nowa opinia o obserwowanym kursie",
      `<p style="font-size:14px;line-height:1.6">Pojawiła się nowa opinia o kursie
        <a href="${absoluteUrl(`/kursy/${input.courseSlug}#opinie`)}" style="color:#18181b">${input.courseTitle}</a>,
        który obserwujesz.</p>
       <p style="font-size:12px;color:#71717a">Aby przestać obserwować, otwórz stronę kursu i kliknij „Obserwujesz".</p>`,
    ),
  };
}
