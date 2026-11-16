#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -f "$HOME/.cargo/env" ]; then source "$HOME/.cargo/env"; fi
cargo test --locked -p cs-verdant
cargo build --locked --release --target wasm32-unknown-unknown -p cs-verdant
mkdir -p public/wasm
cp target/wasm32-unknown-unknown/release/cs_verdant.wasm public/wasm/cs_verdant.wasm
