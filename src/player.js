import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import characterUrl from "../assets/models/character.glb?url";

export class Player {
  static instance = null;

  constructor(scene, levelObjects = [], collisionSystem = null) {
    // If an instance already exists, attach collisionSystem if provided and missing, then return it.
    if (Player.instance) {
      if (collisionSystem && !Player.instance.collisionSystem) {
        Player.instance.collisionSystem = collisionSystem;
      }
      return Player.instance;
    }

    this.scene = scene;
    this.levelObjects = levelObjects;
    this.collisionSystem = collisionSystem; // store reference (may be null)
    this.group = new THREE.Group();
    this.scene.add(this.group);
    if (this.levelObjects) this.levelObjects.push(this.group);
    this._prevPosition = this.group.position.clone(); // for simple collision revert
    console.log('Player: constructed. hasCollisionSystem=', !!this.collisionSystem);

    this.model = null;
    this.mixer = null;
    this.actions = {};
    this.activeAction = null;

    // Physics & control vars
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.direction = new THREE.Vector3(0, 0, 0);
    this.rotationSpeed = 3.0; // how fast character turns
    this.moveSpeed = 2.0;     // walk speed units/sec
    this.runMultiplier = 2.0; // run is 2x walk speed
    this.jumpStrength = 6.0;
    this.gravity = -30.0;
    this.isGrounded = true;
    this.isAttacking = false;
    this.currentSpeed = 0;

    // keep duration for fallback
    this.attackDuration = 0.5; // seconds

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
    if (input.forward) this.direction.z += 1;
    if (input.back) this.direction.z -= 1;
    if (input.left) this.direction.x += 1;
    if (input.right) this.direction.x -= 1;

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

      const action = this.actions["Attack"];
      if (action) {
        action.reset();
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
        action.play();

        if (this.mixer) {
          const onFinished = (e) => {
            if (e.action === action) {
              this.isAttacking = false;
              this.mixer.removeEventListener("finished", onFinished);
            }
          };
          this.mixer.addEventListener("finished", onFinished);
        } else {
          // fallback if mixer not ready
          setTimeout(() => (this.isAttacking = false), this.attackDuration * 1000);
        }
      } else {
        // no attack animation available — use fallback timeout to re-enable input
        setTimeout(() => (this.isAttacking = false), this.attackDuration * 1000);
      }

      return;
    }

    // Movement logic
    // Movement logic in Player.handleInput
if (isMoving) {
  this.direction.normalize();

  // Align movement with camera orientation
  const cameraYaw = input.rotationY;
  this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);

  const targetAngle = Math.atan2(this.direction.x, this.direction.z);
  const currentRotation = this.group.rotation.y;
  const newRotation = this.lerpAngle(currentRotation, targetAngle, delta * this.rotationSpeed);
  this.group.rotation.y = newRotation;

  const moveSpeed = input.run ? this.moveSpeed * this.runMultiplier : this.moveSpeed;
  const moveVector = this.direction.clone().multiplyScalar(moveSpeed * delta);
  this.group.position.add(moveVector);

  // Animation
  if (input.run && this.actions["Run"]) this.fadeToAction("Run");
  else if (this.actions["Walk"]) this.fadeToAction("Walk");
}
    else {
      if (this.isGrounded && this.actions["Idle"]) this.fadeToAction("Idle");
    }
  }

  /** Update physics and animations */
  update(delta = 0.016) {
    // save previous position (clone) for collision response
    this._prevPosition.copy(this.group.position);
    //console.log('Player.update called', this.group.position.toArray(), 'delta=', delta);

    if (this.mixer) this.mixer.update(delta);
    else /* keep compatibility */ null;

    // Gravity
    if (!this.isGrounded) {
      this.velocity.y += this.gravity * delta;
      this.group.position.y += this.velocity.y * delta;

      if (this.group.position.y <= 0) {
        this.group.position.y = 0;
        this.velocity.y = 0;
        this.isGrounded = true;
        if (!this.isAttacking) this.fadeToAction("Idle");
      }
    }

    // Better collision handling: ask for a push response and apply it instead of full revert.
    if (this.collisionSystem) {
      try {
        const response = this.collisionSystem.getCollisionResponse(this.group.position, this._prevPosition, 0.5);
        if (response) {
          // apply separation vector
          this.group.position.add(response);
          // zero velocity along the axis we pushed on to avoid immediately re-colliding
          if (Math.abs(response.x) > 0) this.velocity.x = 0;
          if (Math.abs(response.y) > 0) this.velocity.y = 0;
          if (Math.abs(response.z) > 0) this.velocity.z = 0;
          console.info('Player: collision resolved by push', response.toArray());
        }
        // update _prevPosition to the resolved position for next frame
        this._prevPosition.copy(this.group.position);
      } catch (e) {
        console.error('Player: error calling collisionSystem.getCollisionResponse', e);
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
