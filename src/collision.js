import * as THREE from 'three';

export class CollisionSystem {
    constructor() {
        console.log('CollisionSystem: instantiated');
        // expose for quick inspection in console
        try { window.__collisionSystem = this; } catch (e) {}
        this.colliders = [];
    }

    addCollider(mesh, type = 'static') {
        console.log('CollisionSystem.addCollider called', { meshName: mesh?.name, type });
         const boundingBox = mesh ? new THREE.Box3().setFromObject(mesh) : new THREE.Box3();
         this.colliders.push({
             mesh: mesh,
             type: type,
             boundingBox: boundingBox
         });
        console.log('CollisionSystem: colliders count', this.colliders.length);
    }

    addBoundary(minX, maxX, minZ, maxZ, height = 10) {
        console.log('CollisionSystem.addBoundary', { minX, maxX, minZ, maxZ, height });
         const boundaries = [
             { // West wall
                 mesh: null,
                 boundingBox: new THREE.Box3(
                     new THREE.Vector3(minX - 1, -height, minZ),
                     new THREE.Vector3(minX, height, maxZ)
                 )
             },
             { // East wall
                 mesh: null,
                 boundingBox: new THREE.Box3(
                     new THREE.Vector3(maxX, -height, minZ),
                     new THREE.Vector3(maxX + 1, height, maxZ)
                 )
             },
             { // North wall
                 mesh: null,
                 boundingBox: new THREE.Box3(
                     new THREE.Vector3(minX, -height, minZ - 1),
                     new THREE.Vector3(maxX, height, minZ)
                 )
             },
             { // South wall
                 mesh: null,
                 boundingBox: new THREE.Box3(
                     new THREE.Vector3(minX, -height, maxZ),
                     new THREE.Vector3(maxX, height, maxZ + 1)
                 )
             }
         ];
         
         this.colliders.push(...boundaries);
        console.log('CollisionSystem: colliders count after addBoundary', this.colliders.length);
     }

     // Refresh bounding boxes for colliders that are linked to meshes.
     updateAll() {
        for (const [i, collider] of this.colliders.entries()) {
            if (collider.mesh) {
                try {
                    collider.boundingBox.setFromObject(collider.mesh);
                } catch (e) {
                    console.warn(`CollisionSystem.updateAll: failed to setFromObject for collider[${i}]`, e);
                }
            }
        }
     }

     checkCollision(playerPosition, playerRadius = 0.5) {
        console.log('CollisionSystem.checkCollision called', { playerPosition, playerRadius });
         if (!playerPosition || !(playerPosition instanceof THREE.Vector3)) {
             console.warn('CollisionSystem.checkCollision: invalid playerPosition', playerPosition);
             return false;
         }

        // keep bounds up-to-date for moving objects
        this.updateAll();

        const playerBoundingSphere = new THREE.Sphere(playerPosition.clone(), playerRadius);
        console.debug('CollisionSystem.checkCollision: playerSphere', playerBoundingSphere);

        if (this.colliders.length === 0) {
            console.debug('CollisionSystem.checkCollision: no colliders registered');
        }

         for (const [i, collider] of this.colliders.entries()) {
             if (!collider.boundingBox) {
                console.debug(`collider[${i}] has no boundingBox`, collider);
                 continue;
             }

            // Log collider bbox extents for debugging
            const min = collider.boundingBox.min;
            const max = collider.boundingBox.max;
            const meshInfo = collider.mesh ? (collider.mesh.name || collider.mesh.uuid) : 'boundary';
            console.debug(`collider[${i}] (${meshInfo}) bbox min=${min.toArray()} max=${max.toArray()}`);

             if (collider.boundingBox.intersectsSphere(playerBoundingSphere)) {
                console.info(`CollisionSystem: collision with collider[${i}] (${meshInfo})`);
                 return true;
             }
         }

         return false;
     }

     getCollisionResponse(playerPosition, previousPosition, playerRadius = 0.5) {
         if (!previousPosition || !(playerPosition instanceof THREE.Vector3) || !(previousPosition instanceof THREE.Vector3)) {
            console.warn('CollisionSystem.getCollisionResponse: invalid positions', { playerPosition, previousPosition });
            return null;
        }

        // refresh bounds for moving colliders
        this.updateAll();

        const playerCenter = playerPosition.clone();

        for (const [i, collider] of this.colliders.entries()) {
            if (!collider.boundingBox) continue;

            // Find closest point on the box to the player center
            const closest = new THREE.Vector3();
            collider.boundingBox.clampPoint(playerCenter, closest);
            const delta = new THREE.Vector3().subVectors(playerCenter, closest);
            const dist = delta.length();

            // If center is inside the box (dist === 0), push along the smallest axis to escape
            if (dist === 0) {
                const min = collider.boundingBox.min;
                const max = collider.boundingBox.max;

                const dxMin = playerCenter.x - min.x;
                const dxMax = max.x - playerCenter.x;
                const dyMin = playerCenter.y - min.y;
                const dyMax = max.y - playerCenter.y;
                const dzMin = playerCenter.z - min.z;
                const dzMax = max.z - playerCenter.z;

                const axisDistances = [
                    { axis: 'x', dist: Math.min(dxMin, dxMax), sign: dxMin < dxMax ? -1 : 1 },
                    { axis: 'y', dist: Math.min(dyMin, dyMax), sign: dyMin < dyMax ? -1 : 1 },
                    { axis: 'z', dist: Math.min(dzMin, dzMax), sign: dzMin < dzMax ? -1 : 1 },
                ];

                axisDistances.sort((a, b) => a.dist - b.dist);
                const chosen = axisDistances[0];
                const pushAmount = Math.max(0, playerRadius - chosen.dist) + 0.01; // small padding

                const response = new THREE.Vector3();
                response[chosen.axis] = chosen.sign * pushAmount;

                const meshInfo = collider.mesh ? (collider.mesh.name || collider.mesh.uuid) : 'boundary';
                console.info(`CollisionSystem.getCollisionResponse: hit collider[${i}] (${meshInfo}) response=${response.toArray()}`);
                return response;
            }

            // If outside but overlapping the player's radius, push outward along delta
            if (dist < playerRadius) {
                const overlap = playerRadius - dist + 0.001;
                const response = delta.normalize().multiplyScalar(overlap);
                const meshInfo = collider.mesh ? (collider.mesh.name || collider.mesh.uuid) : 'boundary';
                console.info(`CollisionSystem.getCollisionResponse: hit collider[${i}] (${meshInfo}) response=${response.toArray()}`);
                return response;
            }
        }

        return null;
     }
 }