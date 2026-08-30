const express = require("express");
const links = require("./links.json");

const app = express();
const PORT = process.env.PORT || 3000;

const PIXEL_ID = "2262195624324094";
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

// Meta Graph API version
const META_API_VERSION = "v23.0";

function cleanId(value) {
  return String(value || "").replace(/^\/+|\/+$/g, "");
}

app.get("/", (req, res) => {
  res.type("html").send(`
    <h2>WhatsApp Link Redirector</h2>
    <p>Use a link like <code>/MGmsg1</code></p>
  `);
});

app.get("/:id", async (req, res) => {
  try {
    const id = cleanId(req.params.id);
    const item = links[id];

    if (!item || !item.number) {
      return res.status(404).send("Link not found");
    }

    const number = String(item.number).replace(/\D/g, "");
    const message = item.message ? String(item.message) : "";

    const whatsappUrl =
      "https://wa.me/" +
      number +
      (message ? "?text=" + encodeURIComponent(message) : "");

    // --------------------------------
    // Tracking parameters
    // --------------------------------

    const utmSource = String(req.query.utm_source || "");
    const utmMedium = String(req.query.utm_medium || "");
    const utmCampaign = String(req.query.utm_campaign || "");
    const utmContent = String(req.query.utm_content || "");
    const utmTerm = String(req.query.utm_term || "");
    const fbclid = String(req.query.fbclid || "");

    // --------------------------------
    // Facebook click ID (_fbc)
    // --------------------------------

    let fbc = "";

    if (fbclid) {
      fbc = `fb.1.${Date.now()}.${fbclid}`;
    }

    // --------------------------------
    // Request information
    // --------------------------------

    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket.remoteAddress ||
      "";

    const userAgent = req.headers["user-agent"] || "";

    // --------------------------------
    // Unique Event ID
    // --------------------------------

    const eventId =
      "wa_" +
      Date.now() +
      "_" +
      Math.random().toString(36).substring(2, 12);

    // --------------------------------
    // Meta CAPI Event
    // --------------------------------

    if (META_ACCESS_TOKEN) {
      const eventData = {
        data: [
          {
            event_name: "WhatsAppClick",

            event_time: Math.floor(Date.now() / 1000),

            event_id: eventId,

            action_source: "website",

            event_source_url: `https://${req.headers.host}/${id}`,

            user_data: {
              client_ip_address: clientIp,
              client_user_agent: userAgent,

              ...(fbc ? { fbc: fbc } : {})
            },

            custom_data: {
              link_id: id,

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

      console.log("Meta CAPI status:", metaResponse.status);
      console.log("Meta CAPI response:", metaResult);
    } else {
      console.error("META_ACCESS_TOKEN is missing");
    }

    // --------------------------------
    // Direct WhatsApp Redirect
    // --------------------------------

    return res.redirect(302, whatsappUrl);

  } catch (error) {
    console.error("Redirect/CAPI error:", error);

    // Even if Meta API fails,
    // still send user to WhatsApp.

    const id = cleanId(req.params.id);
    const item = links[id];

    if (item && item.number) {
      const number = String(item.number).replace(/\D/g, "");
      const message = item.message ? String(item.message) : "";

      const whatsappUrl =
        "https://wa.me/" +
        number +
        (message ? "?text=" + encodeURIComponent(message) : "");

      return res.redirect(302, whatsappUrl);
    }

    return res.status(500).send("Something went wrong");
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
