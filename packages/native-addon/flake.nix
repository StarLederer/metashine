{
  inputs = {
    fenix.url = "github:nix-community/fenix";
    flake-utils.url = "github:numtide/flake-utils";
    naersk.url = "github:nix-community/naersk";
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs = { self, fenix, flake-utils, naersk, nixpkgs }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = (import nixpkgs) {
          inherit system;
        };

        toolchain = with fenix.packages.${system};
          combine [
            minimal.rustc
            minimal.cargo
            targets.x86_64-unknown-linux-gnu.latest.rust-std
            targets.x86_64-pc-windows-gnu.latest.rust-std
            targets.i686-pc-windows-gnu.latest.rust-std
          ];

        naersk' = naersk.lib.${system}.override {
          cargo = toolchain;
          rustc = toolchain;
        };

        naerskBuildPackage = target: args:
          naersk'.buildPackage (
            args
              // { CARGO_BUILD_TARGET = target; }
              // cargoConfig
              // naerskConfig
          );

        # All of the CARGO_* configurations which should be used for all
        # targets.
        #
        # Only use this for options which should be universally applied or which
        # can be applied to a specific target triple.
        #
        # This is also merged into the devShell.
        cargoConfig = {
          # Tells Cargo that it should use Wine to run tests.
          # (https://doc.rust-lang.org/cargo/reference/config.html#targettriplerunner)
          CARGO_TARGET_X86_64_PC_WINDOWS_GNU_RUNNER = pkgs.writeScript "wine-wrapper" ''
            export WINEPREFIX="$(mktemp -d)"
            exec wine64 $@
          '';
        };

        naerskConfig = {
          src = ./.;
          doCheck = false;
          copyBins = false;
          copyLibs = true;
        };

      in rec {
        defaultPackage = packages.x86_64-unknown-linux-gnu;

        # For `nix build .#x86_64-unknown-linux-gnu`:
        packages.x86_64-unknown-linux-gnu = naerskBuildPackage "x86_64-unknown-linux-gnu" {
          nativeBuildInputs = with pkgs; [ pkgsStatic.stdenv.cc ];
        };

        # For `nix build .#x86_64-pc-windows-gnu`:
        packages.x86_64-pc-windows-gnu = naerskBuildPackage "x86_64-pc-windows-gnu" {
          strictDeps = true;

          depsBuildBuild = with pkgs; [
            pkgsCross.mingwW64.stdenv.cc
            pkgsCross.mingwW64.windows.pthreads
          ];

          nativeBuildInputs = with pkgs; [
            # We need Wine to run tests:
            wineWowPackages.stable
          ];
        };

        devShell = pkgs.mkShell (
          {
            inputsFrom = with packages; [ x86_64-unknown-linux-gnu x86_64-pc-windows-gnu ];
            CARGO_BUILD_TARGET = "x86_64-unknown-linux-gnu";
          } // cargoConfig
        );
      }
  );
}
