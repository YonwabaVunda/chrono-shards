import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';


export class Shard {
  constructor(scene, position = new THREE.Vector3(0, 1, 0)) {
    this.collected = false;

    const geometry = new THREE.IcosahedronGeometry(0.3, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.9,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    scene.add(this.mesh);
  }

  update() {
    // rotate for visual effect
    this.mesh.rotation.y += 0.01;
  }

  checkCollision(playerPosition) {
    const distance = this.mesh.position.distanceTo(playerPosition);
    if (distance < 1 && !this.collected) {
      this.collected = true;
      this.mesh.visible = false;
      return true;
    }
    return false;
  }
}
