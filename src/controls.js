// src/controls/Controls.js
import * as THREE from "three";

export class Controls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement || document.body;

    // Input states
    this.forward = false;
    this.back = false;
    this.left = false;
    this.right = false;
    this.run = false;
    this.jump = false;
    this.attack = false;

    // Mouse rotation
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotation = { x: 0, y: 0 }; // pitch + yaw

    this.initKeyboard();
    this.initMouse();
  }

  // Keyboard listeners
  initKeyboard() {
    window.addEventListener("keydown", (e) => this.onKey(e, true));
    window.addEventListener("keyup", (e) => this.onKey(e, false));
  }

  onKey(e, pressed) {
    switch (e.code) {
      case "KeyW":
      case "ArrowUp":
        this.forward = pressed;
        break;
      case "KeyS":
      case "ArrowDown":
        this.back = pressed;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.left = pressed;
        break;
      case "KeyD":
      case "ArrowRight":
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

  // Mouse rotation (camera orbit)
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

      // Reverse horizontal rotation so dragging feels natural
      this.rotation.y += deltaX * 0.005; // yaw
      this.rotation.x -= deltaY * 0.005; // pitch
      this.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.rotation.x));

      this.previousMousePosition.x = e.clientX;
      this.previousMousePosition.y = e.clientY;
    });
  }

  // Camera follows the player
  updateCamera(playerPosition) {
    const distance = 6;
    const height = 3;

    const offsetX = distance * Math.sin(this.rotation.y) * Math.cos(this.rotation.x);
    const offsetY = height + distance * Math.sin(this.rotation.x);
    const offsetZ = distance * Math.cos(this.rotation.y) * Math.cos(this.rotation.x);

    const cameraPos = playerPosition.clone().add(new THREE.Vector3(-offsetX, offsetY, -offsetZ));
    this.camera.position.lerp(cameraPos, 0.1);
    this.camera.lookAt(playerPosition);
  }

  getInputState() {
    return {
      forward: this.forward,
      back: this.back,
      left: this.left,
      right: this.right,
      run: this.run,
      jump: this.jump,
      attack: this.attack,
      rotationY: this.rotation.y, // Pass yaw to Player
    };
  }
}
