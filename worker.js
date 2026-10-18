function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

function normalizeDigits(value) {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
}

function findText(payload) {
  if (typeof payload === "string") return payload;
  if (!payload || typeof payload !== "object") return "";
  for (const key of ["message", "body", "text", "sms", "content", "messageBody", "msg"]) {
    if (typeof payload[key] === "string" && payload[key].trim()) return payload[key].trim();
  }
  return "";
}

function findSender(payload) {
  if (!payload || typeof payload !== "object") return null;
  for (const key of ["sender", "from", "address", "phone", "originator", "senderAddress"]) {
    if (typeof payload[key] === "string" && payload[key].trim()) return payload[key].trim().slice(0, 100);
  }
  return null;
}

function parseTransfer(message) {
  const normalized = normalizeDigits(message);
  if (!/تحويل/.test(normalized) || !/دينار/.test(normalized) || !/(نجاح|بنجاح|رصيدك)/.test(normalized)) {
    return { matched: false, amount: null, senderPhone: null };
  }
  const match = normalized.match(/تحويل\s+([0-9]+(?:[.,][0-9]{1,3})?)\s+دينار[\s\S]{0,180}?من\s+الرقم\s+([+0-9]{7,20})/);
  if (!match) return { matched: true, amount: null, senderPhone: null };
  const amount = Number(match[1].replace(",", "."));
  return {
    matched: true,
    amount: Number.isFinite(amount) && amount > 0 ? amount : null,
    senderPhone: match[2]
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/libyana-sms") {
      if (request.method === "GET") {
        return json({ ok: true, endpoint: "libyana-sms", message: "Webhook is online. Send authenticated POST requests to receive SMS notifications." });
      }
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }

      const expectedToken = env.LIBYANA_WEBHOOK_TOKEN;
      if (!expectedToken) return json({ error: "Webhook is not configured" }, 503);
      const suppliedToken =
        request.headers.get("x-webhook-token") ||
        request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
        "";
      if (suppliedToken !== expectedToken) return json({ error: "Unauthorized" }, 401);

      if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        return json({ error: "Storage is not configured" }, 503);
      }

      let payload;
      const contentType = request.headers.get("content-type") || "";
      try {
        if (contentType.includes("application/json")) {
          payload = await request.json();
        } else {
          const form = await request.formData();
          payload = Object.fromEntries(form.entries());
        }
      } catch {
        return json({ error: "Invalid request body" }, 400);
      }

      const message = findText(payload);
      if (!message || message.length > 5000) {
        return json({ error: "SMS message is missing or too long" }, 400);
      }

      const parsed = parseTransfer(message);
      if (!parsed.matched) {
        return json({ ok: true, ignored: true, reason: "Not a Libyana transfer confirmation" });
      }

      const record = {
        source: findSender(payload),
        raw_message: message,
        amount: parsed.amount,
        sender_phone: parsed.senderPhone,
        parse_status: parsed.amount !== null && parsed.senderPhone ? "parsed" : "needs_review",
        status: "received"
      };

      let response;
      try {
        response = await fetch(
          env.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/libyana_sms_inbox",
          {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "apikey": env.SUPABASE_SERVICE_ROLE_KEY,
              "authorization": "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY,
              "prefer": "return=minimal"
            },
            body: JSON.stringify(record)
          }
        );
      } catch {
        return json({ error: "Could not save SMS" }, 502);
      }

      if (!response.ok) {
        return json({ error: "Could not save SMS", storageStatus: response.status }, 502);
      }

      // Receiving an SMS is not, by itself, enough to credit a wallet.
      // Wallet crediting will be added only after matching and idempotency checks.
      return json({ ok: true, received: true, parsed: record.parse_status, credited: false }, 202);
    }

    return env.ASSETS.fetch(request);
  }
};
