const fs = require("fs");
const path = require("path");

const ROOT = path.join(process.env.HOME, ".config/shiro-theme");

const CURRENT_THEME = fs
  .readFileSync(path.join(ROOT, "current-theme"), "utf8")
  .trim();

const themePath = path.join(
  ROOT,
  "themes",
  `${CURRENT_THEME}.json`
);

const theme = JSON.parse(
  fs.readFileSync(themePath, "utf8")
);

function stripHash(color) {
  if (!color) return "000000";
  return color.replace("#", "");
}

//
// Wallpapers
//

const wallpaperVideo =
  `${process.env.HOME}/Imágenes/Wallpapers/${CURRENT_THEME}.mp4`;

const wallpaperImage =
  `${process.env.HOME}/Imágenes/Wallpapers/${CURRENT_THEME}.png`;

//
// AGS
//

const ags = `// AUTO GENERATED

// Base
$base: ${theme.base};
$text: ${theme.text};
$subtext0: ${theme.subtext0};

// Surfaces
$surface0: ${theme.surface0};
$surface1: ${theme.surface1};
$surface2: ${theme.surface2};

// Overlays
$overlay0: ${theme.overlay0};
$overlay1: ${theme.overlay1};

// Primary
$primary: ${theme.primary};
$primary-alt: ${theme.primaryAlt};
$primary-muted: ${theme.primaryMuted};

// Semantic
$danger: ${theme.danger};
$warning: ${theme.warning};
$success: ${theme.success};
$info: ${theme.info};

// Accents
$accent0: ${theme.accent0};
$accent1: ${theme.accent1};
$accent2: ${theme.accent2};
$accent3: ${theme.accent3};

// Layers
$mantle: ${theme.mantle};
$crust: ${theme.crust};
`;

fs.writeFileSync(
  path.join(process.env.HOME, ".config/ags/styles/colors.scss"),
  ags
);

//
// HYPRLAND
//

const hypr = `# AUTO GENERATED

# Base
$base = rgb(${stripHash(theme.base)})
$text = rgb(${stripHash(theme.text)})
$subtext0 = rgb(${stripHash(theme.subtext0)})

# Surfaces
$surface0 = rgb(${stripHash(theme.surface0)})
$surface1 = rgb(${stripHash(theme.surface1)})
$surface2 = rgb(${stripHash(theme.surface2)})

# Overlays
$overlay0 = rgb(${stripHash(theme.overlay0)})
$overlay1 = rgb(${stripHash(theme.overlay1)})

# Primary
$primary = rgb(${stripHash(theme.primary)})
$primaryAlt = rgb(${stripHash(theme.primaryAlt)})
$primaryMuted = rgb(${stripHash(theme.primaryMuted)})

# Semantic
$danger = rgb(${stripHash(theme.danger)})
$warning = rgb(${stripHash(theme.warning)})
$success = rgb(${stripHash(theme.success)})
$info = rgb(${stripHash(theme.info)})

# Accents
$accent0 = rgb(${stripHash(theme.accent0)})
$accent1 = rgb(${stripHash(theme.accent1)})
$accent2 = rgb(${stripHash(theme.accent2)})
$accent3 = rgb(${stripHash(theme.accent3)})

# Layers
$mantle = rgb(${stripHash(theme.mantle)})
$crust = rgb(${stripHash(theme.crust)})

# Wallpapers
$backgroundmp4 = ${wallpaperVideo}
$background = ${wallpaperImage}
`;

fs.writeFileSync(
  path.join(process.env.HOME, ".config/hypr/conf/colors.conf"),
  hypr
);

//
// SDDM COLORS
//

const qml = `import QtQuick

QtObject {
    id: colors

    // Base
    readonly property color base: "${theme.base}"
    readonly property color text: "${theme.text}"
    readonly property color subtext0: "${theme.subtext0}"

    // Surfaces
    readonly property color surface0: "${theme.surface0}"
    readonly property color surface1: "${theme.surface1}"
    readonly property color surface2: "${theme.surface2}"

    // Overlays
    readonly property color overlay0: "${theme.overlay0}"
    readonly property color overlay1: "${theme.overlay1}"

    // Primary
    readonly property color primary: "${theme.primary}"
    readonly property color primaryAlt: "${theme.primaryAlt}"
    readonly property color primaryMuted: "${theme.primaryMuted}"

    // Semantic
    readonly property color danger: "${theme.danger}"
    readonly property color warning: "${theme.warning}"
    readonly property color success: "${theme.success}"
    readonly property color info: "${theme.info}"

    // Accents
    readonly property color accent0: "${theme.accent0}"
    readonly property color accent1: "${theme.accent1}"
    readonly property color accent2: "${theme.accent2}"
    readonly property color accent3: "${theme.accent3}"

    // Layers
    readonly property color mantle: "${theme.mantle}"
    readonly property color crust: "${theme.crust}"
}
`;

fs.writeFileSync(
  "/usr/share/sddm/themes/silent/components/Colors.qml",
  qml
);

//
// SDDM BACKGROUNDS
//

const sddmVideo =
  "/usr/share/sddm/themes/silent/backgrounds/background.mp4";

const sddmImage =
  "/usr/share/sddm/themes/silent/backgrounds/background.png";

try {
  if (fs.existsSync(wallpaperVideo)) {
    fs.copyFileSync(
      wallpaperVideo,
      sddmVideo
    );
    console.log("✓ MP4 copied to SDDM");
  } else {
    console.log("⚠ MP4 wallpaper not found");
  }

  if (fs.existsSync(wallpaperImage)) {
    fs.copyFileSync(
      wallpaperImage,
      sddmImage
    );
    console.log("✓ PNG copied to SDDM");
  } else {
    console.log("⚠ PNG wallpaper not found");
  }
} catch (err) {
  console.error("Failed to copy wallpapers:");
  console.error(err);
}

console.log("");
console.log(`Theme applied: ${CURRENT_THEME}`);
console.log(`Video: ${wallpaperVideo}`);
console.log(`Image: ${wallpaperImage}`);