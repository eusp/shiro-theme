const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { PNG } = require("pngjs");

const {
  theme,
  wallpaperImage,
} = require("../shared");

//
// Root check
//

if (process.getuid() !== 0) {
  console.error(
    "This script must be run with sudo"
  );
  process.exit(1);
}

//
// Paths
//

const HOME =
  process.env.SUDO_USER
    ? `/home/${process.env.SUDO_USER}`
    : process.env.HOME;

const SOURCE_DIR =
  path.join(
    HOME,
    ".config/grub-theme"
  );

const INSTALL_DIR =
  "/boot/grub2/themes/Matrices-circle-window";

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

terminal-box: "terminal_box_*.png"

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

const borderColor =
  hexToRgb(theme.primaryMuted);

//
// select_c.png
//

savePng(
  path.join(
    SOURCE_DIR,
    "select_c.png"
  ),
  113,
  12,
  (x, y) => {

    const border =
      y >= 10;

    return {
      r: border
        ? borderColor.r
        : primaryColor.r,

      g: border
        ? borderColor.g
        : primaryColor.g,

      b: border
        ? borderColor.b
        : primaryColor.b,

      a: 255,
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
  16,
  24,
  (x, y) => {

    const draw =
      x < 10 ||
      y < 18;

    return {
      r: draw
        ? primaryColor.r
        : 0,

      g: draw
        ? primaryColor.g
        : 0,

      b: draw
        ? primaryColor.b
        : 0,

      a: draw
        ? 255
        : 0,
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
  16,
  24,
  (x, y) => {

    const draw =
      x > 5 ||
      y < 18;

    return {
      r: draw
        ? primaryColor.r
        : 0,

      g: draw
        ? primaryColor.g
        : 0,

      b: draw
        ? primaryColor.b
        : 0,

      a: draw
        ? 255
        : 0,
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

fs.cpSync(
  SOURCE_DIR,
  INSTALL_DIR,
  {
    recursive: true,
    force: true,
  }
);

console.log(
  "✓ Theme copied"
);

//
// Rebuild grub.cfg
//

console.log("");
console.log(
  "Updating grub.cfg..."
);

execSync(
  "grub2-mkconfig -o /boot/grub2/grub.cfg",
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