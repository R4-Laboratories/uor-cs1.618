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
