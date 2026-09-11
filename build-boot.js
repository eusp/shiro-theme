const {
  CURRENT_THEME,
} = require("./shared");

// Each builder skips itself when its bootloader is not installed
require("./builders/grub");
require("./builders/limine");

console.log(`✓ Boot theme applied: ${CURRENT_THEME}`);
