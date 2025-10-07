import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import characterUrl from "../assets/models/character.glb?url";

export class Player {
  static instance = null;

  constructor(scene, levelObjects) {
    if (Player.instance) return Player.instance;

    this.scene = scene;
    this.levelObjects = levelObjects;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    if (this.levelObjects) this.levelObjects.push(this.group);

    this.model = null;
    this.mixer = null;
    this.actions = {};
    this.activeAction = null;

    // Physics & control vars
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.direction = new THREE.Vector3(0, 0, 0);
    this.rotationSpeed = 6.0; // how fast character turns
    this.moveSpeed = 4.0;     // walk speed units/sec
    this.runMultiplier = 2.0; // run is 2x walk speed
    this.jumpStrength = 8.0;
    this.gravity = -20.0;
    this.isGrounded = true;
    this.isAttacking = false;
    this.currentSpeed = 0;

    // Load GLB
    const loader = new GLTFLoader();
    loader.load(
      characterUrl,
      (gltf) => {
        this.model = gltf.scene;
        this.model.scale.set(1, 1, 1);
        this.model.position.set(0, 0, 0);
        this.group.add(this.model);

        if (gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.model);
          gltf.animations.forEach((clip) => {
            this.actions[clip.name] = this.mixer.clipAction(clip);
          });
          this.fadeToAction("Idle");
        }
      },
      undefined,
      (err) => console.error("Error loading player model:", err)
    );

    Player.instance = this;
  }

  /** Handles player input */
  handleInput(input, delta) {
    if (!this.model || this.isAttacking) return;

    // Movement direction (local)
    this.direction.set(0, 0, 0);
    if (input.forward) this.direction.z -= 1;
    if (input.back) this.direction.z += 1;
    if (input.left) this.direction.x -= 1;
    if (input.right) this.direction.x += 1;

    const isMoving = this.direction.lengthSq() > 0;

    // Jump
    if (input.jump && this.isGrounded) {
      this.velocity.y = this.jumpStrength;
      this.isGrounded = false;
      this.fadeToAction("Jump");
    }

    // Attack
    if (input.attack && !this.isAttacking) {
      this.isAttacking = true;
      this.fadeToAction("Attack");
      this.actions["Attack"].onFinished = () => (this.isAttacking = false);
      this.actions["Attack"].clampWhenFinished = true;
      this.actions["Attack"].loop = THREE.LoopOnce;
      this.actions["Attack"].reset().play();
      return;
    }

    // Movement logic
    if (isMoving) {
      this.direction.normalize();
      // --- inside handleInput ---
      const targetAngle = Math.atan2(this.direction.x, this.direction.z);
      const currentRotation = this.group.rotation.y;
      const newRotation = this.lerpAngle(
        currentRotation,
        targetAngle,
        delta * this.rotationSpeed
      );
      this.group.rotation.y = newRotation;


      // Movement speed (shift = run)
      const moveSpeed = input.run
        ? this.moveSpeed * this.runMultiplier
        : this.moveSpeed;

      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.group.rotation.y);
      forward.multiplyScalar(moveSpeed * delta);
      this.group.position.add(forward);

      // Choose animation
      if (input.run && this.actions["Run"]) this.fadeToAction("Run");
      else if (this.actions["Walk"]) this.fadeToAction("Walk");
    } else {
      if (this.isGrounded && this.actions["Idle"]) this.fadeToAction("Idle");
    }
  }

  /** Update physics and animations */
  update(delta = 0.016) {
    if (this.mixer) this.mixer.update(delta);

    // Gravity
    if (!this.isGrounded) {
      this.velocity.y += this.gravity * delta;
      this.group.position.y += this.velocity.y * delta;

      // Simple ground collision
      if (this.group.position.y <= 0) {
        this.group.position.y = 0;
        this.velocity.y = 0;
        this.isGrounded = true;
        if (!this.isAttacking) this.fadeToAction("Idle");
      }
    }
  }

  fadeToAction(name) {
    if (!this.actions[name] || this.activeAction === this.actions[name]) return;

    if (this.activeAction) {
      this.activeAction.fadeOut(0.2);
    }

    this.activeAction = this.actions[name];
    this.activeAction.reset().fadeIn(0.2).play();
  }

  reset(position = new THREE.Vector3(0, 0, 0)) {
    this.group.position.copy(position);
    this.velocity.set(0, 0, 0);
  }
  // Smooth angle interpolation helper
lerpAngle(a, b, t) {
  const delta = ((((b - a) + Math.PI) % (2 * Math.PI)) - Math.PI);
  return a + delta * t;
}

}
