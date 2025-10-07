import * as THREE from "three";

export class Shard {
  constructor(scene, levelObjects, position = new THREE.Vector3(0, 1, 0)) {
    this.collected = false;
    this.scene = scene;

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

    if (levelObjects) levelObjects.push(this.mesh);
  }

  update() {
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

  dispose() {
    this.scene.remove(this.mesh);
    if (this.mesh.geometry) this.mesh.geometry.dispose();
    if (this.mesh.material) this.mesh.material.dispose();
  }
}
