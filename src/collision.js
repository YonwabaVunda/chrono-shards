import * as THREE from 'three';

export class CollisionSystem {
    constructor() {
        this.colliders = [];
    }

    addCollider(mesh, type = 'static') {
        const boundingBox = new THREE.Box3().setFromObject(mesh);
        this.colliders.push({
            mesh: mesh,
            type: type,
            boundingBox: boundingBox
        });
    }

    addBoundary(minX, maxX, minZ, maxZ, height = 10) {
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
    }

    checkCollision(playerPosition, playerRadius = 0.5) {
        const playerBoundingSphere = new THREE.Sphere(playerPosition, playerRadius);
        
        for (const collider of this.colliders) {
            if (collider.boundingBox.intersectsSphere(playerBoundingSphere)) {
                return true;
            }
        }
        return false;
    }

    getCollisionResponse(playerPosition, previousPosition, playerRadius = 0.5) {
        const direction = new THREE.Vector3().subVectors(playerPosition, previousPosition);
        const playerBoundingSphere = new THREE.Sphere(playerPosition, playerRadius);
        
        for (const collider of this.colliders) {
            if (collider.boundingBox.intersectsSphere(playerBoundingSphere)) {
                const response = new THREE.Vector3();
                const pushDistance = playerRadius + 0.1;
                
                if (Math.abs(direction.x) > Math.abs(direction.z)) {
                    response.x = direction.x > 0 ? -pushDistance : pushDistance;
                } else {
                    response.z = direction.z > 0 ? -pushDistance : pushDistance;
                }
                
                return response;
            }
        }
        return null;
    }
}