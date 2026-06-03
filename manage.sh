#!/usr/bin/env bash

set -e

if [ -n "$SUDO_USER" ]; then
    USER_HOME="/home/$SUDO_USER"
else
    USER_HOME="$HOME"
fi

AGS_DIR="$USER_HOME/.config/ags"
HYPR_DIR="$USER_HOME/.config/hypr"
GRUB_DIR="$USER_HOME/.config/grub-theme"
SDDM_DIR="/usr/share/sddm/themes/silent"

THEME_DIR="$USER_HOME/.config/shiro-theme"
BUILD_SCRIPT="$THEME_DIR/build.js"

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

select_theme() {
    echo
    echo "-------------------------------------"
    echo "Seleccione un tema:"
    echo "-------------------------------------"

    local themes=()
    local i=1
    for theme_file in "$THEME_DIR/themes"/*.json; do
        if [ -f "$theme_file" ]; then
            local theme_name
            theme_name=$(basename "$theme_file" .json)
            themes+=("$theme_name")
            echo "$i) $theme_name"
            ((i++))
        fi
    done

    if [ ${#themes[@]} -eq 0 ]; then
        echo "No se encontraron temas en $THEME_DIR/themes"
        return 1
    fi

    echo
    local current_theme
    current_theme=$(cat "$THEME_DIR/current-theme")
    read -rp "Seleccione un número (Enter para mantener actual: $current_theme): " THEME_OPTION

    if [ -z "$THEME_OPTION" ]; then
        echo "Manteniendo tema actual: $current_theme"
        return 0
    fi

    if [[ "$THEME_OPTION" =~ ^[0-9]+$ ]] && [ "$THEME_OPTION" -ge 1 ] && [ "$THEME_OPTION" -le ${#themes[@]} ]; then
        local selected_theme="${themes[$((THEME_OPTION-1))]}"
        echo "$selected_theme" > "$THEME_DIR/current-theme"
        echo "Tema seleccionado: $selected_theme"
    else
        echo "Opción inválida. Manteniendo tema actual."
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
update_repo "$GRUB_DIR"

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
select_theme
apply_theme
;;
3)
update_all
select_theme
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
