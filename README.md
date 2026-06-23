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

El RightMenu de AGS incluye un selector de temas integrado. Al hacer clic en un tema:

1. Los colores de AGS cambian instantáneamente (sin reiniciar).
2. `build.js` se ejecuta en segundo plano — actualiza Hyprland, SDDM, GRUB.
3. Hyprland recarga su configuración → los bordes de ventana cambian al color del nuevo tema.
4. El fondo de pantalla se reemplaza automáticamente (`mpvpaper` para `.mp4`, `hyprpaper` para `.png`).

### Desde terminal

```bash
sudo bash manage.sh
```

Menú interactivo con opciones:
1. **Actualizar repositorios** — hace `git pull` en shiro-theme y ags
2. **Aplicar tema** — selecciona un tema y lo genera
3. **Actualizar + Aplicar** — combina las dos anteriores
4. **Salir**

También puedes aplicar solo un builder específico:

```bash
node builders/ags.js       # Solo AGS (colors.scss)
node builders/hyprland.js  # Solo Hyprland
node builders/sddm.js      # Solo SDDM
node builders/grub.js      # Solo GRUB
```

O cambiar el tema activo directamente:

```bash
echo "cyberpunk" > current-theme
node build.js
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
│   ├── hyprland.js    → ~/.config/hypr/conf/colors.conf + wallpapers/
│   ├── sddm.js        → /usr/share/sddm/themes/silent/
│   └── grub.js        → ~/.config/grub-theme/
├── shared.js          # Lee current-theme y exporta el JSON
├── build.js           # Ejecuta todos los builders
├── manage.sh          # Menú de administración interactivo
└── current-theme      # Nombre del tema activo (texto plano)
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

## Requisitos

- Node.js
- AGS v2 (`ags`) con soporte GTK4/GJS
- Hyprland con `mpvpaper` (fondos de video) y/o `hyprpaper` (fondos estáticos)
- SDDM con el tema `silent`
- GRUB (para el builder de grub)
