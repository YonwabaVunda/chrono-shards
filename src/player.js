import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Player {
  constructor(scene) {
    this.mesh = null;
    this.mixer = null;
    this.actions = {};
    this.velocity = new THREE.Vector3();
    this.isMoving = false;
    this.modelLoaded = false;
    this.currentAction = null;
    this.jumpVelocity = 0;
    this.isGrounded = true;

    // Collision properties
    this.radius = 0.5;
    this.previousPosition = new THREE.Vector3();

    // Animation states
    this.animationStates = {
      IDLE: 'idle',
      WALK: 'walk',
      RUN: 'run', 
      JUMP: 'jump',
      FALL: 'fall'
    };
    this.currentState = this.animationStates.IDLE;

    this.createPlaceholder(scene);
    this.loadModel(scene);
  }

  loadModel(scene) {
    const loader = new GLTFLoader();
    loader.load(
      'assets/models/time_traveller/scene.gltf',
      (gltf) => {
        if (this.placeholder) {
          scene.remove(this.placeholder);
        }

        this.mesh = gltf.scene;
        this.mesh.scale.set(1.2, 1.2, 1.2);
        this.mesh.position.set(0, 0, 0);
        this.mesh.rotation.y = Math.PI; // Fix facing direction
        
        // Enable shadows
        this.mesh.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(this.mesh);
        this.modelLoaded = true;

        // SETUP ANIMATION SYSTEM
        this.setupAnimations(gltf);
        
        console.log('Player model loaded with animations:', Object.keys(this.actions));
      },
      undefined,
      (error) => {
        console.error('Error loading player model:', error);
      }
    );
  }

  setupAnimations(gltf) {
    if (!gltf.animations || gltf.animations.length === 0) {
      console.warn('No animations found in model');
      return;
    }

    this.mixer = new THREE.AnimationMixer(this.mesh);
    
    // DEBUG: Print all available animation names
    console.log('=== AVAILABLE ANIMATIONS ===');
    gltf.animations.forEach((clip, index) => {
      console.log(`Animation ${index}: "${clip.name}"`);
    });

    // Store ALL animations with their exact names
    gltf.animations.forEach((clip, index) => {
      const action = this.mixer.clipAction(clip);
      this.actions[clip.name] = action; // Store with exact name
      
      // Auto-play the first animation as idle
      if (index === 0) {
        action.play();
        this.currentAction = clip.name;
      }
    });

    // Print what we actually stored
    console.log('Stored animations:', Object.keys(this.actions));
  }

  fadeToAction(actionName, duration = 0.2) {
    if (this.currentAction === actionName) return;
    
    const newAction = this.actions[actionName];
    const oldAction = this.actions[this.currentAction];

    if (!newAction) {
      console.warn(`Animation "${actionName}" not found`);
      return;
    }

    // Prepare new action
    newAction.reset();
    newAction.fadeIn(duration);
    newAction.play();

    // Fade out old action
    if (oldAction) {
      oldAction.fadeOut(duration);
    }

    this.currentAction = actionName;
    this.currentState = actionName;
  }

  move(input, collisionSystem = null) {
    if (!this.mesh) return;

    // Store previous position for collision detection
    this.previousPosition.copy(this.mesh.position);

    const moveDirection = new THREE.Vector3();
    let isMoving = false;
    let isRunning = false;

    // Get input (YOUR ORIGINAL MOVEMENT SYSTEM)
    if (input.forward) moveDirection.z -= 1;
    if (input.back) moveDirection.z += 1;
    if (input.left) moveDirection.x -= 1;
    if (input.right) moveDirection.x += 1;

    if (input.shift) {
      isRunning = true;
    }

    if (input.space && this.isGrounded) {
      this.jump();
    }

    // Apply movement with collision detection
    if (moveDirection.length() > 0.1) {
      moveDirection.normalize();
      const speed = isRunning ? 0.2 : 0.1;
      
      // Calculate intended movement
      const intendedPosition = this.mesh.position.clone();
      intendedPosition.add(moveDirection.multiplyScalar(speed));

      // Check collision if collision system exists
      if (collisionSystem) {
        if (collisionSystem.checkCollision(intendedPosition, this.radius)) {
          // Collision detected - get response
          const response = collisionSystem.getCollisionResponse(
            intendedPosition, 
            this.previousPosition, 
            this.radius
          );
          
          if (response) {
            // Apply collision response (slide along walls)
            this.mesh.position.copy(this.previousPosition).add(response);
          } else {
            // If no specific response, just don't move
            this.mesh.position.copy(this.previousPosition);
          }
        } else {
          // No collision - move as intended
          this.mesh.position.copy(intendedPosition);
        }
      } else {
        // No collision system - move freely (YOUR ORIGINAL BEHAVIOR)
        this.mesh.position.copy(intendedPosition);
      }

      // YOUR ORIGINAL ROTATION SYSTEM
      const angle = Math.atan2(moveDirection.x, moveDirection.z);
      this.mesh.rotation.y = angle;
      
      isMoving = true;
    }

    // Update animations based on movement state
    this.updateAnimations(isMoving, isRunning);
    this.isMoving = isMoving;
  }

  updateAnimations(isMoving, isRunning) {
    // If no animations, just return
    if (Object.keys(this.actions).length === 0) return;

    // Handle jumping/falling states first (they have priority)
    if (!this.isGrounded) {
      if (this.jumpVelocity > 0) {
        this.fadeToAction(this.animationStates.JUMP, 0.1);
      } else {
        this.fadeToAction(this.animationStates.FALL, 0.1);
      }
      return;
    }

    // Handle grounded movement states
    if (isMoving) {
      if (isRunning) {
        this.fadeToAction(this.animationStates.RUN, 0.2);
      } else {
        this.fadeToAction(this.animationStates.WALK, 0.2);
      }
    } else {
      this.fadeToAction(this.animationStates.IDLE, 0.2);
    }
  }

  jump() {
    if (!this.isGrounded) return;
    
    this.jumpVelocity = 0.15;
    this.isGrounded = false;
    
    // Only play jump animation if we have it
    if (this.actions[this.animationStates.JUMP]) {
      this.fadeToAction(this.animationStates.JUMP, 0.1);
    }
  }

  createPlaceholder(scene) {
    const geometry = new THREE.CapsuleGeometry(0.3, 1, 4, 8);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x00ffcc,
      transparent: true,
      opacity: 0.7
    });
    this.placeholder = new THREE.Mesh(geometry, material);
    this.placeholder.position.set(0, 1, 0);
    this.placeholder.castShadow = true;
    scene.add(this.placeholder);
    
    this.mesh = this.placeholder;
    this.previousPosition.copy(this.mesh.position);
  }

  update(deltaTime) {
    // Update animations
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    // Update physics (jumping/gravity)
    this.updatePhysics(deltaTime);
  }

  updatePhysics(deltaTime) {
    if (!this.isGrounded) {
      // Apply gravity
      this.jumpVelocity -= 0.02; // Gravity force
      this.mesh.position.y += this.jumpVelocity;

      // Ground collision
      if (this.mesh.position.y <= 0.5) {
        this.mesh.position.y = 0.5;
        this.jumpVelocity = 0;
        this.isGrounded = true;
        
        // Return to appropriate animation after landing
        if (this.isMoving) {
          this.fadeToAction(this.animationStates.WALK, 0.1);
        } else {
          this.fadeToAction(this.animationStates.IDLE, 0.1);
        }
      }
    }
  }

  // Helper method to debug available animations
  listAnimations() {
    console.log('Available animations:', Object.keys(this.actions));
  }
}