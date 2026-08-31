const express = require("express");
const links = require("./links.json");

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================
// META CONFIG
// ========================================

const PIXEL_ID = "2262195624324094";
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const META_TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;
const META_API_VERSION = "v23.0";

// ========================================
// HELPERS
// ========================================

function cleanId(value) {
  return String(value || "").replace(/^\/+|\/+$/g, "");
}

function getFirst(value) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return String(value || "").split(",")[0].trim();
}

function createEventId() {
  return (
    "wa_" +
    Date.now() +
    "_" +
    Math.random().toString(36).substring(2, 12)
  );
}

// ========================================
// HOME
// ========================================

app.get("/", (req, res) => {
  res.status(200).type("html").send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>WhatsApp Link Redirector</title>
      </head>
      <body>
        <h2>WhatsApp Link Redirector</h2>
        <p>Use a link like <code>/MGmsg1</code></p>
      </body>
    </html>
  `);
});

// ========================================
// WHATSAPP REDIRECT + META CAPI
// ========================================

app.get("/:id", async (req, res) => {
  const id = cleanId(req.params.id);
  const item = links[id];

  // ----------------------------------------
  // Check link
  // ----------------------------------------

  if (!item || !item.number) {
    return res.status(404).send("Link not found");
  }

  const number = String(item.number).replace(/\D/g, "");
  const message = item.message ? String(item.message) : "";

  const whatsappUrl =
    "https://wa.me/" +
    number +
    (message ? "?text=" + encodeURIComponent(message) : "");

  // ----------------------------------------
  // Tracking parameters
  // ----------------------------------------

  const utmSource = String(req.query.utm_source || "");
  const utmMedium = String(req.query.utm_medium || "");
  const utmCampaign = String(req.query.utm_campaign || "");
  const utmContent = String(req.query.utm_content || "");
  const utmTerm = String(req.query.utm_term || "");

  const fbclid = String(req.query.fbclid || "");

  // ----------------------------------------
  // Facebook Click ID (_fbc)
  // ----------------------------------------

  let fbc = "";

  if (fbclid) {
    fbc = `fb.1.${Date.now()}.${fbclid}`;
  }

  // ----------------------------------------
  // Facebook Browser ID (_fbp)
  // ----------------------------------------

  let fbp =
    String(req.query._fbp || "") ||
    String(req.headers["x-fbp"] || "");

  // If cookie exists
  if (!fbp && req.headers.cookie) {
    const cookieMatch = req.headers.cookie.match(
      /(?:^|;\s*)_fbp=([^;]+)/
    );

    if (cookieMatch) {
      fbp = cookieMatch[1];
    }
  }

  // ----------------------------------------
  // Request information
  // ----------------------------------------

  const clientIp =
    getFirst(req.headers["x-forwarded-for"]) ||
    req.socket.remoteAddress ||
    "";

  const userAgent = req.headers["user-agent"] || "";

  // ----------------------------------------
  // Event ID
  // ----------------------------------------

  const eventId = createEventId();

  // ----------------------------------------
  // Event Source URL
  // ----------------------------------------

  const protocol =
    req.headers["x-forwarded-proto"] || "https";

  const host =
    req.headers["x-forwarded-host"] ||
    req.headers.host ||
    "";

  const eventSourceUrl =
    `${protocol}://${host}/${id}`;

  // ----------------------------------------
  // Meta CAPI
  // ----------------------------------------

  if (META_ACCESS_TOKEN) {
    try {
      const userData = {
        client_ip_address: clientIp,
        client_user_agent: userAgent
      };

      if (fbc) {
        userData.fbc = fbc;
      }

      if (fbp) {
        userData.fbp = fbp;
      }

      const eventData = {
        data: [
          {
            event_name: "Lead",

            event_time: Math.floor(Date.now() / 1000),

            event_id: eventId,

            action_source: "website",

            event_source_url: eventSourceUrl,

            user_data: userData,

            custom_data: {
              link_id: id,

              whatsapp_number: number,

              utm_source: utmSource,
              utm_medium: utmMedium,
              utm_campaign: utmCampaign,
              utm_content: utmContent,
              utm_term: utmTerm,

              fbclid: fbclid
            }
          }
        ]
      };
      if (META_TEST_EVENT_CODE) {
  eventData.test_event_code = META_TEST_EVENT_CODE;
      }

      const metaResponse = await fetch(
        `https://graph.facebook.com/${META_API_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(
          META_ACCESS_TOKEN
        )}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(eventData)
        }
      );

      const metaResult = await metaResponse.json();

      console.log("=================================");
      console.log("Meta CAPI Status:", metaResponse.status);
      console.log("Meta CAPI Response:", metaResult);
      console.log("Event ID:", eventId);
      console.log("Link ID:", id);
      console.log("=================================");

    } catch (metaError) {
      // Meta failure should NEVER stop WhatsApp redirect
      console.error(
        "Meta CAPI Error:",
        metaError.message || metaError
      );
    }
  } else {
    console.error(
      "META_ACCESS_TOKEN is missing in Vercel Environment Variables"
    );
  }

  // ----------------------------------------
  // Redirect to WhatsApp
  // ----------------------------------------

  return res.redirect(302, whatsappUrl);
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log(
    `WhatsApp Link Redirector running on port ${PORT}`
  );
});
