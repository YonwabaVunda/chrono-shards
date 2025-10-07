import * as THREE from 'three';
import { Player } from "../player.js";
import { Controls } from "../controls.js";
import { Shard } from "../shard.js";
import { CollisionSystem } from "../collision.js";

export class Level2 {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.player = new Player(scene);
        this.controls = new Controls(camera, document.getElementById("gameCanvas"));
        this.collisionSystem = new CollisionSystem();

        this.createFutureCityEnvironment();
        this.collisionSystem.addBoundary(-25, 25, -25, 25);

        this.shards = [
            new Shard(scene, new THREE.Vector3(15, 3, -10)),
            new Shard(scene, new THREE.Vector3(-12, 3, 15)),
            new Shard(scene, new THREE.Vector3(20, 3, 18))
        ];
        
        this.shardsCollected = 0;
        this.totalShards = this.shards.length;
        this.onAllShardsCollected = null;
    }

    createFutureCityEnvironment() {
        this.createCityFloor();
        this.createSkyscrapers();
        this.createPlatformsAndBridges();
        this.createTechStructures();
        this.createFutureLighting();
    }

    createCityFloor() {
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(50, 50),
            new THREE.MeshStandardMaterial({ 
                color: 0x111133,
                metalness: 0.9,
                roughness: 0.1,
                emissive: 0x000022,
                emissiveIntensity: 0.2
            })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);

        // Road grid
        this.createRoads();
    }

    createRoads() {
        const roadMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x333344,
            metalness: 0.3,
            roughness: 0.7
        });

        // Main roads
        for (let i = -20; i <= 20; i += 10) {
            const roadX = new THREE.Mesh(
                new THREE.PlaneGeometry(50, 2),
                roadMaterial
            );
            roadX.rotation.x = -Math.PI / 2;
            roadX.position.set(0, 0.01, i);
            this.scene.add(roadX);

            const roadZ = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 50),
                roadMaterial
            );
            roadZ.rotation.x = -Math.PI / 2;
            roadZ.position.set(i, 0.01, 0);
            this.scene.add(roadZ);
        }
    }

    createSkyscrapers() {
        const buildingPositions = [
            [-15, 0, -15], [15, 0, -15], [-15, 0, 15], [15, 0, 15],
            [-8, 0, -8], [8, 0, -8], [-8, 0, 8], [8, 0, 8]
        ];

        buildingPositions.forEach((pos, index) => {
            const height = 8 + Math.random() * 6;
            const building = new THREE.Mesh(
                new THREE.BoxGeometry(3, height, 3),
                new THREE.MeshStandardMaterial({ 
                    color: 0x444466,
                    metalness: 0.8,
                    roughness: 0.2,
                    emissive: 0x222244,
                    emissiveIntensity: 0.3
                })
            );
            building.position.set(pos[0], height/2, pos[1]);
            building.castShadow = true;
            this.scene.add(building);
            this.collisionSystem.addCollider(building);

            // Add windows
            this.addBuildingWindows(building, height);
        });
    }

    addBuildingWindows(building, height) {
        for (let y = 1; y < height - 1; y += 1.5) {
            const window = new THREE.Mesh(
                new THREE.PlaneGeometry(2.5, 0.8),
                new THREE.MeshBasicMaterial({ 
                    color: 0x00ffff,
                    emissive: 0x0044ff,
                    emissiveIntensity: 0.5
                })
            );
            window.position.set(0, y - height/2, 1.6);
            window.rotation.y = Math.PI;
            building.add(window);
        }
    }

    createPlatformsAndBridges() {
        // Elevated platforms
        const platforms = [
            { pos: [0, 3, 0], size: [8, 0.5, 8] },
            { pos: [-12, 5, -12], size: [6, 0.5, 6] },
            { pos: [12, 4, 12], size: [7, 0.5, 7] }
        ];

        platforms.forEach(platform => {
            const platformMesh = new THREE.Mesh(
                new THREE.BoxGeometry(...platform.size),
                new THREE.MeshStandardMaterial({ 
                    color: 0x4444FF,
                    metalness: 0.9,
                    roughness: 0.1,
                    emissive: 0x0044FF,
                    emissiveIntensity: 0.4
                })
            );
            platformMesh.position.set(...platform.pos);
            platformMesh.castShadow = true;
            platformMesh.receiveShadow = true;
            this.scene.add(platformMesh);
            this.collisionSystem.addCollider(platformMesh);

            // Support pillars
            this.addPlatformSupports(platform.pos, platform.size);
        });

        // Bridges between platforms
        this.createBridges();
    }

    addPlatformSupports(pos, size) {
        const support = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.5, pos[1], 8),
            new THREE.MeshStandardMaterial({ color: 0x8888FF })
        );
        support.position.set(pos[0], pos[1]/2, pos[2]);
        this.scene.add(support);
        this.collisionSystem.addCollider(support);
    }

    createBridges() {
        const bridge = new THREE.Mesh(
            new THREE.BoxGeometry(12, 0.3, 2),
            new THREE.MeshStandardMaterial({ 
                color: 0x6666FF,
                metalness: 0.8,
                emissive: 0x2244AA
            })
        );
        bridge.position.set(0, 3, 6);
        bridge.castShadow = true;
        bridge.receiveShadow = true;
        this.scene.add(bridge);
        this.collisionSystem.addCollider(bridge);
    }

    createTechStructures() {
        // Holographic displays
        const hologram = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 3),
            new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 0.6,
                side: THREE.DoubleSide
            })
        );
        hologram.position.set(5, 2, 5);
        hologram.rotation.y = Math.PI / 4;
        this.scene.add(hologram);

        // Tech consoles
        const consoles = [
            [8, 1, -5], [-5, 1, 8], [10, 1, 10]
        ];

        consoles.forEach(pos => {
            const console = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 1, 0.5),
                new THREE.MeshStandardMaterial({ 
                    color: 0x333355,
                    metalness: 0.9
                })
            );
            console.position.set(pos[0], pos[1], pos[2]);
            this.scene.add(console);
            this.collisionSystem.addCollider(console);
        });
    }

    createFutureLighting() {
        const mainLight = new THREE.DirectionalLight(0x4488FF, 1);
        mainLight.position.set(10, 15, 5);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        const ambientLight = new THREE.AmbientLight(0x2244AA, 0.4);
        this.scene.add(ambientLight);

        // Neon lights
        const neonLights = [
            { pos: [8, 3, -5], color: 0x00FFFF },
            { pos: [-6, 3, 8], color: 0xFF00FF },
            { pos: [15, 4, 12], color: 0x00FF88 }
        ];

        neonLights.forEach(light => {
            const pointLight = new THREE.PointLight(light.color, 0.8, 15);
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
                    console.log(`🔷 Future Shard ${index + 1} collected!`);
                    shard.collected = true;
                    this.shardsCollected++;
                    anyShardCollected = true;
                    
                    shard.mesh.visible = false;
                    if (shard.collisionSphere) {
                        shard.collisionSphere.visible = false;
                    }
                    
                    if (this.shardsCollected === this.totalShards) {
                        console.log('🚀 All future shards collected! Opening time portal...');
                        this.createCompletionEffects();
                        
                        setTimeout(() => {
                            if (this.onAllShardsCollected) {
                                this.onAllShardsCollected();
                            }
                        }, 2000);
                    }
                }
            }
        });

        this.camera.lookAt(this.player.mesh.position);
        this.controls.updateCamera(this.player.mesh.position);
    }

    createCompletionEffects() {
        const portalGeometry = new THREE.RingGeometry(1.5, 4, 32);
        const portalMaterial = new THREE.MeshBasicMaterial({
            color: 0x00FFFF,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        const portal = new THREE.Mesh(portalGeometry, portalMaterial);
        portal.rotation.x = Math.PI / 2;
        portal.position.set(0, 2, 0);
        this.scene.add(portal);
        this.portal = portal;
    }
}