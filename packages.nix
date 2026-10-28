{ pkgs, ... }:

{
  programs.firefox.enable = true;
  programs.fish.enable = true;

  programs.steam = {
    enable = true;

    extraCompatPackages = with pkgs; [
      proton-ge-bin
    ];
  };

  programs.gamemode.enable = true;

  environment.systemPackages = with pkgs; [
    wl-clipboard
    pciutils
    usbutils
    openrgb
    lenovo-legion
  ];
}
