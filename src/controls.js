//THIS IS CONTROLS.JS
import * as THREE from "three";
export class Controls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement || document.body;

    // Movement
    this.forward = false;
    this.back = false;
    this.left = false;
    this.right = false;

    // Mouse rotation
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotation = { x: 0, y: 0 }; // Yaw (horizontal) and Pitch (vertical)

    this.initKeyboard();
    this.initMouse();
  }

  initKeyboard() {
    window.addEventListener("keydown", (e) => this.onKey(e, true));
    window.addEventListener("keyup", (e) => this.onKey(e, false));
  }

  onKey(e, pressed) {
    switch (e.code) {
      case "ArrowUp": this.forward = pressed; break;
      case "ArrowDown": this.back = pressed; break;
      case "ArrowLeft": this.left = pressed; break;
      case "ArrowRight": this.right = pressed; break;
      case "KeyW": this.forward = pressed; break;
      case "KeyS": this.back = pressed; break;
      case "KeyA": this.left = pressed; break;
      case "KeyD": this.right = pressed; break;
    }
  }

  initMouse() {
    this.domElement.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.previousMousePosition.x = e.clientX;
      this.previousMousePosition.y = e.clientY;
    });

    this.domElement.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    this.domElement.addEventListener("mousemove", (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.rotation.y -= deltaX * 0.005; // Horizontal (yaw)
      this.rotation.x -= deltaY * 0.005; // Vertical (pitch)
      this.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotation.x)); // Clamp

      this.previousMousePosition.x = e.clientX;
      this.previousMousePosition.y = e.clientY;
    });
  }

  updateCamera(playerPosition) {
    const radius = 5; // distance from player

    const offsetX = radius * Math.sin(this.rotation.y) * Math.cos(this.rotation.x);
    const offsetY = radius * Math.sin(this.rotation.x);
    const offsetZ = radius * Math.cos(this.rotation.y) * Math.cos(this.rotation.x);

    const cameraPosition = playerPosition.clone().add(new THREE.Vector3(offsetX, offsetY, offsetZ));

    this.camera.position.copy(cameraPosition);
    this.camera.lookAt(playerPosition);
  }
}

