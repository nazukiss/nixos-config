// Configuración de la portada de nazukiss/nixos-config.
window.SITE_CONFIG = {
  username: "nazukiss",
  repository: "nixos-config",
  projectName: "nixos-config",
  tagline: "NixOS • Hyprland • Declarative Linux",
  description: "Mi configuración personal de NixOS: sistema declarativo, entorno Hyprland con Caelestia, herramientas de terminal y configuración del entorno de escritorio.",
  status: "ACTIVE DEVELOPMENT",
  version: "rolling",
  license: "Not specified",
  technologies: ["NixOS", "Nix Flakes", "Hyprland", "Caelestia", "Fish", "Git"],
  system: {
    os: "NixOS",
    distro: "NixOS Linux",
    desktop: "Hyprland + Caelestia",
    shell: "Fish",
    hardware: "Lenovo Legion 5 15ACH6H • Ryzen 7 5800H • RTX 3060 Laptop"
  },
  tree: [
    { name: "flake.nix", kind: "file", note: "Entrypoint de Nix Flakes" },
    { name: "flake.lock", kind: "file", note: "Versiones fijadas de dependencias" },
    { name: "configuration.nix", kind: "file", note: "Configuración principal del sistema" },
    { name: "hardware.nix", kind: "file", note: "Configuración de hardware" },
    { name: "hardware-configuration.nix", kind: "file", note: "Hardware generado por NixOS" },
    { name: "desktop.nix", kind: "file", note: "Configuración del escritorio" },
    { name: "home.nix", kind: "file", note: "Configuración del entorno de usuario" },
    { name: "packages.nix", kind: "file", note: "Paquetes del sistema" },
    { name: "services.nix", kind: "file", note: "Servicios de NixOS" },
    { name: "snapshots.nix", kind: "file", note: "Configuración de snapshots" },
    { name: "caelestia/", kind: "folder", note: "Hyprland, Fish, Fastfetch, Firefox y otras configuraciones" },
    { name: "site/", kind: "folder", note: "Web personal del repositorio" },
    { name: ".github/workflows/", kind: "folder", note: "Despliegue automático de GitHub Pages" }
  ],
  showStats: true,
  showLanguageStats: true
};
