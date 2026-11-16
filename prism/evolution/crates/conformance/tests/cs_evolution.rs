//! The `cs_evolution` suite: one test per scenario in `features/suites/cs_evolution.feature`.
//!
//! Written by the Prism-DevRel builder from the app's prompt. The theorems are
//! checked by the Lean kernel when `just vv` runs `prismpm verify` on `app/`.
//! What these tests hold fixed is what each theorem is about, so a weakened
//! statement that still verifies fails the gate.

use std::path::PathBuf;

fn root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .ancestors()
        .nth(2)
        .expect("crates/conformance is two below the root")
        .to_path_buf()
}

/// The body of the top-level declaration named `name`, up to its closing brace.
fn declaration<'a>(model: &'a str, name: &str) -> &'a str {
    let start = model
        .find(&format!("\n  name: {name},\n"))
        .unwrap_or_else(|| panic!("{name} is not declared"));
    let end = model[start..]
        .find("\n}\n")
        .unwrap_or_else(|| panic!("{name} is not closed"));
    &model[start..start + end]
}

fn module(path: &str) -> String {
    std::fs::read_to_string(root().join(path)).expect("the module")
}

/// The condition no request may meet, and the theorem that says none does.
fn pinned(breaks: &str, condition: &str, theorem: &str) {
    let model = module("app/src/CsEvolutionProofs.lex.tex");
    let found = declaration(&model, breaks);
    assert!(
        found.contains(condition),
        "the condition of {breaks} changed:\n{found}"
    );
    let holds = declaration(&model, theorem);
    let statement = format!("statement: (({breaks} request) = false),");
    assert!(
        holds.contains(&statement),
        "{theorem} must state that no request meets {breaks}:\n{holds}"
    );
}

/// A facet theorem: proved by `decide`, about exactly this predicate.
fn holds(path: &str, theorem: &str, statement: &str) {
    let model = module(path);
    let found = declaration(&model, theorem);
    assert!(
        found.contains(&format!("statement: {statement},")),
        "{theorem} must state {statement}:\n{found}"
    );
    assert!(
        found.contains("proof: decide{}"),
        "{theorem} is proved by decide"
    );
}

/// `CE-01`: The app always answers reject when fidelity is fail
#[test]
fn cs_evolution_ce_01() {
    pinned(
        "breaksInv001",
        "body: (((((((project request fidelity) <? 2) && ((project request benefit) <? 2)) && ((project request bounds) <? 2)) && ((project request checks) <? 2)) && ((project request fidelity) =? (CsEvolution::fidelityFail))) && (not ((CsEvolution::judge request) =? (CsEvolution::answerReject))))",
        "inv001Holds",
    );
}

/// `CE-02`: The app always answers reject when benefit is fail
#[test]
fn cs_evolution_ce_02() {
    pinned(
        "breaksInv002",
        "body: (((((((project request fidelity) <? 2) && ((project request benefit) <? 2)) && ((project request bounds) <? 2)) && ((project request checks) <? 2)) && ((project request benefit) =? (CsEvolution::benefitFail))) && (not ((CsEvolution::judge request) =? (CsEvolution::answerReject))))",
        "inv002Holds",
    );
}

/// `CE-03`: The app always answers reject when bounds is fail
#[test]
fn cs_evolution_ce_03() {
    pinned(
        "breaksInv003",
        "body: (((((((project request fidelity) <? 2) && ((project request benefit) <? 2)) && ((project request bounds) <? 2)) && ((project request checks) <? 2)) && ((project request bounds) =? (CsEvolution::boundsFail))) && (not ((CsEvolution::judge request) =? (CsEvolution::answerReject))))",
        "inv003Holds",
    );
}

/// `CE-04`: The app always answers reject when checks is fail
#[test]
fn cs_evolution_ce_04() {
    pinned(
        "breaksInv004",
        "body: (((((((project request fidelity) <? 2) && ((project request benefit) <? 2)) && ((project request bounds) <? 2)) && ((project request checks) <? 2)) && ((project request checks) =? (CsEvolution::checksFail))) && (not ((CsEvolution::judge request) =? (CsEvolution::answerReject))))",
        "inv004Holds",
    );
}

/// `CE-05`: The architecture description declares every stakeholder, concern, component, edge, viewpoint and view it references
#[test]
fn cs_evolution_ce_05() {
    holds(
        "app/src/Architecture.lex.tex",
        "architectureDescriptionHolds",
        "((architectureValid) = true)",
    );
}

/// `CE-06`: The ISO/IEC 25010:2023 quality model declares all 9 characteristics and 40 subcharacteristics, states each subcharacteristic by a requirement or lists it open, and every parent it names is declared
#[test]
fn cs_evolution_ce_06() {
    holds(
        "app/src/Quality.lex.tex",
        "qualityModelHolds",
        "((qualityValid) = true)",
    );
}

/// `CE-07`: Every STRIDE category each component and data flow is open to is answered by a threat or stated open, and no other pair is stated open
#[test]
fn cs_evolution_ce_07() {
    holds(
        "app/src/Security.lex.tex",
        "strideEnumerated",
        "((securityValid) = true)",
    );
}

/// `CE-08`: Every compliance obligation is numbered in order and names its evidence
#[test]
fn cs_evolution_ce_08() {
    holds(
        "app/src/Compliance.lex.tex",
        "everyObligationEvidenced",
        "((obligationsEvidenced 0 (obligations)) = true)",
    );
}
