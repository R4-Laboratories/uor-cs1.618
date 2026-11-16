Feature: cs-verdant

  The features uorust admitted for the cs-verdant package, each with the
  interface calls that realize it and the acceptance rows that accept it.

  @FT-01 @build
  Scenario: cs_verdant: The game-specific safe ABI over Verdant Engine. All geometry queries use Verdant's BVH.
    Given the record Interface::featureCsVerdant
    When the interface call Interface::callCsVerdantSpatialWorldAddBox is made
    And the interface call Interface::callCsVerdantSpatialWorldBuild is made
    And the interface call Interface::callCsVerdantSpatialWorldRay is made
    And the interface call Interface::callCsVerdantSpatialWorldSlide is made
    And the interface call Interface::callCsVerdantSpatialWorldSupport is made
    And the interface call Interface::callCsVerdantCsClear is made
    And the interface call Interface::callCsVerdantCsBox is made
    And the interface call Interface::callCsVerdantCsBuild is made
    And the interface call Interface::callCsVerdantCsRay is made
    And the interface call Interface::callCsVerdantCsMove is made
    And the interface call Interface::callCsVerdantCsSupport is made
    And the interface call Interface::callCsVerdantCsResult is made
    And the interface call Interface::callCsVerdantCsHitbox is made
    And the interface call Interface::callCsVerdantCsAudio is made
    Then the acceptance row Interface::acCsVerdantCsVerdantDiagonalMotionSlidesAndRadiusCannotClipCorner holds
    And the acceptance row Interface::acCsVerdantCsVerdantRayMissesOpenSpace holds
    And the acceptance row Interface::acCsVerdantCsVerdantWallBlocksShotsAndMovement holds

  @FT-02 @build
  Scenario: cs_verdant::characters: Bounded rendering-only bridge to Verdant's new articulated character module.
    Given the record Interface::featureCsVerdantCharacters
    When the interface call Interface::callCsVerdantCharactersCsCharacterAsset is made
    And the interface call Interface::callCsVerdantCharactersCsCharacterAssetPtr is made
    And the interface call Interface::callCsVerdantCharactersCsCharacterAssetLen is made
    And the interface call Interface::callCsVerdantCharactersCsCharacterCreate is made
    And the interface call Interface::callCsVerdantCharactersCsCharacterRelease is made
    And the interface call Interface::callCsVerdantCharactersCsCharacterStep is made
    And the interface call Interface::callCsVerdantCharactersCsCharacterPosePtr is made
    And the interface call Interface::callCsVerdantCharactersCsCharacterPoseLen is made
    Then the acceptance row Interface::acCsVerdantCsVerdantCharactersPoseSlotsAreBoundedFiniteAndReleased holds
