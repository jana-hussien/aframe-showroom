// get-welcome-text.js
// Shared function for welcome text in all modes
export default function getWelcomeText(mode) {
  if (mode === 'vr') {
    return 'Welcome to VR!\nSwitch between movement\nmodes on your left wrist.\nHold down the trigger and aim to teleport.\nMove the joysticks to move.';
  } else if (mode === 'ar') {
    return 'Welcome to AR!\n\nMove your device to explore.\nUse touch or controllers for interaction.';
  } else {
    return 'Welcome!\n\nUse WASD to move.\nEnter VR/AR for immersive controls.';
  }
}
