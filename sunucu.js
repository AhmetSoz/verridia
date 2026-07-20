/* VERRIDIA — mini yerel sunucu. Çalıştır: node sunucu.js (ya da baslat.bat) */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const KOK = path.join(__dirname, "site");
const PORT = 4173;
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".mp4": "video/mp4", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".ico": "image/x-icon", ".json": "application/json"
};

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/index.html";
  const dosya = path.join(KOK, p);
  if (!dosya.startsWith(KOK)) { res.writeHead(403); return res.end(); }
  fs.stat(dosya, (hata, st) => {
    if (hata || !st.isFile()) { res.writeHead(404); return res.end("404"); }
    const uz = path.extname(dosya).toLowerCase();
    // mp4 için Range desteği (video sarma/atlama)
    const range = req.headers.range;
    if (range && uz === ".mp4") {
      const [b, s] = range.replace(/bytes=/, "").split("-");
      const bas = parseInt(b, 10) || 0;
      const son = s ? parseInt(s, 10) : st.size - 1;
      res.writeHead(206, {
        "Content-Range": `bytes ${bas}-${son}/${st.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": son - bas + 1,
        "Content-Type": "video/mp4"
      });
      fs.createReadStream(dosya, { start: bas, end: son }).pipe(res);
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[uz] || "application/octet-stream", "Content-Length": st.size, "Cache-Control": "no-cache" });
    fs.createReadStream(dosya).pipe(res);
  });
}).listen(PORT, () => {
  const adres = `http://localhost:${PORT}`;
  console.log("VERRIDIA yayında → " + adres + "   (kapatmak için Ctrl+C)");
  exec(`start ${adres}`); // Windows: tarayıcıyı aç
});
