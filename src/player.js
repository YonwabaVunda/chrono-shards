import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';

export class Player {
  constructor(scene) {
    const geometry = new THREE.BoxGeometry(1, 1.5, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ffcc });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(0, 1, 0);
    scene.add(this.mesh);

    this.velocity = new THREE.Vector3();
  }

  move(input) {
    const speed = 0.1;
    const direction = new THREE.Vector3();

    if (input.forward) direction.z -= 1;
    if (input.back) direction.z += 1;
    if (input.left) direction.x -= 1;
    if (input.right) direction.x += 1;

    direction.normalize();

    this.mesh.position.add(direction.multiplyScalar(speed));
   }


  update() {
    // later: add gravity, physics
  }
}

