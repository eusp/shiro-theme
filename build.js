const {
  CURRENT_THEME,
} = require("./shared");

console.log("");
console.log("======================");
console.log(" SHIRO THEME BUILDER");
console.log("======================");
console.log("");

require("./builders/ags");
require("./builders/hyprland");
require("./builders/sddm");
require("./builders/grub");

console.log("");
console.log(`✓ Theme applied: ${CURRENT_THEME}`);
console.log("");