const {
  fs,
  path,
  theme,
  stripHash,
  wallpaperVideo,
  wallpaperImage,
} = require("../shared");

const content = `# AUTO GENERATED

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
  path.join(
    process.env.HOME,
    ".config/hypr/conf/colors.conf"
  ),
  content
);

console.log("✓ Hyprland");