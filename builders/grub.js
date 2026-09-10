const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { PNG } = require("pngjs");

const {
  theme,
  GRUB_DIR,
  wallpaperImage,
} = require("../shared");

//
// Root check
//

if (process.getuid() !== 0) {
  console.warn(
    "⚠️  GRUB theme skipped (not root) — run with sudo to apply GRUB"
  );
  return;
}

//
// GRUB check — CachyOS instala Limine por defecto; sin GRUB no hay nada que tocar
//

function findGrubMkconfig() {
  try {
    return execSync(
      "command -v grub2-mkconfig || command -v grub-mkconfig",
      { shell: "/bin/sh" }
    ).toString().trim();
  } catch (e) {
    return "";
  }
}

const grubMkconfig = findGrubMkconfig();

if (!grubMkconfig) {
  console.warn(
    "⚠️  GRUB theme skipped — grub-mkconfig not found (¿el sistema usa Limine/systemd-boot?)"
  );
  return;
}

//
// Paths
//

const SOURCE_DIR = GRUB_DIR;

const hasGrub2 = fs.existsSync("/boot/grub2");
const GRUB_BASE_DIR = hasGrub2 ? "/boot/grub2" : "/boot/grub";
const THEMES_DIR = path.join(GRUB_BASE_DIR, "themes");
const INSTALL_DIR = path.join(THEMES_DIR, "shiro-grub");

// Nombre anterior del tema instalado (antes del renombrado a shiro-grub)
const LEGACY_INSTALL_DIR = path.join(THEMES_DIR, "Matrices-circle-window");

//
// Ensure directories
//

fs.mkdirSync(
  SOURCE_DIR,
  {
    recursive: true,
  }
);

//
// Helpers
//

function hexToRgb(hex) {
  hex = hex.replace("#", "");

  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16),
  };
}

function savePng(
  file,
  width,
  height,
  drawPixel
) {
  const png = new PNG({
    width,
    height,
  });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {

      const idx =
        (width * y + x) << 2;

      const pixel =
        drawPixel(x, y);

      png.data[idx] = pixel.r;
      png.data[idx + 1] = pixel.g;
      png.data[idx + 2] = pixel.b;
      png.data[idx + 3] = pixel.a;
    }
  }

  fs.writeFileSync(
    file,
    PNG.sync.write(png)
  );
}

//
// Wallpaper
//

if (!fs.existsSync(wallpaperImage)) {
  console.error(
    `Wallpaper not found:\n${wallpaperImage}`
  );
  process.exit(1);
}

fs.copyFileSync(
  wallpaperImage,
  path.join(
    SOURCE_DIR,
    "background.png"
  )
);

console.log(
  "✓ GRUB wallpaper updated"
);

//
// Theme.txt
//

const themeTxt = `# AUTO GENERATED

title-text: ""

desktop-image: "background.png"
desktop-color: "${theme.base}"

terminal-font: "Terminus Regular 14"

terminal-left: "0"
terminal-top: "0"

terminal-width: "100%"
terminal-height: "100%"

terminal-border: "0"

+ boot_menu {

  left = 8%
  top = 30%

  width = 28%
  height = 54%

  item_font = "Unifont Regular 16"

  item_color = "${theme.subtext0}"

  selected_item_color = "${theme.accent3}"

  icon_width = 32
  icon_height = 32

  item_icon_space = 6

  item_height = 48

  item_padding = 3

  item_spacing = 6

  selected_item_pixmap_style = "select_*.png"
}

+ label {

  top = 83%
  left = 12%

  width = 34%

  align = "center"

  id = "__timeout__"

  text = "Booting in %d seconds"

  color = "${theme.accent0}"

  font = "Unifont Regular 16"
}
`;

fs.writeFileSync(
  path.join(
    SOURCE_DIR,
    "theme.txt"
  ),
  themeTxt
);

console.log(
  "✓ theme.txt generated"
);

//
// Select images
//

const primaryColor =
  hexToRgb(theme.primary);

//
// select_c.png
//

savePng(
  path.join(
    SOURCE_DIR,
    "select_c.png"
  ),
  16,
  48,
  (x, y) => {
    const dy = y - 23.5;
    const dist = Math.abs(dy);

    if (dist > 23.5) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }

    const isBorder = dist >= 21.5;

    return {
      r: primaryColor.r,
      g: primaryColor.g,
      b: primaryColor.b,
      a: isBorder ? 255 : 40,
    };
  }
);

//
// select_w.png
//

savePng(
  path.join(
    SOURCE_DIR,
    "select_w.png"
  ),
  24,
  48,
  (x, y) => {
    const dx = x - 23.5;
    const dy = y - 23.5;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 23.5) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }

    const isBorder = dist >= 21.5;

    return {
      r: primaryColor.r,
      g: primaryColor.g,
      b: primaryColor.b,
      a: isBorder ? 255 : 40,
    };
  }
);

//
// select_e.png
//

savePng(
  path.join(
    SOURCE_DIR,
    "select_e.png"
  ),
  24,
  48,
  (x, y) => {
    const dx = x - 0.5;
    const dy = y - 23.5;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 23.5) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }

    const isBorder = dist >= 21.5;

    return {
      r: primaryColor.r,
      g: primaryColor.g,
      b: primaryColor.b,
      a: isBorder ? 255 : 40,
    };
  }
);

console.log(
  "✓ Select images generated"
);

//
// Install theme
//

console.log("");
console.log(
  "Installing GRUB theme..."
);

// Clean install so removed files don't linger in /boot
// (grub-mkconfig runs loadfont on every *.pf2 in the theme dir)
for (const dir of [INSTALL_DIR, LEGACY_INSTALL_DIR]) {
  fs.rmSync(
    dir,
    {
      recursive: true,
      force: true,
    }
  );
}

// Repo-only files that don't belong in /boot
const SKIP_FILES = new Set([".git", ".gitignore", "README.md"]);

fs.cpSync(
  SOURCE_DIR,
  INSTALL_DIR,
  {
    recursive: true,
    force: true,
    filter: (src) => !SKIP_FILES.has(path.basename(src)),
  }
);

console.log(
  "✓ Theme copied"
);

//
// Update /etc/default/grub
//

function updateGrubConfig(themePath) {
  const configPath = "/etc/default/grub";
  if (!fs.existsSync(configPath)) {
    console.warn(`⚠️ Warning: ${configPath} not found. Skipping auto-configuration.`);
    return;
  }

  // Backup original config
  try {
    fs.copyFileSync(configPath, `${configPath}.bak`);
    console.log(`✓ Backed up ${configPath} to ${configPath}.bak`);
  } catch (err) {
    console.error(`⚠️ Warning: Failed to backup ${configPath}: ${err.message}`);
  }

  let content = fs.readFileSync(configPath, "utf8");
  let modified = false;

  // 1. Set GRUB_THEME
  const themeLine = `GRUB_THEME="${themePath}"`;
  if (content.match(/^GRUB_THEME=/m)) {
    content = content.replace(/^GRUB_THEME=.*/m, themeLine);
    modified = true;
  } else if (content.match(/^#\s*GRUB_THEME=/m)) {
    content = content.replace(/^#\s*GRUB_THEME=.*/m, themeLine);
    modified = true;
  } else {
    content += `\n${themeLine}\n`;
    modified = true;
  }

  // 2. Ensure GRUB_TERMINAL_OUTPUT is not console (gfxterm is required for themes)
  if (content.match(/^GRUB_TERMINAL_OUTPUT=['"]?console['"]?/m)) {
    content = content.replace(/^GRUB_TERMINAL_OUTPUT=['"]?console['"]?/m, 'GRUB_TERMINAL_OUTPUT="gfxterm"');
    modified = true;
  } else if (!content.match(/^GRUB_TERMINAL_OUTPUT=/m)) {
    content += `\nGRUB_TERMINAL_OUTPUT="gfxterm"\n`;
    modified = true;
  }

  // 3. Ensure GRUB_TIMEOUT_STYLE is set to menu instead of hidden, so the theme is visible
  if (content.match(/^GRUB_TIMEOUT_STYLE=['"]?hidden['"]?/m)) {
    content = content.replace(/^GRUB_TIMEOUT_STYLE=['"]?hidden['"]?/m, 'GRUB_TIMEOUT_STYLE="menu"');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(configPath, content, "utf8");
    console.log("✓ Updated /etc/default/grub configuration");
  }
}

const themeTxtPath = path.join(INSTALL_DIR, "theme.txt");
updateGrubConfig(themeTxtPath);

//
// Rebuild grub.cfg
//

console.log("");
console.log(
  "Updating grub.cfg..."
);

const grubCfgPath = path.join(GRUB_BASE_DIR, "grub.cfg");

execSync(
  `${grubMkconfig} -o ${grubCfgPath}`,
  {
    stdio: "inherit",
  }
);

console.log(
  "✓ grub.cfg updated"
);

console.log("");
console.log(
  `✓ Theme applied: ${theme.name}`
);