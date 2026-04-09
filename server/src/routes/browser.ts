import { Router } from "express";
import { exec } from "node:child_process";

export function browserRoutes() {
  const router = Router();

  router.post("/launch", async (_req, res) => {
    const url = (typeof _req.body?.url === "string" && _req.body.url) || "https://www.google.com";

    try {
      if (process.platform === "win32") {
        exec(`start "" "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" "${url}"`);
      } else if (process.platform === "darwin") {
        exec(`open -a "Google Chrome" "${url}"`);
      } else {
        exec(`google-chrome "${url}" || chromium-browser "${url}" || xdg-open "${url}"`);
      }
      res.json({ status: "ok", url });
    } catch (err) {
      res.status(500).json({ error: "Failed to launch browser" });
    }
  });

  return router;
}
