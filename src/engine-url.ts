import artifacts from '../model/artifacts.json';
/** A new bridge must not be paired with a cached engine that lacks its exports. */
export function engineAssetUrl(base:string){
 const sha256=artifacts.files['public/wasm/cs_verdant.wasm'].sha256;
 return new URL(`wasm/cs_verdant.wasm?sha256=${sha256}`,base).href;
}
