import * as THREE from 'three';
import { Player } from "../player.js";
import { Controls } from "../controls.js";
import { Shard } from "../shard.js";
import { CollisionSystem } from "../collision.js";

export class Level3 {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.player = new Player(scene);
        this.controls = new Controls(camera, document.getElementById("gameCanvas"));
        this.collisionSystem = new CollisionSystem();

        this.createDreamWorldEnvironment();
        this.collisionSystem.addBoundary(-30, 30, -30, 30);

        this.shards = [
            new Shard(scene, new THREE.Vector3(20, 3, -15)),
            new Shard(scene, new THREE.Vector3(-18, 3, 20)),
            new Shard(scene, new THREE.Vector3(25, 3, 22))
        ];
        
        this.shardsCollected = 0;
        this.totalShards = this.shards.length;
        this.onAllShardsCollected = null;
    }

    createDreamWorldEnvironment() {
        this.createDreamTerrain();
        this.createFloatingIslands();
        this.createSurrealStructures();
        this.createDreamLighting();
    }

    createDreamTerrain() {
        const terrainGeometry = new THREE.PlaneGeometry(60, 60, 50, 50);
        const positions = terrainGeometry.attributes.position;
        
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            const wave1 = Math.sin(x * 0.1) * Math.cos(z * 0.08) * 3;
            const wave2 = Math.sin(x * 0.05 + z * 0.03) * 2;
            const wave3 = Math.cos(x * 0.02) * Math.sin(z * 0.04) * 1.5;
            positions.setY(i, wave1 + wave2 + wave3);
        }
        positions.needsUpdate = true;

        const terrainMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x440044,
            emissive: 0x220022,
            emissiveIntensity: 0.6,
            metalness: 0.3,
            roughness: 0.8
        });
        
        const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;
        this.scene.add(terrain);
    }

    createFloatingIslands() {
        const islands = [
            { pos: [0, 8, 0], size: 5 },
            { pos: [-15, 12, -10], size: 4 },
            { pos: [18, 10, 15], size: 6 },
            { pos: [12, 15, -18], size: 3 },
            { pos: [-20, 8, 12], size: 5 }
        ];

        islands.forEach(islandData => {  // Changed parameter name to avoid conflict
            const islandGeometry = new THREE.SphereGeometry(islandData.size, 12, 10);
            const islandMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x8844AA,
                transparent: true,
                opacity: 0.9,
                emissive: 0x442266,
                emissiveIntensity: 0.4
            });
            const islandMesh = new THREE.Mesh(islandGeometry, islandMaterial);  // Changed variable name
            islandMesh.position.set(...islandData.pos);
            islandMesh.castShadow = true;
            islandMesh.receiveShadow = true;
            this.scene.add(islandMesh);
            this.collisionSystem.addCollider(islandMesh);

            // Add floating crystals on islands
            this.addIslandCrystals(islandData.pos, islandData.size);
        });

        // Bridges between islands
        this.createFloatingBridges();
    }

    addIslandCrystals(pos, size) {
        for (let i = 0; i < 3; i++) {
            const crystal = new THREE.Mesh(
                new THREE.ConeGeometry(0.3, 1.5, 4),
                new THREE.MeshStandardMaterial({
                    color: 0xFF00FF,
                    emissive: 0x880088,
                    emissiveIntensity: 0.7,
                    transparent: true,
                    opacity: 0.8
                })
            );
            crystal.position.set(
                pos[0] + (Math.random() - 0.5) * size * 0.8,
                pos[1] + size + 0.8,
                pos[2] + (Math.random() - 0.5) * size * 0.8
            );
            crystal.rotation.x = Math.PI;
            this.scene.add(crystal);
            this.collisionSystem.addCollider(crystal);
        }
    }

    createFloatingBridges() {
        const bridge = new THREE.Mesh(
            new THREE.BoxGeometry(20, 0.2, 1.5),
            new THREE.MeshStandardMaterial({
                color: 0xAA44CC,
                transparent: true,
                opacity: 0.7,
                emissive: 0x552277
            })
        );
        bridge.position.set(0, 8, 8);
        bridge.rotation.y = Math.PI / 2;
        bridge.castShadow = true;
        bridge.receiveShadow = true;
        this.scene.add(bridge);
        this.collisionSystem.addCollider(bridge);
    }

    createSurrealStructures() {
        // Twisted pillars
        for (let i = 0; i < 8; i++) {
            const pillar = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.7, 10, 6),
                new THREE.MeshStandardMaterial({
                    color: 0xAA44CC,
                    transparent: true,
                    opacity: 0.8
                })
            );
            pillar.position.set(
                -25 + i * 7,
                5,
                -20
            );
            pillar.rotation.z = Math.sin(i) * 0.8;
            pillar.castShadow = true;
            this.scene.add(pillar);
            this.collisionSystem.addCollider(pillar);
        }

        // Floating orbs
        for (let i = 0; i < 6; i++) {
            const orb = new THREE.Mesh(
                new THREE.SphereGeometry(1.2, 16, 12),
                new THREE.MeshStandardMaterial({
                    color: Math.random() > 0.5 ? 0xFF00FF : 0x00FFFF,
                    emissive: Math.random() > 0.5 ? 0x880088 : 0x008888,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0.7
                })
            );
            orb.position.set(
                -20 + Math.random() * 40,
                5 + Math.random() * 10,
                -15 + Math.random() * 30
            );
            orb.castShadow = true;
            this.scene.add(orb);
            this.collisionSystem.addCollider(orb);
        }
    }

    createDreamLighting() {
        const mainLight = new THREE.DirectionalLight(0xFF44FF, 1);
        mainLight.position.set(10, 20, 5);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        const ambientLight = new THREE.AmbientLight(0xAA22AA, 0.6);
        this.scene.add(ambientLight);

        // Colored point lights
        const dreamLights = [
            { pos: [15, 8, -10], color: 0xFF00FF },
            { pos: [-12, 10, 15], color: 0x00FFFF },
            { pos: [20, 12, 18], color: 0xFFFF00 },
            { pos: [-18, 6, -15], color: 0xFF8800 }
        ];

        dreamLights.forEach(light => {
            const pointLight = new THREE.PointLight(light.color, 0.7, 20);
            pointLight.position.set(...light.pos);
            this.scene.add(pointLight);
        });
    }

    update() {
        this.player.move(this.controls, this.collisionSystem);
        this.player.update();

        let anyShardCollected = false;
        
        this.shards.forEach((shard, index) => {
            if (!shard.collected) {
                shard.update();
                
                const currentDistance = this.player.mesh.position.distanceTo(shard.mesh.position);
                
                if (currentDistance < 3.0) {
                    console.log(`💜 Dream Shard ${index + 1} collected!`);
                    shard.collected = true;
                    this.shardsCollected++;
                    anyShardCollected = true;
                    
                    shard.mesh.visible = false;
                    if (shard.collisionSphere) {
                        shard.collisionSphere.visible = false;
                    }
                    
                    if (this.shardsCollected === this.totalShards) {
                        console.log('🌈 All dream shards collected! Timeline restoration complete!');
                        this.createCompletionEffects();
                        
                        setTimeout(() => {
                            if (this.onAllShardsCollected) {
                                this.onAllShardsCollected();
                            }
                        }, 3000);
                    }
                }
            }
        });

        this.camera.lookAt(this.player.mesh.position);
        this.controls.updateCamera(this.player.mesh.position);
    }

    createCompletionEffects() {
        const portalGeometry = new THREE.RingGeometry(2, 6, 32);
        const portalMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF00FF,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        const portal = new THREE.Mesh(portalGeometry, portalMaterial);
        portal.rotation.x = Math.PI / 2;
        portal.position.set(0, 5, 0);
        this.scene.add(portal);
        this.portal = portal;

        console.log("🎉 CONGRATULATIONS! You've restored the timeline!");
    }
}