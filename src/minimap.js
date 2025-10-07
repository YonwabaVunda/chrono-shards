import * as THREE from 'three';

export class Minimap {
    constructor(mainScene, mainCamera, player) {
        this.mainScene = mainScene;
        this.mainCamera = mainCamera;
        this.player = player;
        
        this.size = 200;
        this.margin = 20;

        this.createMinimapCanvas();
        this.setupMinimapCamera();
        this.createMinimapScene();
        
        // Create debug objects immediately
        this.createDebugObjects();
        
        this.createPlayerMarker();
        
        console.log('🎯 DEBUG MINIMAP INITIALIZED');
    }

    createMinimapCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.canvas.style.cssText = `
            position: absolute;
            bottom: ${this.margin}px;
            right: ${this.margin}px;
            width: ${this.size}px;
            height: ${this.size}px;
            border: 3px solid #00ff00;
            border-radius: 10px;
            background: rgba(0, 0, 0, 0.9);
            z-index: 1000;
            pointer-events: none;
        `;
        document.body.appendChild(this.canvas);

        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(this.size, this.size);
        this.renderer.setClearColor(0x000011, 0.8);
    }

    setupMinimapCamera() {
        // Simple orthographic camera
        this.camera = new THREE.OrthographicCamera(
            -50, 50,   // left, right
            50, -50,   // top, bottom
            1, 1000
        );
        
        this.camera.position.set(0, 100, 0);
        this.camera.lookAt(0, 0, 0);
        this.camera.zoom = 0.2;
        this.camera.updateProjectionMatrix();
    }

    createMinimapScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x001133);
        
        // Large visible grid
        const gridHelper = new THREE.GridHelper(100, 10, 0xff0000, 0x880000);
        this.scene.add(gridHelper);
        
        // Center marker
        const centerMarker = new THREE.Mesh(
            new THREE.SphereGeometry(2, 8, 6),
            new THREE.MeshBasicMaterial({ color: 0xffff00 })
        );
        centerMarker.position.set(0, 0, 0);
        this.scene.add(centerMarker);
        
        console.log('✅ Minimap scene created with debug objects');
    }

    createDebugObjects() {
        console.log('🎨 Creating debug objects...');
        
        // Create a ring of colored cubes around the center
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
        
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const radius = 20;
            
            const cube = new THREE.Mesh(
                new THREE.BoxGeometry(5, 5, 5),
                new THREE.MeshBasicMaterial({ color: colors[i] })
            );
            
            cube.position.set(
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
            );
            
            cube.name = `debug_cube_${i}`;
            this.scene.add(cube);
        }
        
        // Create a large ground plane
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(80, 80),
            new THREE.MeshBasicMaterial({ 
                color: 0x224422,
                transparent: true,
                opacity: 0.5,
                side: THREE.DoubleSide
            })
        );
        ground.rotation.x = Math.PI / 2;
        ground.position.y = -0.1;
        this.scene.add(ground);
        
        console.log('✅ Debug objects created');
    }

    createPlayerMarker() {
        // Large visible player marker
        const geometry = new THREE.ConeGeometry(3, 6, 4);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 1.0
        });
        this.playerMarker = new THREE.Mesh(geometry, material);
        this.playerMarker.rotation.x = Math.PI;
        this.scene.add(this.playerMarker);
        
        console.log('✅ Player marker created');
    }

    update() {
        if (!this.player || !this.player.mesh) {
            console.log('⏳ Minimap: Waiting for player...');
            return;
        }

        // Update player marker
        this.playerMarker.position.copy(this.player.mesh.position);
        this.playerMarker.rotation.y = this.player.mesh.rotation.y;
        
        // Center camera on player
        this.camera.position.x = this.player.mesh.position.x;
        this.camera.position.z = this.player.mesh.position.z;
        this.camera.lookAt(this.player.mesh.position.x, 0, this.player.mesh.position.z);
        
        // Render minimap
        this.renderer.render(this.scene, this.camera);
        
        // Debug log first frame
        if (!this.hasRendered) {
            console.log('🎯 FIRST FRAME RENDERED - You should see colored cubes!');
            console.log('Player position:', this.player.mesh.position);
            this.hasRendered = true;
        }
    }

    // Remove the complex cloning for now
    updateMinimapObjects() {
        console.log('🔧 Skipping object cloning for debug');
    }

    changeLevel(newScene) {
        this.mainScene = newScene;
        console.log('🔄 Level changed');
    }

    setZoom(zoomLevel) {
        this.camera.zoom = zoomLevel;
        this.camera.updateProjectionMatrix();
        console.log('🔍 Zoom set to:', zoomLevel);
    }

    toggleVisibility() {
        this.canvas.style.display = this.canvas.style.display === 'none' ? 'block' : 'none';
        console.log('👁️ Minimap visibility toggled');
    }

    destroy() {
        if (this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.renderer.dispose();
    }
}