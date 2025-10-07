import * as THREE from "three";
import { Player } from "../player.js";
import { Controls } from "../controls.js";
import { Shard } from "../shard.js";

export class Level1 {
  constructor(scene, camera, levelObjects) {
    this.scene = scene;
    this.camera = camera;
    this.levelObjects = levelObjects; // array to track all objects

    // Player
    this.player = Player.instance || new Player(this.scene, this.objects);
    //this.player.reset(new THREE.Vector3(0, 0, 0)); // optional reposition

    // Controls
    this.controls = new Controls(camera, document.getElementById("gameCanvas"));

    // Shard
    this.shard = new Shard(scene, this.levelObjects, new THREE.Vector3(5, 1, 0));
    this.shardCollected = false;

    // Floor
    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.MeshStandardMaterial({ color: 0xddddaa })
    );
    this.floor.rotation.x = -Math.PI / 2;
    scene.add(this.floor);
    this.levelObjects.push(this.floor);

    // Directional light (optional: global lights can be added once in main.js)
    this.light = new THREE.DirectionalLight(0xffffff, 1);
    this.light.position.set(5, 10, 5);
    scene.add(this.light);
    this.levelObjects.push(this.light);

    // Callback for shard collection
    this.onShardCollected = null;
  }

  update(delta) {
    this.player.move(this.controls);
    this.player.update(delta);
    this.shard.update();
    this.controls.updateCamera(this.player.group.position);

    if (!this.shardCollected && this.shard.checkCollision(this.player.group.position)) {
      this.shardCollected = true;
      if (this.onShardCollected) this.onShardCollected();
    }
  }

  dispose() {
    // Remove all objects in levelObjects
    this.objects.forEach((obj) => {
      if (obj !== this.player.group) this.scene.remove(obj);
    });
    this.objects = []; // clear array
  }
}
