import { CyberdeckEvents, CyberdeckState } from "./CyberdeckState";

export function completeInstalledModTutorial() {
  CyberdeckState.tutorialSteps.hasInstalledMod = true;
  checkTutorialCompletion();
}

export function completeMadeConnectionTutorial() {
  CyberdeckState.tutorialSteps.hasMadeConnection = true;
  checkTutorialCompletion();
}

export function completeChargedModuleTutorial() {
  CyberdeckState.tutorialSteps.hasChargedModule = true;
  checkTutorialCompletion();
}

export function completeCraftedIcebreakerTutorial() {
  CyberdeckState.tutorialSteps.hasCraftedIcebreaker = true;
  checkTutorialCompletion();
}

export function completeNetrunTutorial() {
  CyberdeckState.tutorialSteps.hasNetrun = true;
  checkTutorialCompletion();
}

export function hasConsumedSkillchipTutorial() {
  CyberdeckState.tutorialSteps.hasConsumedSkillchip = true;
  checkTutorialCompletion();
}



function checkTutorialCompletion() {
  if (CyberdeckState.hasCompletedTutorial) {
    return;
  }
  const {
    hasInstalledMod,
    hasChargedModule,
    hasCraftedIcebreaker,
    hasNetrun,
    hasMadeConnection,
    hasConsumedSkillchip
  } = CyberdeckState.tutorialSteps;
  CyberdeckState.hasCompletedTutorial = hasInstalledMod && hasChargedModule && hasCraftedIcebreaker && hasNetrun && hasMadeConnection && hasConsumedSkillchip;
  CyberdeckEvents.emit();
}