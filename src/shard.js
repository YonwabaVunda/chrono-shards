import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';

export class Shard {
  constructor(scene, position = new THREE.Vector3(0, 1, 0)) {
    this.collected = false;
    this.position = position;
    this.collisionRadius = 2.5;

    const geometry = new THREE.IcosahedronGeometry(0.5, 1); // Larger size for visibility
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.9,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    this.mesh.name = "chrono_shard";
    scene.add(this.mesh);
    
    console.log(`Shard created at:`, this.mesh.position);
  }

  update() {
    // Check if mesh exists and shard is not collected
    if (!this.mesh || this.collected) {
      return; // Skip update if no mesh or already collected
    }

    // Rotate and float animation
    this.mesh.rotation.y += 0.01;
    this.mesh.position.y = this.position.y + Math.sin(Date.now() * 0.003) * 0.2;
  }

  checkCollision(playerPosition) {
    // Check if mesh exists and shard is not collected
    if (!this.mesh || this.collected) {
      return false;
    }
    
    const distance = this.mesh.position.distanceTo(playerPosition);
    
    // DEBUG: Only log when getting close
    if (distance < 5) {
      console.log(`Distance to shard: ${distance.toFixed(2)} (collision at < ${this.collisionRadius})`);
    }
    
    if (distance < this.collisionRadius) {
      console.log('🎉 SHARD COLLECTED! Distance:', distance.toFixed(2));
      this.collected = true;
      this.mesh.visible = false;
      return true;
    }
    return false;
  }
}