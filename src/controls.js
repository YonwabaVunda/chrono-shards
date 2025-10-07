//THIS IS CONTROLS.JS
import * as THREE from "three";

export class Controls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement || document.body;

    // Movement inputs
    this.forward = false;
    this.back = false;
    this.left = false;
    this.right = false;
    this.run = false;
    this.jump = false;
    this.attack = false;

    // Mouse camera rotation
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotation = { x: 0, y: 0 }; // yaw (horizontal) + pitch (vertical)

    this.initKeyboard();
    this.initMouse();
  }

  // --- Keyboard setup ---
  initKeyboard() {
    window.addEventListener("keydown", (e) => this.onKey(e, true));
    window.addEventListener("keyup", (e) => this.onKey(e, false));
  }

  onKey(e, pressed) {
    switch (e.code) {
      case "ArrowUp":
      case "KeyW":
        this.forward = pressed;
        break;
      case "ArrowDown":
      case "KeyS":
        this.back = pressed;
        break;
      case "ArrowLeft":
      case "KeyA":
        this.left = pressed;
        break;
      case "ArrowRight":
      case "KeyD":
        this.right = pressed;
        break;
      case "ShiftLeft":
      case "ShiftRight":
        this.run = pressed;
        break;
      case "Space":
        this.jump = pressed;
        break;
      case "KeyF":
        this.attack = pressed;
        break;
    }
  }

  // --- Mouse look ---
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

      this.rotation.y -= deltaX * 0.005; // yaw (left/right)
      this.rotation.x -= deltaY * 0.005; // pitch (up/down)
      this.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.rotation.x)); // clamp

      this.previousMousePosition.x = e.clientX;
      this.previousMousePosition.y = e.clientY;
    });
  }

  // --- Camera follow logic ---
  updateCamera(playerPosition) {
    const distance = 6; // distance behind player
    const height = 3;   // camera height

    const offsetX = distance * Math.sin(this.rotation.y) * Math.cos(this.rotation.x);
    const offsetY = height + distance * Math.sin(this.rotation.x);
    const offsetZ = distance * Math.cos(this.rotation.y) * Math.cos(this.rotation.x);

    const targetPos = playerPosition.clone();
    const cameraPos = playerPosition.clone().add(new THREE.Vector3(offsetX, offsetY, offsetZ));

    // Smooth camera follow
    this.camera.position.lerp(cameraPos, 0.1);
    this.camera.lookAt(targetPos);
  }

  // --- Pack all inputs into one object for Player ---
  getInputState() {
    return {
      forward: this.forward,
      back: this.back,
      left: this.left,
      right: this.right,
      run: this.run,
      jump: this.jump,
      attack: this.attack,
    };
  }
}
