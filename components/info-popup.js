AFRAME.registerComponent('info-popup', {
  schema: {
    title: { type: 'string', default: 'Item' },
    description: { type: 'string', default: 'No description available.' }
  },

  init: function () {
    this.createPopup();
    this.setupInteraction();
    this.isInDetailRoom = false;
    this.originalPosition = this.el.getAttribute('position');
    this.originalParent = this.el.parentNode;
  },

  createPopup: function () {
    // Create the popup container entity
    this.popup = document.createElement('a-entity');
    this.popup.setAttribute('visible', false);
    this.popup.setAttribute('position', '0 1.5 0');

    // Add a background panel to the popup
    const panel = document.createElement('a-plane');
    panel.setAttribute('color', '#000000');
    panel.setAttribute('opacity', '0.8');
    panel.setAttribute('height', '0.5');
    panel.setAttribute('width', '1');
    this.popup.appendChild(panel);

    // Add title text to the popup
    const title = document.createElement('a-text');
    title.setAttribute('value', this.data.title);
    title.setAttribute('align', 'center');
    title.setAttribute('position', '0 0.15 0.01');
    title.setAttribute('color', '#ffffff');
    title.setAttribute('scale', '0.3 0.3 0.3');
    this.popup.appendChild(title);

    // Add description text to the popup
    const description = document.createElement('a-text');
    description.setAttribute('value', this.data.description);
    description.setAttribute('align', 'center');
    description.setAttribute('position', '0 0 0.01');
    description.setAttribute('color', '#ffffff');
    description.setAttribute('scale', '0.2 0.2 0.2');
    description.setAttribute('wrap-count', '40');
    this.popup.appendChild(description);

    // Add a button to view more details
    const viewButton = document.createElement('a-plane');
    viewButton.setAttribute('color', '#4CAF50');
    viewButton.setAttribute('height', '0.15');
    viewButton.setAttribute('width', '0.4');
    viewButton.setAttribute('position', '0 -0.15 0.01');
    viewButton.setAttribute('class', 'clickable');
    
    const viewText = document.createElement('a-text');
    viewText.setAttribute('value', 'View Detail');
    viewText.setAttribute('align', 'center');
    viewText.setAttribute('color', '#ffffff');
    viewText.setAttribute('scale', '0.2 0.2 0.2');
    viewButton.appendChild(viewText);
    
    viewButton.addEventListener('click', () => this.showDetailView());
    this.popup.appendChild(viewButton);

    this.el.appendChild(this.popup);
  },

  setupInteraction: function () {
    // Show popup when hovered
    this.el.addEventListener('mouseenter', () => {
      if (!this.isInDetailRoom) {
        this.popup.setAttribute('visible', true);
      }
    });

    this.el.addEventListener('mouseleave', () => {
      if (!this.isInDetailRoom) {
        this.popup.setAttribute('visible', false);
      }
    });
  },

  showDetailView: function () {
    if (this.isInDetailRoom) return;

    this.isInDetailRoom = true;
    
    // Create a detail room entity and add it to the scene
    const detailRoom = document.createElement('a-entity');
    detailRoom.setAttribute('position', '0 0 -50');
    
    // Add a box to represent the room
    const room = document.createElement('a-box');
    room.setAttribute('color', '#1A1A1A');
    room.setAttribute('width', '10');
    room.setAttribute('height', '5');
    room.setAttribute('depth', '10');
    room.setAttribute('side', 'double');
    detailRoom.appendChild(room);

    // Add lighting to the detail room
    const light = document.createElement('a-light');
    light.setAttribute('type', 'point');
    light.setAttribute('intensity', '1');
    light.setAttribute('position', '0 2 0');
    detailRoom.appendChild(light);

    // Add a back button to return to the gallery
    const backButton = document.createElement('a-plane');
    backButton.setAttribute('position', '-4 2 0');
    backButton.setAttribute('rotation', '0 90 0');
    backButton.setAttribute('color', '#4CAF50');
    backButton.setAttribute('height', '0.5');
    backButton.setAttribute('width', '1');
    backButton.setAttribute('class', 'clickable');
    
    const backText = document.createElement('a-text');
    backText.setAttribute('value', 'Back to Gallery');
    backText.setAttribute('align', 'center');
    backText.setAttribute('color', '#ffffff');
    backText.setAttribute('scale', '0.5 0.5 0.5');
    backButton.appendChild(backText);
    
    backButton.addEventListener('click', () => this.returnToGallery());
    detailRoom.appendChild(backButton);

    // Add the detail room to the scene
    const scene = document.querySelector('a-scene');
    scene.appendChild(detailRoom);

    // Move the object to the detail room
    this.el.setAttribute('position', '0 1.5 -50');
    this.el.setAttribute('rotation', '0 0 0');
    
    // Move the player to the detail room
    const rig = document.querySelector('#rig');
    this.originalRigPosition = rig.getAttribute('position');
    rig.setAttribute('position', '0 0 -47');
  },

  returnToGallery: function () {
    if (!this.isInDetailRoom) return;

    this.isInDetailRoom = false;
    
    // Restore the object to its original position
    this.originalParent.appendChild(this.el);
    this.el.setAttribute('position', this.originalPosition);
    
    // Restore the player to their original position
    const rig = document.querySelector('#rig');
    rig.setAttribute('position', this.originalRigPosition);
    
    // Remove the detail room from the scene
    const scene = document.querySelector('a-scene');
    const detailRoom = scene.querySelector('a-entity[position="0 0 -50"]');
    if (detailRoom) {
      scene.removeChild(detailRoom);
    }
  }
});

AFRAME.registerComponent('model-interaction', {
  init: function () {
    this.el.addEventListener('mouseenter', () => {
      // Enlarge the model on hover
      this.el.setAttribute('animation__scale', {
        property: 'scale',
        to: '1.5 1.5 1.5',
        dur: 500,
        easing: 'easeOutElastic'
      });

      // Show a button to view the model closer
      const button = document.createElement('a-entity');
      button.setAttribute('geometry', {
        primitive: 'plane',
        width: 1,
        height: 0.3
      });
      button.setAttribute('material', {
        color: '#FF0000'
      });
      button.setAttribute('text', {
        value: 'View Closer',
        align: 'center',
        color: '#FFFFFF'
      });
      button.setAttribute('position', '0 -0.5 0');
      button.setAttribute('class', 'interactive-button');

      button.addEventListener('click', () => {
        // Move the player and model to a dedicated room for closer inspection
        this.teleportToRoom();
      });

      this.el.appendChild(button);
      this.button = button;
    });

    this.el.addEventListener('mouseleave', () => {
      // Reset the model size when not hovered
      this.el.removeAttribute('animation__scale');
      this.el.setAttribute('scale', '1 1 1');

      // Remove the "View Closer" button
      if (this.button) {
        this.el.removeChild(this.button);
        this.button = null;
      }
    });
  },

  teleportToRoom: function () {
    const scene = document.querySelector('a-scene');

    // Create a new room entity for the model
    const room = document.createElement('a-entity');
    room.setAttribute('geometry', {
      primitive: 'box',
      width: 5,
      height: 5,
      depth: 5
    });
    room.setAttribute('material', {
      color: '#FFFFFF'
    });
    room.setAttribute('position', '0 0 -10');

    const modelClone = this.el.cloneNode(true);
    modelClone.setAttribute('position', '0 1 0');
    modelClone.removeAttribute('animation');
    modelClone.removeAttribute('animation__rotation');

    room.appendChild(modelClone);
    scene.appendChild(room);

    // Move the player to the new room
    const rig = document.querySelector('#rig');
    rig.setAttribute('position', '0 0 -10');
  }
});