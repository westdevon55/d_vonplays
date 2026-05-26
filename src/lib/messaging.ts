// Pluggable email/SMS senders. Real implementations slot in here behind the
// same interface; when keys are missing, the dev sender logs to console.

type SendEmail = (to: string, subject: string, body: string) => Promise<void>;
type SendSms = (to: string, body: string) => Promise<void>;

export const sendEmail: SendEmail = async (to, subject, body) => {
  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "no-reply@example.com",
        to,
        subject,
        text: body,
      }),
    });
    if (!res.ok) {
      throw new Error(`Email send failed (${res.status})`);
    }
    return;
  }
  // Dev fallback — no real send.
  console.info(`[email→${to}] ${subject}: ${body.slice(0, 80)}…`);
};

export const sendSms: SendSms = async (to, body) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM_NUMBER) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const params = new URLSearchParams({
      To: to,
      From: TWILIO_FROM_NUMBER,
      Body: body,
    });
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    if (!res.ok) {
      throw new Error(`SMS send failed (${res.status})`);
    }
    return;
  }
  console.info(`[sms→${to}] ${body.slice(0, 80)}…`);
};
