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

    // Normalize playerPosition to a THREE.Vector3 (accept Vector3, plain object, or array)
    let playerPosVec;
    if (playerPosition instanceof THREE.Vector3) {
      playerPosVec = playerPosition.clone();
    } else if (Array.isArray(playerPosition) && playerPosition.length >= 3) {
      playerPosVec = new THREE.Vector3(playerPosition[0], playerPosition[1], playerPosition[2]);
    } else if (playerPosition && typeof playerPosition.x === 'number') {
      playerPosVec = new THREE.Vector3(playerPosition.x, playerPosition.y || 0, playerPosition.z || 0);
    } else {
      console.warn('Shard.checkCollision: invalid playerPosition', playerPosition);
      return false;
    }

    // Use world position for the shard in case it's parented/animated
    const shardWorldPos = new THREE.Vector3();
    this.mesh.getWorldPosition(shardWorldPos);

    const distance = shardWorldPos.distanceTo(playerPosVec);

    // Always helpful debug output — will only print when nearby to avoid spam
    if (distance < 5) {
      console.log(`Shard.checkCollision: shardPos=${shardWorldPos.toArray()} playerPos=${playerPosVec.toArray()} distance=${distance.toFixed(2)} radius=${this.collisionRadius}`);
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
