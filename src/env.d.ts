// biome-ignore lint/style/noNamespace: Astro declares Locals on this namespace
declare namespace App {
  interface Locals {
    admin?: import("./lib/settings").Admin | null;
  }
}
