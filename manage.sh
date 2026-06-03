#!/usr/bin/env bash

set -e

AGS_DIR="$HOME/.config/ags"
HYPR_DIR="$HOME/.config/hypr"
SDDM_DIR="/usr/share/sddm/themes/silent"

THEME_DIR="$HOME/.config/shiro-theme"
BUILD_SCRIPT="$THEME_DIR/build.ts"

clear

echo "====================================="
echo "        SHIRO THEME MANAGER"
echo "====================================="
echo
echo "1) Actualizar repositorios"
echo "2) Aplicar tema"
echo "3) Actualizar + Aplicar tema"
echo "4) Salir"
echo

read -rp "Opción: " OPTION

update_repo() {
local DIR="$1"

echo
echo "-------------------------------------"
echo "Actualizando: $DIR"
echo "-------------------------------------"

if [ -d "$DIR/.git" ]; then
    git -C "$DIR" pull
else
    echo "No es un repositorio git"
fi

}

apply_theme() {
echo
echo "-------------------------------------"
echo "Aplicando tema..."
echo "-------------------------------------"

node "$BUILD_SCRIPT"

echo
echo "Tema aplicado correctamente"

}

update_all() {
update_repo "$AGS_DIR"
update_repo "$HYPR_DIR"

echo
echo "-------------------------------------"
echo "Actualizando SDDM"
echo "-------------------------------------"

sudo git -C "$SDDM_DIR" pull

}

case "$OPTION" in
1)
update_all
;;
2)
apply_theme
;;
3)
update_all
apply_theme
;;
4)
exit 0
;;
*)
echo "Opción inválida"
exit 1
;;
esac

echo
echo "Proceso completado"
echo
