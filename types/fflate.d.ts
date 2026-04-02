declare module "fflate" {
  export function unzipSync(data: Uint8Array): Record<string, Uint8Array>;
  export function strFromU8(data: Uint8Array): string;
}
