const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const {
  theme,
  LIMINE_DIR,
  wallpaperImage,
} = require("../shared");

//
// Root check
//

if (process.getuid() !== 0) {
  console.warn(
    "⚠️  Limine theme skipped (not root) — run with sudo to apply Limine"
  );
  return;
}

//
// Find limine.conf — lives in the ESP. LIMINE_CONF overrides the search.
//

const CANDIDATES = ["/boot", "/efi", "/boot/efi"].flatMap((base) =>
  [
    "limine.conf",
    "limine/limine.conf",
    "EFI/BOOT/limine.conf",
    "EFI/limine/limine.conf",
  ].map((rel) => path.join(base, rel))
);

const LIMINE_CONF =
  process.env.LIMINE_CONF ||
  CANDIDATES.find((file) => fs.existsSync(file));

if (!LIMINE_CONF || !fs.existsSync(LIMINE_CONF)) {
  console.warn(
    "⚠️  Limine theme skipped — limine.conf not found (¿el sistema usa GRUB?)"
  );
  return;
}

// With the config hash enrolled into the Limine binary (Secure Boot), any
// edit to limine.conf makes the system unbootable until it is re-enrolled.
const DEFAULT_LIMINE = "/etc/default/limine";
if (
  fs.existsSync(DEFAULT_LIMINE) &&
  /^\s*ENABLE_ENROLL_LIMINE_CONFIG\s*=\s*"?yes"?/m.test(
    fs.readFileSync(DEFAULT_LIMINE, "utf8")
  )
) {
  console.warn(
    "⚠️  Limine theme skipped — ENABLE_ENROLL_LIMINE_CONFIG=yes: editar limine.conf sin re-enrolar el hash impediría arrancar"
  );
  return;
}

//
// Paths
//

const CONF_DIR = path.dirname(LIMINE_CONF);
const INSTALL_DIR = path.join(CONF_DIR, "shiro-limine");

// boot():/ is the root of the partition that holds limine.conf
const mountPoint = execSync(
  `findmnt -n -o TARGET --target "${CONF_DIR}"`
).toString().trim();

const wallpaperBootPath =
  "boot():/" +
  path.relative(mountPoint, path.join(INSTALL_DIR, "background.png"));

const hex = (color) => color.replace("#", "");

//
// Wallpaper
//

if (!fs.existsSync(wallpaperImage)) {
  console.error(
    `Wallpaper not found:\n${wallpaperImage}`
  );
  process.exit(1);
}

fs.mkdirSync(LIMINE_DIR, { recursive: true });
fs.copyFileSync(wallpaperImage, path.join(LIMINE_DIR, "background.png"));

console.log("✓ Limine wallpaper updated");

//
// theme.conf — global options block inserted into limine.conf
//

const BEGIN = "# >>> shiro-limine: AUTO GENERATED por shiro-theme — no editar hasta la marca de cierre";
const END = "# <<< shiro-limine";

const options = {
  wallpaper: wallpaperBootPath,
  wallpaper_style: "stretched",
  backdrop: hex(theme.base),

  interface_branding: "Shiro",
  interface_branding_colour: hex(theme.primary),
  interface_help_colour: hex(theme.subtext0),
  interface_help_colour_bright: hex(theme.accent0),

  // black, red, green, brown, blue, magenta, cyan, gray
  term_palette: [
    theme.crust, theme.danger, theme.success, theme.warning,
    theme.primary, theme.accent1, theme.info, theme.subtext0,
  ].map(hex).join(";"),
  term_palette_bright: [
    theme.overlay1, theme.danger, theme.success, theme.warning,
    theme.primaryAlt, theme.accent2, theme.accent0, theme.text,
  ].map(hex).join(";"),

  // TTRRGGBB: ff = fully transparent, the wallpaper shows behind the menu
  term_background: `ff${hex(theme.base)}`,
  term_foreground: hex(theme.text),
  term_background_bright: hex(theme.surface1),
  term_foreground_bright: hex(theme.accent3),
};

const block = [
  BEGIN,
  ...Object.entries(options).map(([key, value]) => `${key}: ${value}`),
  END,
].join("\n");

fs.writeFileSync(path.join(LIMINE_DIR, "theme.conf"), `${block}\n`);

console.log("✓ theme.conf generated");

// Files written as root inside the user's repo stay owned by the user
if (process.env.SUDO_UID && process.env.SUDO_GID) {
  const owned = [".", ...fs.readdirSync(LIMINE_DIR).filter((f) => f !== ".git")];
  for (const file of owned) {
    fs.chownSync(
      path.join(LIMINE_DIR, file),
      Number(process.env.SUDO_UID),
      Number(process.env.SUDO_GID)
    );
  }
}

//
// Install wallpaper into the ESP
//

console.log("");
console.log("Installing Limine theme...");

fs.rmSync(INSTALL_DIR, { recursive: true, force: true });
fs.mkdirSync(INSTALL_DIR, { recursive: true });
fs.copyFileSync(
  path.join(LIMINE_DIR, "background.png"),
  path.join(INSTALL_DIR, "background.png")
);

console.log(`✓ Wallpaper copied to ${INSTALL_DIR}`);

//
// Update limine.conf
//

function applyBlock(content) {
  // 1. Drop the previous shiro-limine block
  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  content = content.replace(
    new RegExp(`^# >>> shiro-limine.*?^${escape(END)}\\n?`, "ms"),
    ""
  );

  // 2. Comment out the same options set by the distro in the global section
  //    (everything before the first "/Entry" line)
  const lines = content.split("\n");
  const firstEntry = lines.findIndex((line) => /^\s*\//.test(line));
  const globalEnd = firstEntry === -1 ? lines.length : firstEntry;

  for (let i = 0; i < globalEnd; i++) {
    const match = lines[i].match(/^\s*([a-z_]+)\s*:/);
    // Limine accepts both spellings: interface_branding_color / _colour
    if (match && match[1].replace(/color/g, "colour") in options) {
      lines[i] = `# (shiro-limine) ${lines[i]}`;
    }
  }

  // 3. The block goes first: global options must precede the entries
  return `${block}\n\n${lines.join("\n").replace(/^\n+/, "")}`;
}

const original = fs.readFileSync(LIMINE_CONF, "utf8");

// .shiro-orig keeps the distro version from before the first run
if (!fs.existsSync(`${LIMINE_CONF}.shiro-orig`)) {
  fs.copyFileSync(LIMINE_CONF, `${LIMINE_CONF}.shiro-orig`);
}
fs.copyFileSync(LIMINE_CONF, `${LIMINE_CONF}.bak`);
fs.writeFileSync(LIMINE_CONF, applyBlock(original));

console.log(`✓ Updated ${LIMINE_CONF} (backups: .bak, .shiro-orig)`);

console.log("");
console.log(`✓ Theme applied: ${theme.name}`);
