{ pkgs, ... }:

let
  sddm-astronaut = pkgs.sddm-astronaut.override {
    embeddedTheme = "astronaut";
  };
in
{
  services.xserver = {
    enable = true;

    xkb = {
      layout = "es";
      variant = "";
    };
  };

  services.displayManager.sddm = {
    enable = true;
    theme = "sddm-astronaut-theme";

    extraPackages = [
      sddm-astronaut
      pkgs.kdePackages.qtmultimedia
    ];
  };

  # Hyprland is the only desktop session. SDDM still starts it, so
  # `services.xserver.enable` stays on.
  programs.hyprland.enable = true;
  services.displayManager.defaultSession = "hyprland";

  # KDE Plasma used to provide the following; they are declared here now that
  # `services.desktopManager.plasma6` is gone.
  #
  # - `qt.enable`: puts the Qt plugin paths in the environment so that
  #   `QT_QPA_PLATFORMTHEME=qt6ct` (set by Hyprland) resolves.
  # - `gdk-pixbuf` + librsvg: lets GTK render SVG icons (Papirus is SVG).
  # - Noto/Hack: the fonts the GTK settings and Plasma's old defaults used.
  qt.enable = true;

  programs.gdk-pixbuf.modulePackages = [ pkgs.librsvg ];

  fonts.packages = [
    pkgs.noto-fonts
    pkgs.hack-font
  ];

  fonts.fontconfig.defaultFonts = {
    sansSerif = [ "Noto Sans" ];
    serif = [ "Noto Serif" ];
    monospace = [
      "Hack"
      "Noto Sans Mono"
    ];
  };

  security.rtkit.enable = true;

  services.pipewire = {
    enable = true;
    alsa.enable = true;
    alsa.support32Bit = true;
    pulse.enable = true;
  };

  environment.systemPackages = [
    sddm-astronaut
    pkgs.kdePackages.qtmultimedia
  ];
}
