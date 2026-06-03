const fs = require("fs");
const path = require("path");

const HOME =
  process.env.SUDO_USER
    ? `/home/${process.env.SUDO_USER}`
    : process.env.HOME;

const ROOT =
  path.join(
    HOME,
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
    ROOT,
    "wallpapers",
    `${CURRENT_THEME}.mp4`
  );

const wallpaperImage =
  path.join(
    ROOT,
    "wallpapers",
    `${CURRENT_THEME}.png`
  );

function stripHash(color) {
  if (!color) return "000000";
  return color.replace("#", "");
}

module.exports = {
  fs,
  path,
  HOME,
  ROOT,
  CURRENT_THEME,
  theme,
  stripHash,
  wallpaperVideo,
  wallpaperImage,
};