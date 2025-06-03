/* jshint esversion: 9 */
/* global THREE, AFRAME */


AFRAME.registerComponent("hide-on-hit-test-start", {
  init: function() {
    var self = this;
    this.el.sceneEl.addEventListener("ar-hit-test-start", function() {
      self.el.object3D.visible = false;
    });
    this.el.sceneEl.addEventListener("exit-vr", function() {
      self.el.object3D.visible = true;
    });
  }
});

AFRAME.registerComponent("origin-on-ar-start", {
  init: function() {
    var self = this.el;

    this.el.sceneEl.addEventListener("enter-vr", function() {
      if (this.is("ar-mode")) {
        self.setAttribute('position', {x:0,y:0,z:0});
        self.setAttribute('rotation', {x:0,y:0,z:0});
      }
    });
  }
});


AFRAME.registerComponent("match-position-by-id", {
  schema: {
    default: ''
  },
  tick() {
    let obj;
    
    if (this.data === 'xr-camera') {
      const xrCamera = this.el.sceneEl.renderer.xr.getCameraPose();
      if (xrCamera) {
        this.el.object3D.position.copy(xrCamera.transform.position);
        this.el.object3D.quaternion.copy(xrCamera.transform.orientation);
        return;
      }
      obj = this.el.sceneEl.camera;
    } else {
      obj = document.getElementById(this.data).object3D;
    }
    if (obj) {
      this.el.object3D.position.copy(obj.position);
      this.el.object3D.quaternion.copy(obj.quaternion);
    }

  }
});

AFRAME.registerComponent("xr-follow", {
  schema: {},
  init() {
  },
  tick() {
    const scene = this.el.sceneEl;
    const camera = scene.camera;
    const object3D = this.el.object3D;
    camera.getWorldPosition(object3D.position);
    object3D.parent.worldToLocal(object3D.position);
  }
});

AFRAME.registerComponent("exit-on", {
  schema: {
    default: 'click'
  },
  update(oldEvent) {
    const newEvent = this.data;
    this.el.removeEventListener(oldEvent, this.exitVR);
    this.el.addEventListener(newEvent, this.exitVR);
  },
  exitVR() {
    this.sceneEl.exitVR();
  }
});

AFRAME.registerComponent("physx-body-from-model", {
  schema: {
    type: 'string',
    default: ''
  },
  init () {
    this.onLoad = () => {
      this.el.setAttribute("physx-body", this.data);
      this.el.removeAttribute("physx-body-from-model");
    };
    this.el.addEventListener('object3dset', this.onLoad);
  },
  remove () {
    this.el.removeEventListener('object3dset', this.onLoad);
  }
});

AFRAME.registerComponent("toggle-physics", {
  events: {
    pickup: function() {
      this.el.addState('grabbed');
    },
    putdown: function(e) {
      this.el.removeState('grabbed');
      if (e.detail.frame && e.detail.inputSource) {
        const referenceSpace = this.el.sceneEl.renderer.xr.getReferenceSpace();
        const pose = e.detail.frame.getPose(e.detail.inputSource.gripSpace, referenceSpace);
        if (pose && pose.angularVelocity) {
          this.el.components['physx-body'].rigidBody.setAngularVelocity(pose.angularVelocity, true);
        }
        if (pose && pose.linearVelocity) {
          this.el.components['physx-body'].rigidBody.setLinearVelocity(pose.linearVelocity, true);
        }
      }
    }
  }
});


AFRAME.registerComponent('bforward-controls', {
  init: function () {
    this.isBDown = false;
    this.direction = new THREE.Vector3();
    console.log('[bforward-controls] Component initialized on', this.el);
    // Listen for bbuttondown/bbuttonup globally
    window.addEventListener('bbuttondown', () => {
      this.isBDown = true;
      console.log('[bforward-controls] B button DOWN (window)');
    });
    window.addEventListener('bbuttonup', () => {
      this.isBDown = false;
      console.log('[bforward-controls] B button UP (window)');
    });
  },
  // tick: function () {
  //   // Log every tick to confirm the component is alive
  //   // (remove or comment this out if too spammy)
  //   // console.log('[bforward-controls] tick, isBDown:', this.isBDown);
  // },
  isVelocityActive: function () {
    console.log('[bforward-controls] isVelocityActive:', this.isBDown);
    return this.isBDown;
  },
  getVelocityDelta: function (deltaMS) {
    if (!this.isBDown) {
      console.log('[bforward-controls] getVelocityDelta: not walking');
      return new THREE.Vector3();
    }
    let camera = this.el.querySelector('#head');
    if (!camera) {
      camera = this.el.sceneEl.camera;
      if (!camera) {
        console.warn('[bforward-controls] getVelocityDelta: No camera found');
        return new THREE.Vector3();
      }
      console.log('[bforward-controls] Using sceneEl.camera as fallback');
    }
    let dir = new THREE.Vector3();
    camera.object3D.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const velocity = dir.multiplyScalar(1.5 * deltaMS / 1000);
    console.log('[bforward-controls] getVelocityDelta:', velocity);
    return velocity;
  }
});