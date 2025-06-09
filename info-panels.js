import infoPanelsData from './info-panels-data.js';

// Billboard component for A-Frame (panels always face the player camera)
AFRAME.registerComponent('billboard', {
  tick: function () {
    // Always use the player camera (the one inside #head)
    const playerCam = this.el.sceneEl.querySelector('#head');
    if (playerCam && playerCam.object3D) {
      const camWorldPos = new THREE.Vector3();
      playerCam.object3D.getWorldPosition(camWorldPos);
      this.el.object3D.lookAt(camWorldPos);
    }
  }
});

AFRAME.registerComponent('panel-fade', {
  schema: {
    min: {type: 'number', default: 1.5}, // fully opaque within this distance
    max: {type: 'number', default: 6.5}, // fully transparent beyond this distance
    minOpacity: {type: 'number', default: 0.18},
    maxOpacity: {type: 'number', default: 0.92}
  },
  tick: function () {
    // Use the player camera (the one inside #head)
    const playerCam = this.el.sceneEl.querySelector('#head');
    if (!playerCam || !playerCam.object3D) return;
    const panelPos = new THREE.Vector3();
    this.el.object3D.getWorldPosition(panelPos);
    const camPos = new THREE.Vector3();
    playerCam.object3D.getWorldPosition(camPos);
    const dist = panelPos.distanceTo(camPos);
    let opacity = this.data.maxOpacity;
    if (dist > this.data.min) {
      const t = Math.min(1, Math.max(0, (dist - this.data.min) / (this.data.max - this.data.min)));
      opacity = this.data.maxOpacity * (1 - t) + this.data.minOpacity * t;
    }
    // Set opacity on the panel's material directly
    if (this.el.getObject3D('mesh')) {
      this.el.getObject3D('mesh').material.opacity = opacity;
    }
  }
});

function createInfoPanel(panel, idx) {
  const entity = document.createElement('a-entity');
  const [x, y, z] = (panel.position || '0 0 0').split(' ').map(Number);
  entity.setAttribute('position', `${x} ${y} ${z}`);
  entity.setAttribute('scale', '0.7 0.7 0.7');
  entity.setAttribute('billboard', '');
  entity.setAttribute('panel-fade', '');
  entity.setAttribute('animation__scale', {
    property: 'scale',
    to: '1 1 1',
    dur: 600,
    easing: 'easeOutElastic',
    delay: 200 + idx * 120
  });

  // Combine title and description for a single text block
  let descValue = panel.description;
  if (panel.title === 'WELCOME!') {
    descValue = getWelcomeDescription();
  }
  const textValue = panel.title === 'WELCOME!'
    ? `\n${descValue}\n\n`
    : `\n${panel.title}\n\n${descValue}\n\n`;

  // Use a single entity with geometry, material, and text
  entity.setAttribute('geometry', 'primitive: plane; width: 0; height: 0');
  entity.setAttribute('material', 'src: #panel-texture; transparent: true; opacity: 0.95; side: double; shader: flat');
  entity.setAttribute('text', {
    value: textValue,
    width: 1, // panel width
    color: '#fff',
    align: 'center',
    anchor: 'center',
    baseline: 'center',
    wrapCount: 32,
    lineHeight: 60
  });

  return entity;
}

// Helper to get welcome panel description based on mode
function getWelcomeDescription() {
  const scene = AFRAME.scenes && AFRAME.scenes[0];
  let mode = 'normal';
  if (scene) {
    if (scene.is('vr-mode')) mode = 'vr';
    if (scene.is('ar-mode')) mode = 'ar';
  }
  if (mode === 'vr') {
    return 'Welcome to VR!\n\nUse your controllers to teleport or move.\nPress the menu button for settings.';
  } else if (mode === 'ar') {
    return 'Welcome to AR!\n\nMove your device to explore.\nUse touch or controllers for interaction.';
  } else {
    return 'Welcome!\n\nUse WASD to move, right-click to teleport.\nEnter VR/AR for immersive controls.';
  }
}

// Add all info panels to the scene
export function addInfoPanelsToScene(sceneEl) {
  // Check if the panel.png texture is loaded
  const panelTexture = document.querySelector('a-assets > img#panel-texture, a-assets > [id="panel-texture"]');
  if (panelTexture && (panelTexture.complete || panelTexture.hasAttribute('src'))) {
    console.log('[InfoPanels] panel.png texture loaded successfully.');
  } else {
    console.warn('[InfoPanels] panel.png texture NOT loaded! Check <a-assets> and the file path.');
  }

  let panelsRoot = document.getElementById('info-panels-root');
  if (!panelsRoot) {
    panelsRoot = document.createElement('a-entity');
    panelsRoot.setAttribute('id', 'info-panels-root');
    sceneEl.appendChild(panelsRoot);
  } else {
    while (panelsRoot.firstChild) panelsRoot.removeChild(panelsRoot.firstChild);
  }

  infoPanelsData.forEach((panel, idx) => {
    const entity = createInfoPanel(panel, idx);
    panelsRoot.appendChild(entity);
    if (panel.title === 'WELCOME!') {
      entity.setAttribute('id', 'welcome-info-panel');
    }
    console.log(`[InfoPanels] Panel added: ${panel.title}`);
  });

  // Update WELCOME panel description on mode change
  function updateWelcomePanel() {
    const welcomePanel = document.getElementById('welcome-info-panel');
    if (!welcomePanel) return;
    const descEntity = Array.from(welcomePanel.children).find(child => {
      return child.getAttribute && child.getAttribute('text') && child.getAttribute('text').value !== undefined && child.getAttribute('text').value.startsWith('Welcome');
    });
    if (descEntity) {
      descEntity.setAttribute('text', 'value', getWelcomeDescription());
    }
  }
  sceneEl.addEventListener('enter-vr', updateWelcomePanel);
  sceneEl.addEventListener('exit-vr', updateWelcomePanel);
  sceneEl.addEventListener('enter-ar', updateWelcomePanel);
  sceneEl.addEventListener('exit-ar', updateWelcomePanel);

  console.log('[InfoPanels] All panels added to the scene.');
}
