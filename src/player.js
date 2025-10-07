import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import characterUrl from "../assets/models/character.glb?url";

export class Player {
  static instance = null; // 🔹 store singleton reference

  constructor(scene, levelObjects) {
    // If player already exists, return that instance
    if (Player.instance) {
      console.log("⚠️ Player instance already exists — reusing global instance.");
      return Player.instance;
    }

    // Otherwise, create it normally
    this.scene = scene;
    this.levelObjects = levelObjects;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    if (this.levelObjects) this.levelObjects.push(this.group);

    this.model = null;
    this.mixer = null;
    this.actions = {};
    this.activeAction = null;

    const loader = new GLTFLoader();
    loader.load(
      characterUrl,
      (gltf) => {
        console.log("✅ Player model loaded:", gltf);
        this.model = gltf.scene;
        this.model.scale.set(1, 1, 1);
        this.model.position.set(0, 0, 0);
        this.group.add(this.model);

        // Setup animations
        if (gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.model);
          gltf.animations.forEach((clip) => {
            this.actions[clip.name] = this.mixer.clipAction(clip);
          });
          if (this.actions["Idle"]) this.fadeToAction("Idle");
        }
      },
      undefined,
      (err) => console.error("Error loading player model:", err)
    );

    this.velocity = new THREE.Vector3();
    this.isMoving = false;

    // Store the instance globally
    Player.instance = this;
  }

  move(input) {
    const speed = 0.1;
    const direction = new THREE.Vector3();

    if (input.forward) direction.z -= 1;
    if (input.back) direction.z += 1;
    if (input.left) direction.x -= 1;
    if (input.right) direction.x += 1;

    if (direction.length() > 0) {
      direction.normalize();
      this.group.position.add(direction.multiplyScalar(speed));
      this.isMoving = true;
    } else {
      this.isMoving = false;
    }
  }

  update(delta = 0.016) {
    if (this.mixer) this.mixer.update(delta);

    if (this.isMoving && this.actions["Walk"]) this.fadeToAction("Walk");
    else if (!this.isMoving && this.actions["Idle"]) this.fadeToAction("Idle");
  }

  fadeToAction(name) {
    if (!this.actions[name] || this.activeAction === this.actions[name]) return;

    if (this.activeAction) this.activeAction.fadeOut(0.3);

    this.activeAction = this.actions[name];
    this.activeAction.reset().fadeIn(0.3).play();
  }

  reset(position = new THREE.Vector3(0, 0, 0)) {
    this.group.position.copy(position);
    this.velocity.set(0, 0, 0);
  }
}
