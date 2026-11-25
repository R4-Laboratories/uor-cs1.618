/** Browser backing for RGBA8 material maps, using the representation selected by the vRAM guest. */
const PAGE_BYTES = 4096;
const PALETTE_LIMIT = 16;
const enum Encoding { Fill, Sparse, Palette, Literal }
interface Page { encoding: Encoding; bytes: Uint8Array }
export interface PackedTexture {
 readonly logicalBytes: number;
 /** Encoded payload bytes. JS object and typed-array headers are excluded. */
 readonly storedBytes: number;
 /** Return fresh pixels for the upload, including after a lost GPU context. */
 unpack(): Uint8Array<ArrayBuffer>;
}
export interface TextureStagingStats {
 textures: number; logicalBytes: number; storedBytes: number;
 fillPages: number; sparsePages: number; palettePages: number; literalPages: number;
}
type Choose = (length: number, uniform: number, sparseCost: number, paletteCost: number) => number;

function packPage(source: Uint8Array, choose: Choose): Page {
 const histogram = new Uint16Array(256);
 let distinct = 0, base = 0;
 for (const value of source) {
  if (histogram[value]++ === 0) distinct++;
  if (histogram[value] > histogram[base]) base = value;
 }
 const sparseCost = 1 + 3 * (source.length - histogram[base]);
 const paletteCost = distinct <= PALETTE_LIMIT ? 1 + distinct + Math.ceil(source.length / 2) : PAGE_BYTES;
 const encoding = choose(source.length, Number(distinct === 1), sparseCost, paletteCost);
 switch (encoding) {
  case Encoding.Fill: return { encoding, bytes: Uint8Array.of(base) };
  case Encoding.Sparse: {
   const bytes = new Uint8Array(sparseCost);
   bytes[0] = base;
   for (let i = 0, offset = 1; i < source.length; i++) {
    if (source[i] === base) continue;
    bytes[offset++] = i & 255;
    bytes[offset++] = i >>> 8;
    bytes[offset++] = source[i];
   }
   return { encoding, bytes };
  }
  case Encoding.Palette: {
   const bytes = new Uint8Array(paletteCost), indices = new Uint8Array(256);
   bytes[0] = distinct;
   for (let value = 0, index = 0; value < histogram.length; value++) {
    if (histogram[value] === 0) continue;
    bytes[1 + index] = value;
    indices[value] = index++;
   }
   for (let i = 0; i < source.length; i++) bytes[1 + distinct + (i >>> 1)] |= indices[source[i]] << (4 * (i & 1));
   return { encoding, bytes };
  }
  case Encoding.Literal: return { encoding, bytes: new Uint8Array(source) };
  default: throw new Error('vRAM refused texture page');
 }
}

function unpackPages(pages: Page[], length: number): Uint8Array<ArrayBuffer> {
 const out = new Uint8Array(length);
 for (let index = 0; index < pages.length; index++) {
  const { encoding, bytes } = pages[index];
  const start = index * PAGE_BYTES, end = Math.min(start + PAGE_BYTES, length);
  switch (encoding) {
   case Encoding.Fill: out.fill(bytes[0], start, end); break;
   case Encoding.Sparse:
    out.fill(bytes[0], start, end);
    for (let i = 1; i < bytes.length; i += 3) out[start + (bytes[i] | (bytes[i + 1] << 8))] = bytes[i + 2];
    break;
   case Encoding.Palette:
    for (let i = 0; i < end - start; i++) {
     const pair = bytes[1 + bytes[0] + (i >>> 1)];
     out[start + i] = bytes[1 + ((pair >>> (4 * (i & 1))) & 15)];
    }
    break;
   case Encoding.Literal: out.set(bytes, start); break;
  }
 }
 return out;
}

export function packRgbaPages(source: Uint8Array, choose: Choose, stats: TextureStagingStats): PackedTexture {
 const pages: Page[] = [];
 const counts = [0, 0, 0, 0];
 const logicalBytes = source.length;
 let storedBytes = 0;
 for (let offset = 0; offset < logicalBytes; offset += PAGE_BYTES) {
  const page = packPage(source.subarray(offset, offset + PAGE_BYTES), choose);
  pages.push(page);
  storedBytes += page.bytes.length;
  counts[page.encoding]++;
 }
 stats.textures++; stats.logicalBytes += logicalBytes; stats.storedBytes += storedBytes;
 stats.fillPages += counts[Encoding.Fill]; stats.sparsePages += counts[Encoding.Sparse];
 stats.palettePages += counts[Encoding.Palette]; stats.literalPages += counts[Encoding.Literal];
 return { logicalBytes, storedBytes, unpack: () => unpackPages(pages, logicalBytes) };
}
