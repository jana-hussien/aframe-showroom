AFRAME.registerComponent('movement-controls', {
  init: function () {
    this.isWalking = false;
    this.walkSpeed = 2;
    this.camera = document.querySelector('#camera');

    // Create teleport marker
    this.createTeleportMarker();
  },

  createTeleportMarker: function() {
    const scene = document.querySelector('a-scene');
    // Remove old marker if exists
    if (this.teleportMarker) scene.removeChild(this.teleportMarker);
    // Create teleport marker entity with 3D model
    const marker = document.createElement('a-entity');
    marker.setAttribute('id', 'teleportMarker');
    marker.setAttribute('gltf-model', '#teleport-model');
    marker.setAttribute('visible', false);
    marker.setAttribute('scale', '1 1 1');
    // Add glow effect as a child entity
    const glow = document.createElement('a-image');
    glow.setAttribute('src', '#teleport-glow');
    glow.setAttribute('position', '0 0.01 0');
    glow.setAttribute('rotation', '-90 0 0');
    glow.setAttribute('width', '1.2');
    glow.setAttribute('height', '1.2');
    glow.setAttribute('opacity', '0.7');
    marker.appendChild(glow);
    // Add flare effect as a child entity
    const flare = document.createElement('a-image');
    flare.setAttribute('src', '#teleport-flare');
    flare.setAttribute('position', '0 0.02 0');
    flare.setAttribute('rotation', '-90 0 0');
    flare.setAttribute('width', '0.7');
    flare.setAttribute('height', '0.7');
    flare.setAttribute('opacity', '0.5');
    marker.appendChild(flare);
    scene.appendChild(marker);
    this.teleportMarker = marker;
  },

  showTeleportMarker: function(controller) {
    const intersection = controller.components.raycaster.getIntersection();
    if (intersection && intersection.object.el.classList.contains('ground')) {
      const point = intersection.point;
      this.teleportMarker.setAttribute('position', point);
      this.teleportMarker.setAttribute('visible', true);
      // Animate marker scale for feedback
      this.teleportMarker.setAttribute('animation', {
        property: 'scale',
        to: '1.2 1.2 1.2',
        dur: 200,
        easing: 'easeOutElastic',
        loop: false
      });
    }
  },

  hideTeleportMarker: function() {
    if (this.teleportMarker) {
      this.teleportMarker.setAttribute('visible', false);
      this.teleportMarker.removeAttribute('animation');
    }
  },

  teleport: function(controller) {
    const intersection = controller.components.raycaster.getIntersection();
    if (intersection && intersection.object.el.classList.contains('ground')) {
      const point = intersection.point;
      const rigPos = this.el.getAttribute('position');
      
      // Maintain the rig's height when teleporting
      this.el.setAttribute('position', {
        x: point.x,
        y: rigPos.y,
        z: point.z
      });

      // Add teleport effect
      this.createTeleportEffect(point);
    }
  },

  createTeleportEffect: function(position) {
    const scene = document.querySelector('a-scene');
    const effect = document.createElement('a-entity');
    effect.setAttribute('position', position);
    effect.innerHTML = `
      <a-image src="#teleport-glow" width="2" height="2" rotation="-90 0 0" opacity="0.5"
        animation="property: scale; from: 0.1 0.1 0.1; to: 2 2 2; dur: 400; easing: easeOutQuad"
        animation__opacity="property: opacity; from: 0.5; to: 0; dur: 400"></a-image>
      <a-image src="#teleport-flare" width="1" height="1" rotation="-90 0 0" opacity="0.4"
        animation="property: scale; from: 0.1 0.1 0.1; to: 1.5 1.5 1.5; dur: 400; easing: easeOutQuad"
        animation__opacity="property: opacity; from: 0.4; to: 0; dur: 400"></a-image>
    `;
    scene.appendChild(effect);
    setTimeout(() => {
      scene.removeChild(effect);
    }, 400);
  },

  tick: function (time, timeDelta) {
    if (!this.isWalking || !this.camera) return;

    // Get camera direction
    const rotation = this.camera.object3D.rotation;
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyEuler(rotation);
    direction.y = 0; // Keep movement horizontal
    direction.normalize();

    // Move in the direction we're looking
    const moveDistance = (this.walkSpeed * timeDelta) / 1000;
    const currentPosition = this.el.getAttribute('position');
    
    this.el.setAttribute('position', {
      x: currentPosition.x + direction.x * moveDistance,
      y: currentPosition.y,
      z: currentPosition.z + direction.z * moveDistance
    });
  }
});

// Component to enable or disable movement for the player rig
AFRAME.registerComponent('movement-controls', {
  schema: {
    enabled: { type: 'boolean', default: true }
  },
  init: function () {
    // Store the enabled state
    this.enabled = this.data.enabled;
    // Bind event handlers
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    // Listen for keyboard events
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  },
  update: function () {
    // Update the enabled state if the schema changes
    this.enabled = this.data.enabled;
  },
  onKeyDown: function (event) {
    // Prevent movement if disabled
    if (!this.enabled) return;
    // Handle movement keys (WASD or arrow keys)
    // ...existing code...
  },
  onKeyUp: function (event) {
    // Prevent movement if disabled
    if (!this.enabled) return;
    // Handle key release
    // ...existing code...
  },
  remove: function () {
    // Clean up event listeners
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
});