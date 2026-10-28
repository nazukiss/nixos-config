{ pkgs, ... }:

{
  services.fwupd.enable = true;
  services.flatpak.enable = true;
  services.printing.enable = true;
  services.fstrim.enable = true;
  services.hardware.openrgb.enable = true;

  virtualisation.waydroid = {
    enable = true;
    package = pkgs.waydroid-nftables;
  };
}
