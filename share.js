const fs = require("fs");
const path = require("path");

const ROOT =
  path.join(
    process.env.HOME,
    ".config/shiro-theme"
  );

const CURRENT_THEME =
  fs.readFileSync(
    path.join(ROOT, "current-theme"),
    "utf8"
  ).trim();

const theme =
  JSON.parse(
    fs.readFileSync(
      path.join(
        ROOT,
        "themes",
        `${CURRENT_THEME}.json`
      ),
      "utf8"
    )
  );

const wallpaperVideo =
  path.join(
    process.env.HOME,
    "Imágenes",
    "Wallpapers",
    `${CURRENT_THEME}.mp4`
  );

const wallpaperImage =
  path.join(
    process.env.HOME,
    "Imágenes",
    "Wallpapers",
    `${CURRENT_THEME}.png`
  );

module.exports = {
  ROOT,
  CURRENT_THEME,
  theme,
  wallpaperVideo,
  wallpaperImage,
};