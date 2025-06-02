// object-controls.js
// Component to handle user interaction with 3D models in the scene
AFRAME.registerComponent('object-controls', {
  schema: {
    normalScale: { type: 'number', default: 1.0 }, // Target height in meters
    hoverScaleMultiplier: { type: 'number', default: 1.5 }, // How much bigger on hover
    hoverHeight: { type: 'number', default: 0.2 },
    rotationSpeed: { type: 'number', default: 1 }
  },

  init: function() {
    this.isHeld = false;
    this.isHovered = false;
    this.setupHoverAnimation();
    this.setupInteractions();
    
    // Create popup for viewing (in world space)
    this.createViewPopup();

    // Set initial position for hovering
    this.initialY = this.el.object3D.position.y;
    this.time = 0;
    this.originalScale = null;

    // Wait for model to load before scaling
    this.el.addEventListener('model-loaded', () => {
      this.scaleModelToHeight();
    });
  },

  scaleModelToHeight: function() {
    const obj = this.el.object3D;
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    
    // Calculate scale to make height 1 meter
    const targetScale = this.data.normalScale / size.y;
    
    // Store original scale for hover effect
    this.originalScale = targetScale;
    
    // Apply the uniform scale
    obj.scale.setScalar(targetScale);
  },

  setupHoverAnimation: function() {
    // Add animation component for rotation
    this.el.setAttribute('animation__rotate', {
      property: 'rotation.y',
      dur: 5000,
      easing: 'linear',
      loop: true,
      to: 360
    });
  },

  createViewPopup: function() {
    const scene = document.querySelector('a-scene');
    
    // Create a container for the popup
    const popup = document.createElement('a-entity');
    popup.setAttribute('class', 'view-popup');
    popup.setAttribute('visible', false);
    
    // Add text and background
    popup.innerHTML = `
      <a-plane class="popup-bg" 
               width="0.6" height="0.2" 
               material="color: #ffffff; opacity: 0.8">
        <a-text value="View Closer" 
                align="center" 
                width="2"
                position="0 0 0.01"
                color="#000000">
        </a-text>
      </a-plane>
    `;
    
    scene.appendChild(popup);
    this.popup = popup;
  },

  tick: function(time, deltaTime) {
    if (this.isHeld) return;

    // Handle hovering animation
    this.time += deltaTime / 1000;
    const hoverOffset = Math.sin(this.time * 2) * this.data.hoverHeight;
    this.el.object3D.position.y = this.initialY + hoverOffset;

    // Update popup position when visible
    if (this.popup && this.popup.getAttribute('visible')) {
      const modelPos = new THREE.Vector3();
      this.el.object3D.getWorldPosition(modelPos);
      
      // Position popup in front of the model
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(this.el.object3D.quaternion);
      forward.multiplyScalar(0.7); // Distance in front of model
      
      this.popup.setAttribute('position', {
        x: modelPos.x + forward.x,
        y: modelPos.y + 0.5, // Slightly above model
        z: modelPos.z + forward.z
      });

      // Make popup face the camera
      const camera = document.querySelector('#camera');
      if (camera) {
        const cameraPos = camera.object3D.position;
        const popupPos = this.popup.object3D.position;
        const direction = new THREE.Vector3().subVectors(cameraPos, popupPos);
        const rotation = new THREE.Euler().setFromQuaternion(
          new THREE.Quaternion().setFromRotationMatrix(
            new THREE.Matrix4().lookAt(direction, new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0))
          )
        );
        this.popup.object3D.rotation.y = rotation.y;
      }
    }
  },

  setupInteractions: function() {
    this.el.addEventListener('raycaster-intersected', () => {
      if (!this.isHovered && this.originalScale) {
        this.isHovered = true;
        
        // Scale up the model
        const hoverScale = this.originalScale * this.data.hoverScaleMultiplier;
        this.el.object3D.scale.setScalar(hoverScale);
        
        // Show popup
        if (this.popup) {
          this.popup.setAttribute('visible', true);
        }
      }
    });

    this.el.addEventListener('raycaster-intersected-cleared', () => {
      if (this.isHovered && this.originalScale) {
        this.isHovered = false;
        
        // Return to original scale
        this.el.object3D.scale.setScalar(this.originalScale);
        
        // Hide popup
        if (this.popup) {
          this.popup.setAttribute('visible', false);
        }
      }
    });

    // Handle popup click
    if (this.popup) {
      this.popup.addEventListener('click', () => {
        this.teleportToViewingRoom();
      });
    }
  },

  teleportToViewingRoom: function() {
    // Get the model's ID or create one if it doesn't exist
    const modelId = this.el.id || 'model-' + Math.random().toString(36).substr(2, 9);
    this.el.id = modelId;

    // Check if viewing room exists, if not create it
    let viewingRoom = document.querySelector(`#viewing-room-${modelId}`);
    if (!viewingRoom) {
      viewingRoom = this.createViewingRoom(modelId);
    }

    // Teleport the player
    const rig = document.querySelector('#rig');
    if (rig) {
      rig.setAttribute('position', '0 1.6 2');
      // Set the viewing room as active
      viewingRoom.setAttribute('visible', true);
    }
  },

  createViewingRoom: function(modelId) {
    const scene = document.querySelector('a-scene');
    const room = document.createElement('a-entity');
    room.id = `viewing-room-${modelId}`;
    room.setAttribute('position', '0 0 -1000'); // Place far away
    
    // Add room elements
    room.innerHTML = `
      <a-box position="0 5 0" width="10" height="10" depth="10" material="color: #404040; side: double"></a-box>
      <a-plane position="0 0 0" rotation="-90 0 0" width="10" height="10" material="color: #808080" class="ground"></a-plane>
      <a-entity position="0 1.5 0" id="display-${modelId}"></a-entity>
      <a-entity position="-4 1.6 0" text="value: Press Grip to grab\nTrigger + Move to rotate; width: 1; align: center"></a-entity>
      <a-entity position="4 1.6 0" text="value: Press B to return; width: 1; align: center"></a-entity>
    `;

    scene.appendChild(room);
    
    // Clone the model into the viewing room
    const displayArea = room.querySelector(`#display-${modelId}`);
    const clonedModel = this.el.cloneNode(true);
    clonedModel.removeAttribute('animation');
    displayArea.appendChild(clonedModel);

    // Add grab-and-manipulate component to the cloned model
    clonedModel.setAttribute('grab-and-manipulate', '');

    return room;
  }
});

// =object interaction and manipulation
AFRAME.registerComponent('grab-and-manipulate', {
  init: function () {
    this.isGrabbed = false;

    this.el.addEventListener('gripdown', () => {
      this.isGrabbed = true;
      this.el.setAttribute('animation', {
        property: 'position',
        to: '0 1.5 0',
        dur: 300,
        easing: 'easeOutQuad'
      });
    });

    this.el.addEventListener('gripup', () => {
      this.isGrabbed = false;
      this.el.setAttribute('animation', {
        property: 'position',
        to: '0 1 0',
        dur: 300,
        easing: 'easeOutQuad'
      });
    });

    this.el.addEventListener('mousedown', (evt) => {
      if (this.isGrabbed) {
        const rotation = evt.detail.intersection.point;
        this.el.object3D.rotation.set(rotation.x, rotation.y, rotation.z);
      }
    });
  },

  tick: function () {
    if (this.isGrabbed) {
      // Allow manipulation while grabbed
      const rotation = this.el.object3D.rotation;
      rotation.y += 0.01; // Rotate around Y-axis
      this.el.object3D.rotation.set(rotation.x, rotation.y, rotation.z);
    }
  }
});