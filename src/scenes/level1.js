import * as THREE from "three";
import { Player } from "../player.js";
import { Controls } from "../controls.js";
import { Shard } from "../shard.js";
import { CollisionSystem } from "../collision.js";

export class Level1 {
  constructor(scene, camera, levelObjects = []) {
    this.scene = scene;
    this.camera = camera;
    this.levelObjects = levelObjects;
    this.collisionSystem = new CollisionSystem();

    // --- Player ---
    this.player = Player.instance || new Player(this.scene, this.levelObjects);
    this.controls = new Controls(camera, document.getElementById("gameCanvas"));

    // --- Environment Setup ---
    this.createAncientRuinsEnvironment();
    this.collisionSystem.addBoundary(-22, 22, -22, 22);

    // --- Shards ---
    this.shards = [
      new Shard(scene, this.levelObjects, new THREE.Vector3(8, 2, -5)),
      new Shard(scene, this.levelObjects, new THREE.Vector3(-6, 2, 8)),
      new Shard(scene, this.levelObjects, new THREE.Vector3(15, 3, 12)),
    ];
    this.shardsCollected = 0;
    this.totalShards = this.shards.length;
    this.onAllShardsCollected = null;
  }

  // ========================
  // Environment Construction
  // ========================
  createAncientRuinsEnvironment() {
    this.createTerrain();
    this.createTempleRuins();
    this.createSurroundingRuins();
    this.createVegetation();
    this.createLighting();
  }

  createTerrain() {
    const groundGeometry = new THREE.PlaneGeometry(44, 44, 32, 32);
    const positions = groundGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const y = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 1.5;
      positions.setY(i, y);
    }
    positions.needsUpdate = true;

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b7355,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;

    this.scene.add(ground);
    this.levelObjects.push(ground);
    this.collisionSystem.addCollider(ground);
  }

  createTempleRuins() {
    const platform = new THREE.Mesh(
      new THREE.BoxGeometry(18, 1, 12),
      new THREE.MeshStandardMaterial({ color: 0x7a6b5f })
    );
    platform.position.set(0, 0.5, -15);
    platform.castShadow = true;
    this.scene.add(platform);
    this.levelObjects.push(platform);
    this.collisionSystem.addCollider(platform);

    const columnPositions = [
      [-7, 0, -10], [-7, 0, -20], [7, 0, -10], [7, 0, -20],
      [-3.5, 0, -15], [3.5, 0, -15],
    ];

    columnPositions.forEach((pos) => {
      const column = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
      );
      column.position.set(pos[0], 4, pos[2]);
      column.castShadow = true;
      this.scene.add(column);
      this.levelObjects.push(column);
      this.collisionSystem.addCollider(column);
    });

    const altar = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.5, 2),
      new THREE.MeshStandardMaterial({ color: 0x996633 })
    );
    altar.position.set(0, 1.25, -15);
    altar.castShadow = true;
    this.scene.add(altar);
    this.levelObjects.push(altar);
    this.collisionSystem.addCollider(altar);
  }

  createSurroundingRuins() {
    const walls = [
      { pos: [-10, 2, 0], size: [1, 4, 15], rot: 0 },
      { pos: [10, 2, 0], size: [1, 4, 15], rot: 0 },
      { pos: [0, 2, 10], size: [20, 4, 1], rot: 0 },
      { pos: [-5, 2, -5], size: [1, 4, 8], rot: Math.PI / 4 },
    ];

    walls.forEach((wall) => {
      const wallMesh = new THREE.Mesh(
        new THREE.BoxGeometry(...wall.size),
        new THREE.MeshStandardMaterial({ color: 0x887766 })
      );
      wallMesh.position.set(...wall.pos);
      wallMesh.rotation.y = wall.rot;
      wallMesh.castShadow = true;
      this.scene.add(wallMesh);
      this.levelObjects.push(wallMesh);
      this.collisionSystem.addCollider(wallMesh);
    });

    this.createRocksAndRubble();
  }

  createRocksAndRubble() {
    const rocks = [
      [5, 0.5, 5], [-8, 0.3, 12], [12, 0.7, -8],
      [-12, 0.4, -5], [3, 0.6, -3], [-15, 0.5, 8], [18, 0.8, 5],
    ];

    rocks.forEach((pos) => {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.8 + Math.random() * 0.7, 0),
        new THREE.MeshStandardMaterial({ color: 0x666666 })
      );
      rock.position.set(...pos);
      rock.castShadow = true;
      this.scene.add(rock);
      this.levelObjects.push(rock);
      this.collisionSystem.addCollider(rock);
    });
  }

  createVegetation() {
    const treePositions = [
      [-15, 0, 15], [12, 0, 18], [-18, 0, -8],
      [16, 0, -15], [-8, 0, 18], [18, 0, 8],
    ];
    treePositions.forEach((pos) => this.createTree(...pos));

    for (let i = 0; i < 15; i++) {
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(0.5 + Math.random() * 0.3, 6, 6),
        new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
      );
      bush.position.set(-20 + Math.random() * 40, 0.5, -20 + Math.random() * 40);
      bush.castShadow = true;
      this.scene.add(bush);
      this.levelObjects.push(bush);
      this.collisionSystem.addCollider(bush);
    }
  }

  createTree(x, y, z) {
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x5d4037 })
    );
    trunk.position.set(x, 2, z);

    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(2.5, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
    );
    leaves.position.set(x, 5, z);

    trunk.castShadow = true;
    leaves.castShadow = true;

    this.scene.add(trunk);
    this.scene.add(leaves);
    this.levelObjects.push(trunk, leaves);
    this.collisionSystem.addCollider(trunk);
  }

  createLighting() {
    const sunLight = new THREE.DirectionalLight(0xffe6c2, 1);
    sunLight.position.set(10, 15, 5);
    sunLight.castShadow = true;
    this.scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);
  }

  // ========================
  // Update Loop
  // ========================
  update(delta) {
    this.player.handleInput(this.controls, delta);
    this.player.update(delta);
    this.controls.updateCamera(this.player.group.position);

    // --- Shard collection logic ---
    this.shards.forEach((shard, index) => {
      if (!shard.collected && shard.checkCollision(this.player.group.position)) {
        console.log(`💎 Ancient Shard ${index + 1} collected!`);
        shard.collected = true;
        shard.mesh.visible = false;
        this.shardsCollected++;

        if (this.shardsCollected === this.totalShards) {
          console.log("⏳ All ancient shards collected! Opening time portal...");
          this.createCompletionEffects();

          setTimeout(() => {
            if (this.onAllShardsCollected) this.onAllShardsCollected();
          }, 2000);
        }
      }
    });
  }

  createCompletionEffects() {
    const portalGeometry = new THREE.RingGeometry(1, 3, 32);
    const portalMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const portal = new THREE.Mesh(portalGeometry, portalMaterial);
    portal.rotation.x = Math.PI / 2;
    portal.position.set(0, 1, 0);
    this.scene.add(portal);
    this.portal = portal;
  }

  dispose() {
    this.levelObjects.forEach((obj) => {
      if (obj !== this.player.group) this.scene.remove(obj);
    });
    this.levelObjects.length = 0;
  }
}
