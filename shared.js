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

// current-theme y wallpaper-mode son de cada máquina y no van en git
// (.gitignore): si falta, se crea con el tema por defecto.
const DEFAULT_THEME = "frozen-rukia";
const CURRENT_THEME_FILE = path.join(ROOT, "current-theme");

if (!fs.existsSync(CURRENT_THEME_FILE)) {
  fs.writeFileSync(CURRENT_THEME_FILE, `${DEFAULT_THEME}\n`);
  if (process.env.SUDO_UID && process.env.SUDO_GID) {
    fs.chownSync(CURRENT_THEME_FILE, Number(process.env.SUDO_UID), Number(process.env.SUDO_GID));
  }
}

const CURRENT_THEME =
  fs.readFileSync(
    CURRENT_THEME_FILE,
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

// Carpetas reales de cada proyecto (mismo esquema que projects.sh).
// ~/.config/ags y ~/.config/hypr son symlinks a estas carpetas.
const AGS_DIR = path.join(HOME, ".config/shiro-ags");
const HYPR_DIR = path.join(HOME, ".config/shiro-hyprland");
const GRUB_DIR = path.join(HOME, ".config/shiro-grub");
const LIMINE_DIR = path.join(HOME, ".config/shiro-limine");
const SDDM_DIR = "/usr/share/sddm/themes/shiro-sddm";

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
  AGS_DIR,
  HYPR_DIR,
  GRUB_DIR,
  LIMINE_DIR,
  SDDM_DIR,
  theme,
  stripHash,
  wallpaperVideo,
  wallpaperImage,
};