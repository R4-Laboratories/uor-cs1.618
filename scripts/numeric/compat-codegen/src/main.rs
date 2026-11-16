//! Diagnostic driver of the unchanged pinned generator; not an independent verifier.
use prod_codegen::{generate_cargo_package, CargoPackageSpec};
use prod_ir::parser::parse_module;
use sha2::{Digest, Sha256};
use std::{error::Error, fs, path::Path};
fn main() -> Result<(), Box<dyn Error>> {
    let args: Vec<_> = std::env::args().skip(1).collect();
    let [input, output] = args.as_slice() else { return Err("expected IR OUTPUT".into()) };
    let ir = fs::read_to_string(input)?;
    let (rest, module) = parse_module(&ir).map_err(|e| format!("parse: {e}"))?;
    if !rest.trim().is_empty() { return Err("unparsed IR suffix".into()); }
    let package = generate_cargo_package(&module, &CargoPackageSpec {
        name: "numeric-compatibility".into(), version: "0.1.0".into(),
        description: "Pinned backend source fixture".into(),
        repository: "https://example.invalid/numeric-compatibility".into(),
        homepage: "https://example.invalid/numeric-compatibility".into(),
        readme: "# Numeric compatibility diagnostic\n".into(),
        license_mit: include_str!("/opt/prismpm/share/conformance-root/vendor/lean4-prod/rust/prod-codegen/tests/fixtures/LICENSE-MIT").into(),
        license_apache: include_str!("/opt/prismpm/share/conformance-root/LICENSE-APACHE").into(),
        input_sha256: format!("{:x}", Sha256::digest(ir.as_bytes())), dependencies: vec![],
    }).map_err(|error| format!("generate: {error}"))?;
    for file in package.files {
        let path = Path::new(output).join(file.path);
        fs::create_dir_all(path.parent().ok_or("parent")?)?;
        fs::write(path, file.bytes)?;
    }
    println!("generated {output}");
    Ok(())
}
