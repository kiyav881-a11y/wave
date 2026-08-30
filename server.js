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
    "https://wa.me/" + number +
    (message ? "?text=" + encodeURIComponent(message) : "");

  return res.redirect(302, whatsappUrl);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
