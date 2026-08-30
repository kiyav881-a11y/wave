const express = require("express");
const links = require("./links.json");

const app = express();
const PORT = process.env.PORT || 3000;

function cleanId(value) {
  return String(value || "").replace(/^\/+|\/+$/g, "");
}

app.get("/", (req, res) => {
  res.type("html").send(`
    <h2>WhatsApp Link Redirector</h2>
    <p>Use a link like <code>/MGmsg1</code></p>
  `);
});

app.get("/:id", (req, res) => {
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

  res.type("html").send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">

      <title>Connecting...</title>

      <!-- Meta Pixel -->
      <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');

        fbq('init', '2262195624324094');
        fbq('track', 'PageView');
        fbq('trackCustom', 'WhatsAppClick');
      </script>

      <noscript>
        <img height="1" width="1" style="display:none"
        src="https://www.facebook.com/tr?id=2262195624324094&ev=PageView&noscript=1"/>
      </noscript>

      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding-top: 80px;
        }
      </style>
    </head>

    <body>
      <h2>Connecting to WhatsApp...</h2>
      <p>Please wait...</p>

      <script>
        setTimeout(function() {
          window.location.href = ${JSON.stringify(whatsappUrl)};
        }, 800);
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
