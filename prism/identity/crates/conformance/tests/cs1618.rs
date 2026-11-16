//! The `cs1618` suite: one test per scenario in `features/suites/cs1618.feature`.
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
    let model = module("app/src/Cs1618Proofs.lex.tex");
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

/// `CS-01`: The app always answers deny when origin is fail
#[test]
fn cs1618_cs_01() {
    pinned(
        "breaksInv001",
        "body: (((((((project request origin) <? 2) && ((project request fresh) <? 2)) && ((project request signature) <? 2)) && ((project request consent) <? 2)) && ((project request origin) =? (Cs1618::originFail))) && (not ((Cs1618::judge request) =? (Cs1618::answerDeny))))",
        "inv001Holds",
    );
}

/// `CS-02`: The app always answers deny when fresh is fail
#[test]
fn cs1618_cs_02() {
    pinned(
        "breaksInv002",
        "body: (((((((project request origin) <? 2) && ((project request fresh) <? 2)) && ((project request signature) <? 2)) && ((project request consent) <? 2)) && ((project request fresh) =? (Cs1618::freshFail))) && (not ((Cs1618::judge request) =? (Cs1618::answerDeny))))",
        "inv002Holds",
    );
}

/// `CS-03`: The app always answers deny when signature is fail
#[test]
fn cs1618_cs_03() {
    pinned(
        "breaksInv003",
        "body: (((((((project request origin) <? 2) && ((project request fresh) <? 2)) && ((project request signature) <? 2)) && ((project request consent) <? 2)) && ((project request signature) =? (Cs1618::signatureFail))) && (not ((Cs1618::judge request) =? (Cs1618::answerDeny))))",
        "inv003Holds",
    );
}

/// `CS-04`: The app always answers deny when consent is fail
#[test]
fn cs1618_cs_04() {
    pinned(
        "breaksInv004",
        "body: (((((((project request origin) <? 2) && ((project request fresh) <? 2)) && ((project request signature) <? 2)) && ((project request consent) <? 2)) && ((project request consent) =? (Cs1618::consentFail))) && (not ((Cs1618::judge request) =? (Cs1618::answerDeny))))",
        "inv004Holds",
    );
}

/// `CS-05`: The architecture description declares every stakeholder, concern, component, edge, viewpoint and view it references
#[test]
fn cs1618_cs_05() {
    holds(
        "app/src/Architecture.lex.tex",
        "architectureDescriptionHolds",
        "((architectureValid) = true)",
    );
}

/// `CS-06`: The ISO/IEC 25010:2023 quality model declares all 9 characteristics and 40 subcharacteristics, states each subcharacteristic by a requirement or lists it open, and every parent it names is declared
#[test]
fn cs1618_cs_06() {
    holds(
        "app/src/Quality.lex.tex",
        "qualityModelHolds",
        "((qualityValid) = true)",
    );
}

/// `CS-07`: Every STRIDE category each component and data flow is open to is answered by a threat or stated open, and no other pair is stated open
#[test]
fn cs1618_cs_07() {
    holds(
        "app/src/Security.lex.tex",
        "strideEnumerated",
        "((securityValid) = true)",
    );
}

/// `CS-08`: Every compliance obligation is numbered in order and names its evidence
#[test]
fn cs1618_cs_08() {
    holds(
        "app/src/Compliance.lex.tex",
        "everyObligationEvidenced",
        "((obligationsEvidenced 0 (obligations)) = true)",
    );
}
