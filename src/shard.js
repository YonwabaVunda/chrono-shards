// src/components/Shard.js
import * as THREE from 'three';

export class Shard {
  constructor(scene, position = new THREE.Vector3(0, 1, 0)) {
    this.collected = false;
    this.position = position;
    this.collisionRadius = 2.5;

    // Create geometry and material
    const geometry = new THREE.IcosahedronGeometry(0.5, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.9,
    });

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    this.mesh.name = 'chrono_shard';
    scene.add(this.mesh);

    console.log(`Shard created at:`, this.mesh.position);
  }

  update() {
    if (!this.mesh || this.collected) return;

    // Rotate and float animation
    this.mesh.rotation.y += 0.01;
    this.mesh.position.y = this.position.y + Math.sin(Date.now() * 0.003) * 0.2;
  }

  checkCollision(playerPosition) {
    if (!this.mesh || this.collected) return false;

    const distance = this.mesh.position.distanceTo(playerPosition);

    // Debug log when nearby
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

  dispose() {
    if (this.mesh) {
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.mesh.removeFromParent();
    }
  }
}
