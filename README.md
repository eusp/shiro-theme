# Shiro Theme

Sistema de temas centralizado para el escritorio Hyprland. Aplica un tema de forma simultánea a AGS, Hyprland, SDDM y GRUB desde un único archivo JSON. Soporta cambio de tema en caliente desde el widget de AGS sin reiniciar nada.

## Temas disponibles

| Tema | Descripción |
|------|-------------|
| `frozen-rukia` | Azul hielo profundo — frío y minimalista |
| `cyberpunk` | Neón vibrante sobre fondo oscuro |
| `kurisu-neon` | Inspirado en el anime, violeta y cyan |
| `violet-night` | Púrpura oscuro, elegante |

## Uso rápido

### Desde AGS (hot-reload)

El RightMenu de AGS incluye un selector de temas integrado. Cada tarjeta de tema tiene dos íconos — animado (`.mp4`) y estático (`.png`) — que aplican ese tema con el fondo en el modo elegido. Al hacer clic:

1. Los colores de AGS cambian instantáneamente (sin reiniciar).
2. `build.js` se ejecuta en segundo plano — actualiza AGS y Hyprland. Si además tenés permisos de escritura en `/usr/share/sddm` (por ejemplo corriendo `manage.sh` con `sudo`), también actualiza SDDM; si no, lo salta con un aviso sin frenar el resto.
3. Hyprland recarga su configuración → los bordes de ventana cambian al color del nuevo tema.
4. El fondo de pantalla se recarga via `~/.config/hypr/scripts/change-wallpaper.sh`, respetando el modo (animado/estático) que hayas elegido — guardado en `wallpaper-mode`.
5. GRUB se actualiza con `sudo -n node build-grub.js` (requiere regla sudoers, ver abajo).

`build.js` nunca toca GRUB directamente — eso es trabajo exclusivo de `build-grub.js`, porque escribir en `/boot` necesita root y `build.js` está pensado para correr sin privilegios (así el hot-reload desde AGS no se cae).

### Desde terminal

```bash
sudo bash manage.sh
```

Menú interactivo con opciones:
1. **Actualizar repositorios** — hace `git pull` en ags, hypr, grub-theme y sddm. Si hay cambios locales en conflicto, pregunta si sobrescribirlos o dejar ese repo como está.
2. **Aplicar tema** — selecciona un tema y lo genera
3. **Actualizar + Aplicar** — combina las dos anteriores
4. **Subir cambios a GitHub** — revisa shiro-theme, ags, hypr, grub-theme y sddm; si hay cambios sin confirmar te pregunta el mensaje de commit, y sube (`git push`) lo que esté adelantado al remoto
5. **Salir**

También puedes aplicar solo un builder específico:

```bash
node builders/ags.js       # Solo AGS (colors.scss)
node builders/hyprland.js  # Solo Hyprland
node builders/sddm.js      # Solo SDDM
sudo node build-grub.js    # Solo GRUB (requiere root)
```

O cambiar el tema activo directamente:

```bash
echo "cyberpunk" > current-theme
node build.js              # Todo excepto GRUB
sudo node build-grub.js    # GRUB por separado
```

## Estructura

```
shiro-theme/
├── themes/            # Paletas de color en JSON
│   ├── frozen-rukia.json
│   ├── cyberpunk.json
│   ├── kurisu-neon.json
│   └── violet-night.json
├── wallpapers/        # Wallpaper por tema (.png y/o .mp4)
├── builders/          # Generadores por target
│   ├── ags.js         → ~/.config/ags/styles/colors.scss
│   ├── hyprland.js    → ~/.config/hypr/conf/colors.lua + wallpapers/
│   ├── sddm.js        → /usr/share/sddm/themes/silent/
│   └── grub.js        → ~/.config/grub-theme/
├── shared.js          # Lee current-theme y exporta el JSON
├── build.js           # Ejecuta builders de AGS, Hyprland y SDDM (sin root)
├── build-grub.js      # Ejecuta solo el builder de GRUB (requiere sudo)
├── manage.sh          # Menú de administración interactivo
├── current-theme      # Nombre del tema activo (texto plano)
└── wallpaper-mode     # "animated" o "static" — qué fondo usar (texto plano)
```

## Cómo funciona el hot-reload de colores

Los colores de AGS se definen como **CSS custom properties** (variables CSS nativas) en `styles/colors.scss`. Al cambiar de tema desde el widget:

1. Se carga el JSON del nuevo tema.
2. Se genera un bloque CSS con todas las variables (`--primary`, `--base`, `--primary-rgb`, etc.).
3. Se inyecta vía `Gtk.CssProvider` con prioridad 900, que supera la prioridad de carga de AGS (800), sobreescribiendo los valores al instante.

El SCSS no usa variables de Sass (`$var`) — usa `var(--var)` directamente, lo que permite este override en runtime.

## Crear un tema nuevo

1. Crea `themes/mi-tema.json` con las variables de color:

```json
{
  "name": "Mi Tema",
  "base": "#0a0a0f",
  "text": "#e0e0f0",
  "subtext0": "#a0a8c0",
  "surface0": "#10101a",
  "surface1": "#181828",
  "surface2": "#202035",
  "overlay0": "#1a1a30",
  "overlay1": "#252545",
  "primary": "#7b9fff",
  "primaryAlt": "#aabfff",
  "primaryMuted": "#4a6fd0",
  "danger": "#c06080",
  "warning": "#c0a060",
  "success": "#60a080",
  "info": "#80c0ff",
  "accent0": "#d0e0ff",
  "accent1": "#90b0ff",
  "accent2": "#b8d0ff",
  "accent3": "#f0f4ff",
  "mantle": "#060610",
  "crust": "#020208"
}
```

2. Agrega `wallpapers/mi-tema.png` (y opcionalmente `mi-tema.mp4` para fondo animado).
3. Selecciónalo desde el widget de AGS o con `echo "mi-tema" > current-theme && node build.js`.

## Configuración de GRUB sin contraseña (desde AGS)

Para que el widget de AGS pueda aplicar el tema de GRUB automáticamente al cambiar tema, necesitas una regla sudoers que permita ejecutar `build-grub.js` sin contraseña:

```bash
sudo sh -c 'echo "emerson ALL=(ALL) NOPASSWD: /usr/bin/node /home/emerson/.config/shiro-theme/build-grub.js" > /etc/sudoers.d/shiro-grub && chmod 440 /etc/sudoers.d/shiro-grub'
```

Verifica que la ruta de Node coincida con tu sistema:

```bash
which node   # debe ser /usr/bin/node
```

Sin esta regla, el GRUB no se actualiza desde el widget (el resto del tema sí aplica). Siempre puedes aplicarlo manualmente con `sudo node build-grub.js`.

## Requisitos

- Node.js
- AGS v2 (`ags`) con soporte GTK4/GJS
- Hyprland con `mpvpaper` (fondos de video) y/o `hyprpaper` (fondos estáticos)
- SDDM con el tema `silent`
- GRUB (para el builder de grub)
