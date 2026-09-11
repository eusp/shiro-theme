#!/usr/bin/env bash

set -e

SCRIPT_DIR="$(cd -- "$(dirname -- "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
# shellcheck source=projects.sh
source "$SCRIPT_DIR/projects.sh"

BUILD_SCRIPT="$THEME_DIR/build.js"

clear

echo "====================================="
echo "        SHIRO THEME MANAGER"
echo "====================================="
echo
echo "1) Actualizar repositorios"
echo "2) Aplicar tema"
echo "3) Actualizar + Aplicar tema"
echo "4) Subir cambios a GitHub"
echo "5) Instalar / importar proyectos (install.sh)"
echo "6) Salir"
echo

read -rp "Opción: " OPTION

git_pull_confirm() {
local DIR="$1"
local AS_USER="$2"

local -a GIT_CMD
if [ -n "$AS_USER" ]; then
    GIT_CMD=(sudo -u "$AS_USER" git -c safe.directory="$DIR" -C "$DIR")
else
    GIT_CMD=(git -c safe.directory="$DIR" -C "$DIR")
fi

if "${GIT_CMD[@]}" pull; then
    return 0
fi

echo
echo "-------------------------------------"
echo "No se pudo actualizar $DIR (cambios locales en conflicto)."
echo "-------------------------------------"
read -rp "¿Sobrescribir los cambios locales y continuar? [s/N]: " OVERWRITE

if [[ ! "$OVERWRITE" =~ ^[sSyY]$ ]]; then
    echo "Actualización de $DIR detenida. Se mantienen los cambios locales."
    return 1
fi

echo "Sobrescribiendo cambios locales en $DIR..."
"${GIT_CMD[@]}" fetch

local BRANCH
BRANCH=$("${GIT_CMD[@]}" rev-parse --abbrev-ref HEAD)
"${GIT_CMD[@]}" reset --hard "origin/$BRANCH"

if "${GIT_CMD[@]}" pull; then
    echo "$DIR actualizado correctamente."
    return 0
else
    echo "No se pudo actualizar $DIR incluso después de sobrescribir."
    return 1
fi
}

update_repo() {
local DIR="$1"

echo
echo "-------------------------------------"
echo "Actualizando: $DIR"
echo "-------------------------------------"

if [ -d "$DIR/.git" ]; then
    if [ -n "$SUDO_USER" ]; then
        chown -R "$SUDO_USER:$SUDO_USER" "$DIR"
        git_pull_confirm "$DIR" "$SUDO_USER" || true
    else
        git_pull_confirm "$DIR" || true
    fi
else
    echo "No es un repositorio git"
fi

if [ -f "$DIR/install.sh" ]; then
    echo "Re-corriendo install.sh de $DIR (por si la actualización trajo dependencias nuevas)..."
    if [ -n "$SUDO_USER" ]; then
        sudo -u "$SUDO_USER" bash "$DIR/install.sh"
    else
        bash "$DIR/install.sh"
    fi
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
local entry
for entry in "${SHIRO_PROJECTS[@]}"; do
    update_repo "$(echo "$entry" | cut -d'|' -f3)"
done
}

push_repo() {
local DIR="$1"

if [ ! -d "$DIR/.git" ]; then
    return 0
fi

echo
echo "-------------------------------------"
echo "Revisando: $DIR"
echo "-------------------------------------"

local -a GIT_CMD
if [ -n "$SUDO_USER" ]; then
    chown -R "$SUDO_USER:$SUDO_USER" "$DIR"
    GIT_CMD=(sudo -u "$SUDO_USER" git -c safe.directory="$DIR" -C "$DIR")
else
    GIT_CMD=(git -c safe.directory="$DIR" -C "$DIR")
fi

local STATUS
STATUS=$("${GIT_CMD[@]}" status --porcelain)

if [ -n "$STATUS" ]; then
    echo "Cambios sin confirmar:"
    "${GIT_CMD[@]}" status --short
    read -rp "¿Confirmar y subir estos cambios? [s/N]: " CONFIRM

    if [[ ! "$CONFIRM" =~ ^[sSyY]$ ]]; then
        echo "Se omite $DIR."
        return 0
    fi

    read -rp "Mensaje de commit: " COMMIT_MSG
    [ -z "$COMMIT_MSG" ] && COMMIT_MSG="update"

    "${GIT_CMD[@]}" add -A
    if ! "${GIT_CMD[@]}" commit -m "$COMMIT_MSG"; then
        echo "Falló el commit en $DIR."
        return 1
    fi
fi

local BRANCH
BRANCH=$("${GIT_CMD[@]}" rev-parse --abbrev-ref HEAD)
local AHEAD
AHEAD=$("${GIT_CMD[@]}" rev-list --count "origin/$BRANCH..HEAD" 2>/dev/null)
AHEAD=${AHEAD:-0}

if [ "$AHEAD" = "0" ]; then
    echo "Nada para subir en $DIR."
    return 0
fi

echo "Subiendo $AHEAD commit(s) de $DIR..."
if "${GIT_CMD[@]}" push; then
    echo "$DIR subido correctamente."
else
    echo "Falló el push de $DIR."
fi

}

push_all() {
local dir
while read -r dir; do
    push_repo "$dir" || true
done < <(shiro_repo_dirs)
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
push_all
;;
5)
if [ -n "$SUDO_USER" ]; then
    exec sudo -u "$SUDO_USER" bash "$THEME_DIR/install.sh"
fi
exec bash "$THEME_DIR/install.sh"
;;
6)
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
