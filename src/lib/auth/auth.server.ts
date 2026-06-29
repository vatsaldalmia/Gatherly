import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber } from "better-auth/plugins";
import { getDb } from "../db/index.server";
import * as schema from "../db/schema";

// Call this inside server function handlers, never at module scope.
export function getAuth() {
  const db = getDb();

  const socialProviders: Record<string, unknown> = {};
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    socialProviders.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    plugins: [
      phoneNumber({
        sendOTP: async ({ phoneNumber: phone, code }) => {
          // Dev: print to server console so you can test without SMS credits
          if (process.env.NODE_ENV !== "production") {
            console.log(`\n📱 OTP for ${phone}: ${code}\n`);
            return;
          }
          // Production: send via Twilio
          // Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in .env
          const accountSid = process.env.TWILIO_ACCOUNT_SID;
          const authToken = process.env.TWILIO_AUTH_TOKEN;
          const fromPhone = process.env.TWILIO_PHONE_NUMBER;
          if (!accountSid || !authToken || !fromPhone) {
            console.error("Twilio env vars not set — OTP not sent");
            return;
          }
          const encoded = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
          await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${encoded}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              From: fromPhone,
              To: phone,
              Body: `Your Gatherly OTP is: ${code}. Valid for 5 minutes.`,
            }),
          });
        },
        otpLength: 6,
        expiresIn: 300,
      }),
    ],
    socialProviders,
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:8080",
    trustedOrigins: [
      process.env.BETTER_AUTH_URL ?? "http://localhost:8080",
      ...(process.env.NODE_ENV !== "production"
        ? ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080", "http://localhost:8081", "http://localhost:8082"]
        : []),
    ],
  });
}
