import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';
import { Player } from "../player.js";
import { Controls } from "../controls.js";
import { Shard } from "../shard.js";

export class Level1 {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.player = new Player(scene);
    this.controls = new Controls(camera, document.getElementById("gameCanvas"));


    this.shard = new Shard(scene, new THREE.Vector3(5, 1, 0)); // place somewhere visible

    this.onShardCollected = null; // callback to game.js
    this.shardCollected = false;

    // floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0xddddaa })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // lighting
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    scene.add(light);
  }

  update() {
    this.player.move(this.controls);
    this.player.update();
    this.shard.update();
    this.camera.lookAt(this.player.mesh.position);
    this.controls.updateCamera(this.player.mesh.position);  // Camera orbits player


    if (!this.shardCollected && this.shard.checkCollision(this.player.mesh.position)) {
      this.shardCollected = true;
      if (this.onShardCollected) this.onShardCollected(); // trigger level transition
    }
  }
}
