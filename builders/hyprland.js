const {
  fs,
  path,
  HOME,
  theme,
  wallpaperVideo,
  wallpaperImage,
} = require("../shared");

const targetDir = path.join(HOME, ".config/hypr/wallpapers");
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const targetImage = path.join(targetDir, path.basename(wallpaperImage));
const targetVideo = path.join(targetDir, path.basename(wallpaperVideo));

if (fs.existsSync(wallpaperImage)) {
  fs.copyFileSync(wallpaperImage, targetImage);
}

if (fs.existsSync(wallpaperVideo)) {
  fs.copyFileSync(wallpaperVideo, targetVideo);
}

const content = `-- AUTO GENERATED

return {
    -- Base
    base = "${theme.base}",
    text = "${theme.text}",
    subtext0 = "${theme.subtext0}",

    -- Surfaces
    surface0 = "${theme.surface0}",
    surface1 = "${theme.surface1}",
    surface2 = "${theme.surface2}",

    -- Overlays
    overlay0 = "${theme.overlay0}",
    overlay1 = "${theme.overlay1}",

    -- Primary
    primary = "${theme.primary}",
    primaryAlt = "${theme.primaryAlt}",
    primaryMuted = "${theme.primaryMuted}",

    -- Semantic
    danger = "${theme.danger}",
    warning = "${theme.warning}",
    success = "${theme.success}",
    info = "${theme.info}",

    -- Accents
    accent0 = "${theme.accent0}",
    accent1 = "${theme.accent1}",
    accent2 = "${theme.accent2}",
    accent3 = "${theme.accent3}",

    -- Layers
    mantle = "${theme.mantle}",
    crust = "${theme.crust}",

    -- Wallpapers
    backgroundmp4 = "${targetVideo}",
    background = "${targetImage}",
}
`;

fs.writeFileSync(
  path.join(
    HOME,
    ".config/hypr/conf/colors.lua"
  ),
  content
);

console.log("✓ Hyprland");