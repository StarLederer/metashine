{
  description = "Metashine";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils/master";
    nixpkgs.url = "github:nixos/nixpkgs/nixos-22.05";
  };

  outputs = { self, flake-utils, nixpkgs }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in rec {
        devShell = pkgs.mkShell {
          nativeBuildInputs = with pkgs; [
            nodejs-16_x
            nodePackages.pnpm
            electron_15
          ];

          buildInputs = with pkgs; [
            xorg.libX11
            xorg.libXcomposite
            xorg.libXdamage
            xorg.libXext
            xorg.libXfixes
            xorg.libXrandr
            xorg.libxcb
            xorg.libxshmfence
            alsaLib
            at-spi2-core
            nss
            expat
            cups
            nspr
            glib
            atk
            mesa
            libxkbcommon
            at-spi2-atk
            dbus
            libdrm
            gtk3
            pango
            cairo
            gdk-pixbuf

            # Needed to compile some of the node_modules dependencies from source
            # autoreconfHook
            # autoPatchelfHook
          ];
        };
      }
    );
}
