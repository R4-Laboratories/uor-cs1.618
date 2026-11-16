//! The `cs_round` suite: one test per scenario in `features/suites/cs_round.feature`.
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
    let model = module("app/src/CsRoundProofs.lex.tex");
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

/// `CR-01`: The app always answers defend when bomb is defused
#[test]
fn cs_round_cr_01() {
    pinned(
        "breaksInv001",
        "body: (((((((project request bomb) <? 4) && ((project request attackers) <=? 5)) && ((project request defenders) <=? 5)) && ((project request clock) <=? 1)) && ((project request bomb) =? (CsRound::bombDefused))) && (not ((CsRound::judge request) =? (CsRound::answerDefend))))",
        "inv001Holds",
    );
}

/// `CR-02`: The app always answers attack when bomb is exploded
#[test]
fn cs_round_cr_02() {
    pinned(
        "breaksInv002",
        "body: (((((((project request bomb) <? 4) && ((project request attackers) <=? 5)) && ((project request defenders) <=? 5)) && ((project request clock) <=? 1)) && ((project request bomb) =? (CsRound::bombExploded))) && (not ((CsRound::judge request) =? (CsRound::answerAttack))))",
        "inv002Holds",
    );
}

/// `CR-03`: The app always answers continue when bomb is planted and attackers equals 0 and defenders is above 0
#[test]
fn cs_round_cr_03() {
    pinned(
        "breaksInv003",
        "body: (((((((((project request bomb) <? 4) && ((project request attackers) <=? 5)) && ((project request defenders) <=? 5)) && ((project request clock) <=? 1)) && ((project request bomb) =? (CsRound::bombPlanted))) && ((project request attackers) =? 0)) && (0 <? (project request defenders))) && (not ((CsRound::judge request) =? (CsRound::answerContinue))))",
        "inv003Holds",
    );
}

/// `CR-04`: The architecture description declares every stakeholder, concern, component, edge, viewpoint and view it references
#[test]
fn cs_round_cr_04() {
    holds(
        "app/src/Architecture.lex.tex",
        "architectureDescriptionHolds",
        "((architectureValid) = true)",
    );
}

/// `CR-05`: The ISO/IEC 25010:2023 quality model declares all 9 characteristics and 40 subcharacteristics, states each subcharacteristic by a requirement or lists it open, and every parent it names is declared
#[test]
fn cs_round_cr_05() {
    holds(
        "app/src/Quality.lex.tex",
        "qualityModelHolds",
        "((qualityValid) = true)",
    );
}

/// `CR-06`: Every STRIDE category each component and data flow is open to is answered by a threat or stated open, and no other pair is stated open
#[test]
fn cs_round_cr_06() {
    holds(
        "app/src/Security.lex.tex",
        "strideEnumerated",
        "((securityValid) = true)",
    );
}

/// `CR-07`: Every compliance obligation is numbered in order and names its evidence
#[test]
fn cs_round_cr_07() {
    holds(
        "app/src/Compliance.lex.tex",
        "everyObligationEvidenced",
        "((obligationsEvidenced 0 (obligations)) = true)",
    );
}
