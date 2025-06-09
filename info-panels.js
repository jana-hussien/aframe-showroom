import infoPanelsData from './info-panels-data.js';
import getWelcomeText from './get-welcome-text.js';

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

// Simple cursor-listener for click/tap events (works in all modes)
AFRAME.registerComponent('cursor-listener', {
  init: function () {
    this.el.addEventListener('mouseenter', function () {
      this.setAttribute('material', 'color', '#388e3c');
    });
    this.el.addEventListener('mouseleave', function () {
      this.setAttribute('material', 'color', '#4caf50');
    });
  }
});

// Custom cursor-listener for X button (hover effect)
AFRAME.registerComponent('cursor-listener-x', {
  init: function () {
    this.el.addEventListener('mouseenter', function () {
      // Only change cursor color if both the button and its parent panel are visible
      if ((this.getAttribute('visible') === false || this.getAttribute('visible') === 'false') ||
          (this.parentElement && (this.parentElement.getAttribute('visible') === false || this.parentElement.getAttribute('visible') === 'false'))) return;
      this.setAttribute('material', 'color', '#fff');
      const txt = this.querySelector('[text]');
      if (txt) txt.setAttribute('text', 'color', '#fff');
      // Change cursor color to red on hover
      const scene = this.sceneEl;
      const camera = scene && scene.querySelector('#head');
      if (camera) {
        const cursor = camera.querySelector('a-cursor');
        if (cursor) cursor.setAttribute('color', 'red');
      }
    });
    this.el.addEventListener('mouseleave', function () {
      // Only restore cursor color if both the button and its parent panel are visible
      if ((this.getAttribute('visible') === false || this.getAttribute('visible') === 'false') ||
          (this.parentElement && (this.parentElement.getAttribute('visible') === false || this.parentElement.getAttribute('visible') === 'false'))) return;
      this.setAttribute('material', 'color', '#cccccc');
      const txt = this.querySelector('[text]');
      if (txt) txt.setAttribute('text', 'color', '#eeeeee');
      // Restore cursor color
      const scene = this.sceneEl;
      const camera = scene && scene.querySelector('#head');
      if (camera) {
        const cursor = camera.querySelector('a-cursor');
        if (cursor) cursor.setAttribute('color', '#fff');
      }
    });
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
  entity.setAttribute('geometry', 'primitive: plane; width: 1.1; height: 0.5');
  entity.setAttribute('material', 'src: #panel-texture; transparent: true; opacity: 0.95; side: double; shader: flat');
  entity.setAttribute('text', {
    value: textValue,
    width: 1,
    color: '#fff',
    align: 'center',
    anchor: 'center',
    baseline: 'center',
    wrapCount: 32,
    lineHeight: 60
  });

  // Add X close button only to the WELCOME! panel
  if (panel.title === 'WELCOME!') {
    const button = document.createElement('a-image');
    const panelWidth = 1.1;
    const buttonSize = 0.08;
    const margin = 0.05;
    const x = (panelWidth / 2) - margin - (buttonSize / 2);
    const y = (0.5 / 2) - margin - (buttonSize / 2);
    button.setAttribute('src', '#x-mark');
    button.setAttribute('width', buttonSize);
    button.setAttribute('height', buttonSize);
    button.setAttribute('position', `${x} ${y} 0.01`);
    // Ensure X button always renders on top of the panel
    button.addEventListener('loaded', function () {
      if (button.getObject3D('mesh')) {
        button.getObject3D('mesh').renderOrder = 10;
      }
    });
    button.setAttribute('class', 'close-x-btn');
    button.setAttribute('tabindex', '0');
    button.setAttribute('transparent', 'true');
    button.setAttribute('cursor-listener-x', '');
    button.style = 'pointer-events: auto;';
    function resetCursorColor() {
      const scene = button.sceneEl;
      const camera = scene && scene.querySelector('#head');
      if (camera) {
        const cursor = camera.querySelector('a-cursor');
        if (cursor) cursor.setAttribute('color', '#fff');
      }
    }
    button.addEventListener('click', function (evt) {
      entity.setAttribute('visible', 'false');
      resetCursorColor();
    });
    button.addEventListener('keydown', function (evt) {
      if (evt.key === 'Enter' || evt.key === ' ') {
        entity.setAttribute('visible', 'false');
        resetCursorColor();
      }
    });
    entity.appendChild(button);
  }

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
  return getWelcomeText(mode); // Use global getWelcomeText from index.html
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

  function addOrShowWelcomePanel() {
    const welcomePanel = document.getElementById('welcome-info-panel');
    const mode = sceneEl.is('vr-mode') ? 'vr' : sceneEl.is('ar-mode') ? 'ar' : 'normal';
    if (!welcomePanel) {
      // Find the welcome panel data
      const welcomeData = infoPanelsData.find(p => p.title === 'WELCOME!');
      if (welcomeData) {
        const entity = createInfoPanel(welcomeData, 0); // idx=0 for animation
        entity.setAttribute('id', 'welcome-info-panel');
        // Place at the top of the panels root
        let panelsRoot = document.getElementById('info-panels-root');
        if (!panelsRoot) {
          panelsRoot = document.createElement('a-entity');
          panelsRoot.setAttribute('id', 'info-panels-root');
          sceneEl.appendChild(panelsRoot);
        }
        panelsRoot.insertBefore(entity, panelsRoot.firstChild);
      }
    } else {
      // If present but hidden, show and update text
      if (welcomePanel.getAttribute('visible') === false || welcomePanel.getAttribute('visible') === 'false') {
        welcomePanel.setAttribute('visible', 'true');
      }
      // Update text for current mode
      const textComp = welcomePanel.getAttribute('text');
      if (textComp) {
        welcomePanel.setAttribute('text', 'value', getWelcomeDescription());
      }
    }
  }

  // Update WELCOME panel description on mode change and restore if missing
  function updateWelcomePanel() {
    addOrShowWelcomePanel();
  }
  sceneEl.addEventListener('enter-vr', updateWelcomePanel);
  sceneEl.addEventListener('exit-vr', updateWelcomePanel);
  sceneEl.addEventListener('enter-ar', updateWelcomePanel);
  sceneEl.addEventListener('exit-ar', updateWelcomePanel);

  console.log('[InfoPanels] All panels added to the scene.');
}
