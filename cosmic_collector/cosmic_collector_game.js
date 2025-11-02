let audioCtx = null;
let music = {
    // Live nodes
    osc: null,
    gain: null,
    lfo: null,
    lfoGain: null,
    // Sequencer nodes
    leadOsc: null,
    leadGain: null,
    bassOsc: null,
    bassGain: null,
    arpOsc: null,
    arpGain: null,
    // Sequencer state
    bpm: 100,
    stepIdx: 0,
    stepTimer: null,
    // Patterns (freq in Hz, dur in beats)
    leadPattern: [
        { f: 659.25, d: 0.5 }, { f: 739.99, d: 0.5 }, { f: 880.00, d: 1.0 },
        { f: 0, d: 0.25 }, { f: 783.99, d: 0.25 }, { f: 659.25, d: 0.5 }, { f: 587.33, d: 1.0 },
        { f: 0, d: 0.5 }, { f: 698.46, d: 0.5 }, { f: 659.25, d: 1.0 }
    ],
    bassPattern: [
        { f: 110.00, d: 1.0 }, { f: 0, d: 0.5 }, { f: 123.47, d: 0.5 }, { f: 0, d: 1.0 },
        { f: 146.83, d: 1.0 }, { f: 0, d: 0.5 }, { f: 130.81, d: 0.5 }, { f: 0, d: 1.0 }
    ],
    arpPattern: [
        { f: 523.25, d: 0.25 }, { f: 659.25, d: 0.25 }, { f: 783.99, d: 0.25 }, { f: 1046.50, d: 0.25 },
        { f: 0, d: 0.25 }, { f: 659.25, d: 0.25 }, { f: 523.25, d: 0.25 }, { f: 392.00, d: 0.25 }
    ]
};

// Enhanced Material Manager with better fallbacks
const materialManager = {
    // Texture cache to avoid loading the same texture multiple times
    textureCache: {},
    
    createProceduralTexture: function(width, height, color1, color2) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        
        const gradient = context.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
        
        for (let i = 0; i < width; i += 2) {
            for (let j = 0; j < height; j += 2) {
                if (Math.random() > 0.7) {
                    context.fillStyle = `rgba(255,255,255,${Math.random() * 0.1})`;
                    context.fillRect(i, j, 1, 1);
                }
            }
        }
        
        return new THREE.CanvasTexture(canvas);
    },
    
    getShipMaterial: function() {
        return new THREE.MeshPhongMaterial({ 
            color: 0x4a8fe9,
            emissive: 0x1a3f7a,
            emissiveIntensity: 0.4,
            shininess: 80,
            specular: 0x444444
        });
    },
    
    getOrbMaterial: function() {
        return new THREE.MeshPhongMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.9,
            transparent: true,
            opacity: 0.95,
            shininess: 90,
            specular: 0xffff88
        });
    },
    
    getAsteroidMaterial: function() {
        return new THREE.MeshPhongMaterial({ 
            color: 0x888888,
            flatShading: true,
            shininess: 20,
            specular: 0x222222
        });
    },
    
    loadAsteroidTexture: function(texturePath, callback, errorCallback) {
        // Check if texture is already cached
        if (this.textureCache[texturePath]) {
            const texture = this.textureCache[texturePath];
            const material = new THREE.MeshPhongMaterial({
                map: texture, // Reuse the same texture (Three.js handles this efficiently)
                flatShading: true,
                shininess: 20,
                specular: 0x222222
            });
            if (callback) callback(material);
            return;
        }
        
        const textureLoader = new THREE.TextureLoader();
        
        // Try different path formats
        const pathVariations = [
            texturePath,
            './' + texturePath,
            texturePath.replace(/^textures\//, './textures/')
        ];
        
        let pathIndex = 0;
        
        const tryLoadTexture = (currentPath) => {
            textureLoader.load(
                currentPath,
                function(texture) {
                    // Texture loaded successfully
                    // Configure texture settings
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(1, 1);
                    
                    // Cache the texture
                    materialManager.textureCache[texturePath] = texture;
                    
                    const material = new THREE.MeshPhongMaterial({
                        map: texture,
                        flatShading: true,
                        shininess: 20,
                        specular: 0x222222
                    });
                    
                    console.log('✓ Asteroid texture loaded:', currentPath);
                    if (callback) callback(material);
                },
                function(xhr) {
                    // Progress callback
                    if (xhr.lengthComputable) {
                        const percentComplete = xhr.loaded / xhr.total * 100;
                        console.log('Loading asteroid texture: ' + Math.round(percentComplete) + '%');
                    }
                },
                function(error) {
                    // Try next path variation
                    pathIndex++;
                    if (pathIndex < pathVariations.length) {
                        console.log('Trying alternative path:', pathVariations[pathIndex]);
                        tryLoadTexture(pathVariations[pathIndex]);
                    } else {
                        // All paths failed, use fallback material
                        console.error('Asteroid texture loading failed for all paths:', pathVariations);
                        console.error('Error details:', error);
                        const fallbackMaterial = this.getAsteroidMaterial();
                        if (errorCallback) {
                            errorCallback(fallbackMaterial);
                        } else if (callback) {
                            callback(fallbackMaterial);
                        }
                    }
                }.bind(this)
            );
        };
        
        tryLoadTexture(pathVariations[0]);
    },
    
    getEnemyMaterial: function() {
        return new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0x660000,
            emissiveIntensity: 0.8,
            shininess: 60,
            specular: 0xff4444
        });
    },
    
    getPowerupMaterial: function(type) {
        const colors = { 
            shield: { main: 0x00ffff, emissive: 0x006666 },
            speed: { main: 0x00ff00, emissive: 0x006600 }, 
            weapon: { main: 0xff00ff, emissive: 0x660066 }
        };
        const color = colors[type] || colors.shield;
        
        return new THREE.MeshPhongMaterial({
            color: color.main,
            emissive: color.emissive,
            emissiveIntensity: 0.9,
            transparent: true,
            opacity: 0.85,
            shininess: 100
        });
    },
    
    getCheckpointMaterial: function() {
        return new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.7,
            shininess: 80
        });
    },
    
    getMissileMaterial: function() {
        return new THREE.MeshPhongMaterial({
            color: 0xff3300,
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
            shininess: 90
        });
    }
};

// Model Loaders with enhanced error handling
let objLoader, gltfLoader;
let modelsLoaded = {
    plane: false,
    enemy: false,
    missile: false
};

function initAudio() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context created');
        } catch(e) {
            console.log('Audio not supported:', e);
        }
    }
}

// Add this function to handle user interaction
function handleUserInteraction() {
    if (!audioCtx) {
        initAudio();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().then(() => {
            console.log('Audio context resumed');
        });
    }
}

function playSound(freq, duration, type = 'sine', volume = 0.08) {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = type;
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

function startAmbient() {
    if (!audioCtx) return;
    if (music.stepTimer) return;
    try {
        music.leadOsc = audioCtx.createOscillator();
        music.leadGain = audioCtx.createGain();
        music.leadOsc.type = 'sine';
        music.leadGain.gain.value = 0.0;
        music.leadOsc.connect(music.leadGain);
        music.leadGain.connect(audioCtx.destination);

        music.arpOsc = audioCtx.createOscillator();
        music.arpGain = audioCtx.createGain();
        music.arpOsc.type = 'triangle';
        music.arpGain.gain.value = 0.0;
        music.arpOsc.connect(music.arpGain);
        music.arpGain.connect(audioCtx.destination);

        music.bassOsc = audioCtx.createOscillator();
        music.bassGain = audioCtx.createGain();
        music.bassOsc.type = 'square';
        music.bassGain.gain.value = 0.0;
        music.bassOsc.connect(music.bassGain);
        music.bassGain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;
        music.leadOsc.start(now);
        music.arpOsc.start(now);
        music.bassOsc.start(now);

        music.stepIdx = 0;
        const msPerBeat = 60000 / music.bpm;

        const scheduleStep = () => {
            const leadStep = music.leadPattern[music.stepIdx % music.leadPattern.length];
            if (leadStep.f > 0) {
                music.leadOsc.frequency.setTargetAtTime(leadStep.f, audioCtx.currentTime, 0.01);
                music.leadGain.gain.cancelScheduledValues(audioCtx.currentTime);
                music.leadGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
                music.leadGain.gain.linearRampToValueAtTime(0.045, audioCtx.currentTime + 0.02);
                music.leadGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + (leadStep.d * msPerBeat) / 1000 - 0.01);
            }

            const arpStep = music.arpPattern[music.stepIdx % music.arpPattern.length];
            if (arpStep.f > 0) {
                music.arpOsc.frequency.setTargetAtTime(arpStep.f, audioCtx.currentTime, 0.01);
                music.arpGain.gain.cancelScheduledValues(audioCtx.currentTime);
                music.arpGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
                music.arpGain.gain.linearRampToValueAtTime(0.03, audioCtx.currentTime + 0.01);
                music.arpGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + (arpStep.d * msPerBeat) / 1000 - 0.01);
            }

            const bassStep = music.bassPattern[music.stepIdx % music.bassPattern.length];
            if (bassStep.f > 0) {
                music.bassOsc.frequency.setTargetAtTime(bassStep.f, audioCtx.currentTime, 0.02);
                music.bassGain.gain.cancelScheduledValues(audioCtx.currentTime);
                music.bassGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
                music.bassGain.gain.linearRampToValueAtTime(0.035, audioCtx.currentTime + 0.02);
                music.bassGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + (bassStep.d * msPerBeat) / 1000 - 0.015);
            }

            const stepDurMs = Math.min(
                (leadStep.d || 0.5) * msPerBeat,
                800
            );
            music.stepIdx++;
            music.stepTimer = setTimeout(scheduleStep, stepDurMs);
        };

        scheduleStep();
    } catch(e) {}
}

function stopAmbient() {
    try {
        if (music.stepTimer) {
            clearTimeout(music.stepTimer);
            music.stepTimer = null;
        }
        ['leadOsc','arpOsc','bassOsc'].forEach(key => {
            const osc = music[key];
            if (osc) {
                try { osc.stop(); } catch(e) {}
                try { osc.disconnect(); } catch(e) {}
            }
            music[key] = null;
        });
        ['leadGain','arpGain','bassGain','gain','lfoGain'].forEach(key => {
            const node = music[key];
            if (node) { try { node.disconnect(); } catch(e) {} }
            music[key] = null;
        });
        if (music.lfo) { try { music.lfo.stop(); } catch(e) {} try { music.lfo.disconnect(); } catch(e) {} }
        music.lfo = null;
        music.osc = null;
    } catch(e) {}
}

let scene, camera, renderer, ship, miniMapRenderer, miniMapCamera;
let gameState = {
    level: 1,
    score: 0,
    energy: 100,
    shield: 0,
    weaponCooldown: 0,
    orbsCollected: 0,
    orbsTotal: 15,
    playing: false,
    paused: false,
    musicOn: true,
    cameraMode: 0,
    speed: 0.5,
    boost: 1,
    combo: 0,
    comboTimer: 0,
    powerups: {},
    kills: 0,
    checkpointsReached: 0,
    totalCheckpoints: 0
};

let keys = {};
let mouse = { x: 0, y: 0, clicked: false };
let orbs = [];
let obstacles = [];
let powerups = [];
let particles = [];
let enemies = [];
let projectiles = [];
let checkpoints = [];
let initialized = false;
let lastFrameTime = Date.now();

window.addEventListener('load', function() {
    setTimeout(init, 100);
});

function init() {
    if (initialized) return;
    initialized = true;
    
    // Initialize loaders
    objLoader = new THREE.OBJLoader();
    gltfLoader = new THREE.GLTFLoader();
    
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000515, 0.0006);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 8, 15);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000011);
    document.body.appendChild(renderer.domElement);
    
    const minimapCanvas = document.getElementById('minimap');
    if (minimapCanvas) {
        miniMapRenderer = new THREE.WebGLRenderer({ canvas: minimapCanvas, alpha: true });
        miniMapRenderer.setSize(220, 220);
        miniMapCamera = new THREE.OrthographicCamera(-80, 80, 80, -80, 0.1, 1000);
        miniMapCamera.position.set(0, 100, 0);
        miniMapCamera.lookAt(0, 0, 0);
    }
    
    setupLighting();
    createStarfield();
    createNebula();
    createShip();
    
    window.addEventListener('resize', onWindowResize);
    runIntro();
    document.addEventListener('keydown', (e) => {
        handleUserInteraction(); // Add user interaction for audio
        keys[e.key.toLowerCase()] = true;
        if (e.key.toLowerCase() === 'v' && gameState.playing) {
            gameState.cameraMode = (gameState.cameraMode + 1) % 3;
            updateCameraLabel();
            playSound(600, 0.1);
        }
        if (e.key === 'Escape') {
            if (gameState.playing) {
                window.togglePause();
            }
        }
        if (e.key.toLowerCase() === 'm') {
            handleUserInteraction(); // Add user interaction for audio
            gameState.musicOn = !gameState.musicOn;
            if (gameState.musicOn && gameState.playing) {
                startAmbient();
            } else {
                stopAmbient();
            }
        }
    });
    document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', () => {
        handleUserInteraction(); // Add user interaction for audio
        mouse.clicked = true;
    });
    document.addEventListener('mouseup', () => mouse.clicked = false);
    
    console.log('✓ Game Ready with Aircraft Models!');
}

// Intro sequencing
let introDone = false;
function appendIntroLine(text, delayMs) {
    setTimeout(() => {
        const container = document.getElementById('intro-lines');
        if (!container) return;
        const p = document.createElement('div');
        p.className = 'intro-line';
        p.textContent = text;
        container.appendChild(p);
        handleUserInteraction(); // Add user interaction for audio
        playSound(520 + Math.random()*80, 0.12, 'triangle', 0.04);
    }, delayMs);
}

function runIntro() {
    const intro = document.getElementById('intro');
    const menu = document.getElementById('menu');
    if (!intro || !menu) return;
    intro.classList.remove('hidden');
    menu.classList.add('hidden');
    const lines = [
        'Year 2489. The Orion Expanse is collapsing into darkness…',
        'Ancient reactors, scattered across the void, have gone silent.',
        'Without their energy, the star lanes will freeze and fade.',
        'You are the last courier of the Celestial Guild.',
        'Collect the orbs. Rekindle the beacons. Outrun the storm.',
        'But beware—the void fights back.'
    ];
    let t = 400;
    lines.forEach((line, i) => {
        appendIntroLine(line, t);
        t += 2000;
    });
}

window.skipIntro = function() {
    finishIntro();
}

function finishIntro() {
    if (introDone) return;
    introDone = true;
    const intro = document.getElementById('intro');
    const menu = document.getElementById('menu');
    if (intro) intro.classList.add('hidden');
    if (menu) menu.classList.remove('hidden');
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0x404070, 0.6);
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffee, 1.8);
    sunLight.position.set(60, 70, 60);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);
    
    const fillLight1 = new THREE.PointLight(0x00aaff, 1.5, 200);
    fillLight1.position.set(-50, 25, -50);
    scene.add(fillLight1);
    
    const fillLight2 = new THREE.PointLight(0xff00aa, 1.5, 200);
    fillLight2.position.set(50, 25, 50);
    scene.add(fillLight2);
    
    const rimLight = new THREE.DirectionalLight(0x4466ff, 0.8);
    rimLight.position.set(-30, -20, -30);
    scene.add(rimLight);
}

function createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({ 
        color: 0xffffff, 
        size: 2.5,
        transparent: true,
        opacity: 0.9
    });
    
    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
}

function createNebula() {
    for (let i = 0; i < 100; i++) {
        const size = Math.random() * 30 + 15;
        const geometry = new THREE.SphereGeometry(size, 8, 8);
        const hue = Math.random() * 0.4 + 0.5;
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(hue, 0.9, 0.6),
            transparent: true,
            opacity: 0.06,
            blending: THREE.AdditiveBlending
        });
        const nebula = new THREE.Mesh(geometry, material);
        nebula.position.set(
            (Math.random() - 0.5) * 500,
            (Math.random() - 0.5) * 300,
            (Math.random() - 0.5) * 500
        );
        scene.add(nebula);
    }
}

function createShip() {
    ship = new THREE.Group();
    
    const textureLoader = new THREE.TextureLoader();
    
    // Try to load plane model with better error handling
    objLoader.load(
        'models/plane.obj',
        function (object) {
            // Try to load texture
            textureLoader.load(
                'textures/plane.png',
                function(texture) {
                    const material = new THREE.MeshBasicMaterial({ 
                        map: texture,
                        transparent: true
                    });
                    
                    object.traverse(function (child) {
                        if (child.isMesh) {
                            child.material = material;
                        }
                    });
                    
                    object.rotation.y = Math.PI;
                    object.rotation.x = Math.PI / 12;
                    object.position.z = -0.5;
                    object.scale.set(0.1, 0.1, 0.1);
                    
                    ship.add(object);
                    modelsLoaded.plane = true;
                    console.log('✓ Plane model loaded successfully! (180° rotation - test and adjust if needed)');
                },
                function(error) {
                    console.warn('Plane texture not found, using colored material');
                    object.traverse(function (child) {
                        if (child.isMesh) {
                            child.material = materialManager.getShipMaterial();
                        }
                    });
                    
                    object.rotation.y = Math.PI;
                    object.rotation.x = Math.PI / 12;
                    object.position.z = -0.5;
                    object.scale.set(0.1, 0.1, 0.1);
                    
                    ship.add(object);
                    modelsLoaded.plane = true;
                    console.log('✓ Plane model loaded (fallback material, 180° rotation)');
                }
            );
        },
        function (xhr) {
            console.log('Plane loading: ' + (xhr.loaded / xhr.total * 100) + '%');
        },
        function (error) {
            console.warn('Plane model not found, using procedural ship');
            createProceduralShip();
        }
    );
    
    // Add engine effects
    const engineLight = new THREE.PointLight(0x00ffff, 3, 15);
    engineLight.position.set(0, 0, -2);
    ship.add(engineLight);
    
    // ADD ENGINE GLOW EFFECTS
    const engineGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00aaff,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
    });
    
    [-2.2, 2.2].forEach(x => {
        // Engine glow geometry
        const glowGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const engineGlow = new THREE.Mesh(glowGeometry, engineGlowMaterial);
        engineGlow.position.set(x, 0, -1.8);
        ship.add(engineGlow);
        
        // Store reference for dynamic effects
        engineGlow.userData.baseOpacity = 0.3;
        ship.userData.engineGlows = ship.userData.engineGlows || [];
        ship.userData.engineGlows.push(engineGlow);
    });

    
    ship.position.set(0, 0, 0);
    ship.userData.targetRotation = { x: 0, y: 0, z: 0 };
    scene.add(ship);
}

function createProceduralShip() {
    console.log('Creating procedural ship as fallback');
    
    const bodyGeometry = new THREE.ConeGeometry(1, 3.5, 8);
    const bodyMaterial = materialManager.getShipMaterial();
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    ship.add(body);
    
    const wingGeometry = new THREE.BoxGeometry(6, 0.35, 1.8);
    const wingMaterial = materialManager.getShipMaterial();
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.set(0, 0, -0.6);
    wings.castShadow = true;
    wings.receiveShadow = true;
    ship.add(wings);
    
    const cockpitGeometry = new THREE.SphereGeometry(0.55, 16, 16);
    const cockpitMaterial = new THREE.MeshPhongMaterial({
        color: 0x88ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.3,
        shininess: 100,
        specular: 0xffffff
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.5, 0.7);
    cockpit.castShadow = true;
    ship.add(cockpit);
    
    [-2.2, 2.2].forEach(x => {
        const engineGeometry = new THREE.CylinderGeometry(0.35, 0.45, 1, 12);
        const engineMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const engine = new THREE.Mesh(engineGeometry, engineMaterial);
        engine.position.set(x, 0, -1.4);
        engine.rotation.x = Math.PI / 2;
        ship.add(engine);
    });
}

function createParticle(pos, color, size = 0.5, velocity = null) {
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: 1
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(pos);
    particle.userData.velocity = velocity || new THREE.Vector3(
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.6,
        (Math.random() - 0.5) * 0.6
    );
    particle.userData.life = 1.0;
    scene.add(particle);
    particles.push(particle);
}

function createFlameParticle(pos, color, size = 0.3, velocity = null) {
    const geometry = new THREE.SphereGeometry(size, 6, 6);
    const material = new THREE.MeshBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const particle = new THREE.Mesh(geometry, material);
    particle.position.copy(pos);
    particle.userData.velocity = velocity || new THREE.Vector3(0, 0, 0);
    particle.userData.life = 1.0;
    particle.userData.maxLife = 1.0;
    scene.add(particle);
    particles.push(particle);
    return particle;
}

function createMovementFlames() {
    if (!ship || !gameState.playing) return;
    
    const enginePositions = [
        new THREE.Vector3(-2.2, 0, -2),  // Left engine
        new THREE.Vector3(2.2, 0, -2)    // Right engine
    ];
    
    // Get movement direction vectors relative to ship
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(ship.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(ship.quaternion);
    const up = new THREE.Vector3(0, 1, 0);
    
    let isMoving = false;
    let movementType = 'idle';
    
    // Check movement states
    if (keys[' '] && gameState.energy > 0) {
        // BOOSTING - Main engine flames
        movementType = 'boost';
        isMoving = true;
        createBoostFlames(enginePositions, forward);
    } 
    else if (keys['w'] || keys['arrowup']) {
        // FORWARD MOVEMENT - Gentle engine flames
        movementType = 'forward';
        isMoving = true;
        createForwardFlames(enginePositions, forward);
    }
    else if (keys['s'] || keys['arrowdown']) {
        // REVERSE MOVEMENT - Front braking flames
        movementType = 'reverse';
        isMoving = true;
        createReverseFlames(forward);
    }
    
    // TURNING FLAMES - RCS thrusters
    if (Math.abs(mouse.x) > 0.1 || Math.abs(mouse.y) > 0.1) {
        createTurningFlames(mouse.x, mouse.y, right, up);
    }
    
    // SIDE MOVEMENT FLAMES
    if (keys['a'] || keys['arrowleft']) {
        // LEFT STRAFING - Right side thrusters
        createStrafeFlames('left', right);
    }
    else if (keys['d'] || keys['arrowright']) {
        // RIGHT STRAFING - Left side thrusters  
        createStrafeFlames('right', right);
    }
    
    // VERTICAL MOVEMENT FLAMES
    if (keys['q']) {
        // UP MOVEMENT - Bottom thrusters
        createVerticalFlames('up', up);
    }
    else if (keys['e']) {
        // DOWN MOVEMENT - Top thrusters
        createVerticalFlames('down', up);
    }
    
    // IDLE ENGINE GLOW (when not moving)
    if (!isMoving) {
        createIdleGlow(enginePositions);
    }
}

function createBoostFlames(enginePositions, forward) {
    const boostIntensity = Math.min(1.0, gameState.boost / 2.5);
    
    enginePositions.forEach(engineOffset => {
        const worldPos = engineOffset.clone().applyMatrix4(ship.matrixWorld);
        
        // Main boost flames
        for (let i = 0; i < 5; i++) {
            const flameColor = new THREE.Color().setHSL(
                0.08 + Math.random() * 0.1, // Orange to yellow
                1.0,
                0.5 + Math.random() * 0.3
            );
            
            const size = 0.2 + Math.random() * 0.4 * boostIntensity;
            
            const spread = new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.4
            );
            
            const velocity = forward.clone()
                .multiplyScalar(-1.5 - Math.random() * 1.0 * boostIntensity) // Backward
                .add(spread);
            
            const flame = createFlameParticle(worldPos, flameColor, size, velocity);
            flame.userData.life = 0.8 + Math.random() * 0.7;
            flame.userData.maxLife = flame.userData.life;
        }
        
        // Afterburner effect
        if (Math.random() > 0.7) {
            const afterburnerColor = new THREE.Color().setHSL(0.02, 1.0, 0.8);
            createFlameParticle(worldPos, afterburnerColor, 0.7, 
                forward.clone().multiplyScalar(-2.5));
        }
    });
}

function createForwardFlames(enginePositions, forward) {
    enginePositions.forEach(engineOffset => {
        const worldPos = engineOffset.clone().applyMatrix4(ship.matrixWorld);
        
        for (let i = 0; i < 2; i++) {
            const flameColor = new THREE.Color().setHSL(0.12, 1.0, 0.6); // Yellow-orange
            const size = 0.15 + Math.random() * 0.2;
            
            const velocity = forward.clone()
                .multiplyScalar(-0.8 - Math.random() * 0.4) // Gentle backward
                .add(new THREE.Vector3(
                    (Math.random() - 0.5) * 0.2,
                    (Math.random() - 0.5) * 0.2,
                    (Math.random() - 0.5) * 0.1
                ));
            
            const flame = createFlameParticle(worldPos, flameColor, size, velocity);
            flame.userData.life = 0.4 + Math.random() * 0.3;
            flame.userData.maxLife = flame.userData.life;
        }
    });
}

function createReverseFlames(forward) {
    // Front-facing thrusters for reverse/braking
    const frontThrusterPositions = [
        new THREE.Vector3(-1.5, 0, 1),  // Left front
        new THREE.Vector3(1.5, 0, 1),   // Right front
        new THREE.Vector3(0, 0.5, 1),   // Top front
        new THREE.Vector3(0, -0.5, 1)   // Bottom front
    ];
    
    frontThrusterPositions.forEach(thrusterOffset => {
        const worldPos = thrusterOffset.clone().applyMatrix4(ship.matrixWorld);
        
        for (let i = 0; i < 3; i++) {
            const flameColor = new THREE.Color().setHSL(0.02, 1.0, 0.7); // Red-orange
            const size = 0.1 + Math.random() * 0.15;
            
            // Flames shoot forward when reversing/braking
            const velocity = forward.clone()
                .multiplyScalar(0.6 + Math.random() * 0.3) // Forward direction
                .add(new THREE.Vector3(
                    (Math.random() - 0.5) * 0.3,
                    (Math.random() - 0.5) * 0.3,
                    (Math.random() - 0.5) * 0.2
                ));
            
            const flame = createFlameParticle(worldPos, flameColor, size, velocity);
            flame.userData.life = 0.3 + Math.random() * 0.2;
            flame.userData.maxLife = flame.userData.life;
        }
    });
}

function createTurningFlames(mouseX, mouseY, right, up) {
    const turnIntensity = Math.max(Math.abs(mouseX), Math.abs(mouseY));
    
    // YAW (left/right turning) - Side thrusters
    if (Math.abs(mouseX) > 0.1) {
        const yawThrusterPositions = [
            new THREE.Vector3(mouseX > 0 ? -3 : 3, 0, -1), // Opposite side for turning
            new THREE.Vector3(mouseX > 0 ? -2.5 : 2.5, 0.5, 0),
            new THREE.Vector3(mouseX > 0 ? -2.5 : 2.5, -0.5, 0)
        ];
        
        yawThrusterPositions.forEach(thrusterOffset => {
            const worldPos = thrusterOffset.clone().applyMatrix4(ship.matrixWorld);
            
            for (let i = 0; i < 2; i++) {
                const flameColor = new THREE.Color().setHSL(0.6, 1.0, 0.7); // Blue
                const size = 0.08 + Math.random() * 0.1 * turnIntensity;
                
                // Thrust opposite to turn direction
                const thrustDirection = right.clone().multiplyScalar(mouseX > 0 ? 1 : -1);
                const velocity = thrustDirection
                    .multiplyScalar(0.4 + Math.random() * 0.3 * turnIntensity);
                
                const flame = createFlameParticle(worldPos, flameColor, size, velocity);
                flame.userData.life = 0.2 + Math.random() * 0.2;
                flame.userData.maxLife = flame.userData.life;
            }
        });
    }
    
    // PITCH (up/down turning) - Vertical thrusters
    if (Math.abs(mouseY) > 0.1) {
        const pitchThrusterPositions = [
            new THREE.Vector3(0, mouseY > 0 ? -1 : 1, -1),
            new THREE.Vector3(1, mouseY > 0 ? -0.8 : 0.8, 0),
            new THREE.Vector3(-1, mouseY > 0 ? -0.8 : 0.8, 0)
        ];
        
        pitchThrusterPositions.forEach(thrusterOffset => {
            const worldPos = thrusterOffset.clone().applyMatrix4(ship.matrixWorld);
            
            for (let i = 0; i < 2; i++) {
                const flameColor = new THREE.Color().setHSL(0.3, 1.0, 0.7); // Green-blue
                const size = 0.08 + Math.random() * 0.1 * turnIntensity;
                
                // Thrust opposite to pitch direction
                const thrustDirection = up.clone().multiplyScalar(mouseY > 0 ? 1 : -1);
                const velocity = thrustDirection
                    .multiplyScalar(0.4 + Math.random() * 0.3 * turnIntensity);
                
                const flame = createFlameParticle(worldPos, flameColor, size, velocity);
                flame.userData.life = 0.2 + Math.random() * 0.2;
                flame.userData.maxLife = flame.userData.life;
            }
        });
    }
}

function createStrafeFlames(direction, right) {
    const strafeThrusterPositions = direction === 'left' 
        ? [new THREE.Vector3(2.5, 0, 0), new THREE.Vector3(2.5, 0.5, -0.5)]  // Right side for left strafe
        : [new THREE.Vector3(-2.5, 0, 0), new THREE.Vector3(-2.5, 0.5, -0.5)]; // Left side for right strafe
    
    strafeThrusterPositions.forEach(thrusterOffset => {
        const worldPos = thrusterOffset.clone().applyMatrix4(ship.matrixWorld);
        
        for (let i = 0; i < 2; i++) {
            const flameColor = new THREE.Color().setHSL(0.7, 1.0, 0.7); // Purple
            const size = 0.1 + Math.random() * 0.1;
            
            // Thrust opposite to strafe direction
            const thrustDirection = right.clone().multiplyScalar(direction === 'left' ? -1 : 1);
            const velocity = thrustDirection.multiplyScalar(0.5 + Math.random() * 0.2);
            
            const flame = createFlameParticle(worldPos, flameColor, size, velocity);
            flame.userData.life = 0.25 + Math.random() * 0.15;
            flame.userData.maxLife = flame.userData.life;
        }
    });
}

function createVerticalFlames(direction, up) {
    const verticalThrusterPositions = direction === 'up'
        ? [new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, -0.8, 0), new THREE.Vector3(-1, -0.8, 0)]  // Bottom for up
        : [new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0.8, 0), new THREE.Vector3(-1, 0.8, 0)];    // Top for down
    
    verticalThrusterPositions.forEach(thrusterOffset => {
        const worldPos = thrusterOffset.clone().applyMatrix4(ship.matrixWorld);
        
        for (let i = 0; i < 2; i++) {
            const flameColor = new THREE.Color().setHSL(0.4, 1.0, 0.7); // Cyan
            const size = 0.1 + Math.random() * 0.1;
            
            // Thrust opposite to movement direction
            const thrustDirection = up.clone().multiplyScalar(direction === 'up' ? 1 : -1);
            const velocity = thrustDirection.multiplyScalar(0.5 + Math.random() * 0.2);
            
            const flame = createFlameParticle(worldPos, flameColor, size, velocity);
            flame.userData.life = 0.25 + Math.random() * 0.15;
            flame.userData.maxLife = flame.userData.life;
        }
    });
}

function createIdleGlow(enginePositions) {
    // Subtle engine glow when idle
    if (Math.random() > 0.8) {
        enginePositions.forEach(engineOffset => {
            const worldPos = engineOffset.clone().applyMatrix4(ship.matrixWorld);
            const glowColor = new THREE.Color().setHSL(0.14, 0.8, 0.4); // Dim orange
            const size = 0.05 + Math.random() * 0.05;
            
            const velocity = new THREE.Vector3(0, 0, -0.1); // Very slow backward
            const glow = createFlameParticle(worldPos, glowColor, size, velocity);
            glow.userData.life = 0.2 + Math.random() * 0.1;
            glow.userData.maxLife = glow.userData.life;
        });
    }
}



function createExplosion(pos, color = 0xff6600) {
    for (let i = 0; i < 20; i++) {
        createParticle(pos, color, Math.random() * 0.6 + 0.3);
    }
    playSound(100, 0.25, 'sawtooth', 0.12);
}

function fireProjectile() {
    if (gameState.weaponCooldown > 0 || !gameState.playing) return;
    
    gameState.weaponCooldown = 0.25;
    
    const projectile = new THREE.Group();
    
    // Create procedural missile (more reliable)
    const missileGeometry = new THREE.CylinderGeometry(0.1, 0.05, 0.8, 8);
    const missileMaterial = materialManager.getMissileMaterial();
    const missile = new THREE.Mesh(missileGeometry, missileMaterial);
    missile.rotation.x = Math.PI / 2;
    projectile.add(missile);
    
    const light = new THREE.PointLight(0xff3300, 2, 10);
    projectile.add(light);
    
    projectile.position.copy(ship.position);
    projectile.position.y += 0.5;
    
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(ship.quaternion);
    projectile.userData.velocity = direction.multiplyScalar(2.5);
    projectile.userData.life = 2.5;
    
    scene.add(projectile);
    projectiles.push(projectile);
    
    playSound(350, 0.08, 'square', 0.06);
}

function createEnemy(pos, type = 'basic') {
    const enemy = new THREE.Group();
    
    let health, speed, scale, color;
    
    switch(type) {
        case 'basic':
            health = 2;
            speed = 0.12;
            scale = 0.005;
            color = 0xff0000;
            break;
        case 'fast':
            health = 1;
            speed = 0.18;
            scale = 0.005;
            color = 0xff4444;
            break;
        case 'tank':
            health = 4;
            speed = 0.08;
            scale = 0.005;
            color = 0x990000;
            break;
        default:
            health = 2;
            speed = 0.12;
            scale = 0.005;
            color = 0xff0000;
    }
    
    // Load model with type-specific properties
    gltfLoader.load(
        'models/enemy.gltf',
        function (gltf) {
            const model = gltf.scene;
            model.rotation.y = -Math.PI / 2;
            model.rotation.x = Math.PI / 24;
            model.scale.set(scale, scale, scale);
            enemy.add(model);
            addEnemyEffects(enemy, color);
        },
        undefined,
        function (error) {
            createProceduralEnemy(enemy, color);
        }
    );
    
    enemy.position.copy(pos);
    enemy.userData.health = health;
    enemy.userData.speed = speed;
    enemy.userData.type = type;
    enemy.userData.lastAttackTime = 0;
    enemy.userData.attackCooldown = type === 'fast' ? 800 : 1000;
    
    scene.add(enemy);
    enemies.push(enemy);
    return enemy;
}

function createProceduralEnemy(enemy) {
    // Fallback procedural enemy (your original code)
    const enemyGeometry = new THREE.OctahedronGeometry(1.2, 1);
    const enemyMaterial = materialManager.getEnemyMaterial();
    const enemyMesh = new THREE.Mesh(enemyGeometry, enemyMaterial);
    enemyMesh.castShadow = true;
    enemy.add(enemyMesh);
    
    addEnemyEffects(enemy);
}

function addEnemyEffects(enemy, color) {
    // Red pulsating light
    const light = new THREE.PointLight(0xff0000, 2, 25); // Reduced intensity and range
    light.userData.baseIntensity = 2;
    enemy.add(light);
    
    // Target indicator (shows when enemy is targeting player)
    const targetRingGeometry = new THREE.RingGeometry(2.5, 3, 16);
    const targetRingMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0, // Start invisible
        side: THREE.DoubleSide
    });
    const targetRing = new THREE.Mesh(targetRingGeometry, targetRingMaterial);
    targetRing.rotation.x = Math.PI / 2;
    enemy.add(targetRing);
    enemy.userData.targetRing = targetRing;
    
    // Initialize patrol properties
    enemy.userData.lastDirectionChange = Date.now();
    enemy.userData.patrolDirection = null;
}

// Proper checkpoint creation function
function createCheckpoint(pos, index) {
    const checkpoint = new THREE.Group();
    
    // Create rings with proper material assignment - each ring gets its own material
    const ringGeometry = new THREE.TorusGeometry(4, 0.3, 16, 32);

    const ringMaterial1 = materialManager.getCheckpointMaterial();
    const ring1 = new THREE.Mesh(ringGeometry, ringMaterial1);
    checkpoint.add(ring1);

    const ringMaterial2 = materialManager.getCheckpointMaterial();
    const ring2 = new THREE.Mesh(ringGeometry, ringMaterial2);
    ring2.rotation.y = Math.PI / 2;
    checkpoint.add(ring2);
    
    // Add light
    const light = new THREE.PointLight(0x00ff00, 3, 40);
    checkpoint.add(light);
    
    // Set position and user data
    checkpoint.position.copy(pos);
    checkpoint.userData = {
        index: index,
        reached: false,
        rings: [ring1, ring2] // Store reference to rings
    };
    
    scene.add(checkpoint);
    checkpoints.push(checkpoint);
    
    return checkpoint;
}
function createAsteroid(pos, size, texturePath) {
    const obstacle = new THREE.Mesh();
    obstacle.geometry = new THREE.DodecahedronGeometry(size, 1);
    
    // Start with fallback material (always set immediately)
    obstacle.material = materialManager.getAsteroidMaterial();
    
    // Try to load texture, will replace material when loaded
    if (texturePath) {
        materialManager.loadAsteroidTexture(
            texturePath,
            function(material) {
                obstacle.material = material;
            },
            function(fallbackMaterial) {
                // Material already set to fallback, but update if needed
                obstacle.material = fallbackMaterial;
            }
        );
    }
    
    obstacle.position.copy(pos);
    obstacle.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    obstacle.userData.rotationSpeed = {
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.02
    };
    obstacle.userData.size = size;
    obstacle.userData.health = 2;
    
    scene.add(obstacle);
    obstacles.push(obstacle);
    
    return obstacle;
}

function createLevel(level) {
    // Clear existing objects
    orbs.forEach(orb => scene.remove(orb));
    obstacles.forEach(obs => scene.remove(obs));
    powerups.forEach(p => scene.remove(p));
    enemies.forEach(e => scene.remove(e));
    checkpoints.forEach(c => scene.remove(c));
    projectiles.forEach(p => scene.remove(p));
    particles.forEach(p => scene.remove(p));
    
    orbs = [];
    obstacles = [];
    powerups = [];
    enemies = [];
    checkpoints = [];
    projectiles = [];
    particles = [];
    
    gameState.level = level;
    gameState.orbsCollected = 0;
    gameState.orbsTotal = 15 + (level * 5);
    gameState.combo = 0;
    gameState.comboTimer = 0;
    gameState.powerups = {};
    gameState.checkpointsReached = 0;
    gameState.totalCheckpoints = 3 + level;
    gameState.kills = 0;
    
    // Create orbs
    for (let i = 0; i < gameState.orbsTotal; i++) {
        const orbGeometry = new THREE.SphereGeometry(0.9, 32, 32);
        const orbMaterial = materialManager.getOrbMaterial();
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        
        orb.position.set(
            (Math.random() - 0.5) * 160,
            (Math.random() - 0.5) * 45,
            (Math.random() - 0.5) * 160
        );
        
        const orbLight = new THREE.PointLight(0xffff00, 2.5, 28);
        orb.add(orbLight);
        
        scene.add(orb);
        orbs.push(orb);
    }
    
    const obstacleCount = 10 + (level * 8);
    for (let i = 0; i < obstacleCount; i++) {
        const size = 2 + Math.random() * (level * 1.5);
        
        // Optionally specify texture path here
        // Pass null or undefined to use procedural material
        const texturePath = 'textures/asteroid.webp'; // Change to your texture path
        // const texturePath = null; // Use this for procedural materials only
        
        const obstaclePos = new THREE.Vector3(
            (Math.random() - 0.5) * 170,
            (Math.random() - 0.5) * 45,
            (Math.random() - 0.5) * 170
        );
        
        createAsteroid(obstaclePos, size, texturePath);
    }
    
    // Create powerups
    const powerupCount = 3 + level;
    for (let i = 0; i < powerupCount; i++) {
        const types = ['shield', 'speed', 'weapon'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const geometry = new THREE.OctahedronGeometry(0.7, 1);
        const material = materialManager.getPowerupMaterial(type);
        const powerup = new THREE.Mesh(geometry, material);
        powerup.position.set(
            (Math.random() - 0.5) * 150,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 150
        );
        powerup.userData.type = type;
        
        const light = new THREE.PointLight(material.color, 2.5, 22);
        powerup.add(light);
        
        scene.add(powerup);
        powerups.push(powerup);
    }
    
    // Create varied enemies
    const enemyCount = 2 + (level * 2);
    for (let i = 0; i < enemyCount; i++) {
        let enemyType = 'basic';
        
        // Add enemy variety based on level
        if (level >= 2 && Math.random() < 0.3) {
            enemyType = 'fast';
        }
        if (level >= 3 && Math.random() < 0.2) {
            enemyType = 'tank';
        }
        
        createEnemy(new THREE.Vector3(
            (Math.random() - 0.5) * 140,
            (Math.random() - 0.5) * 35,
            (Math.random() - 0.5) * 140
        ), enemyType);
    }
    
    // Create checkpoints
    for (let i = 0; i < gameState.totalCheckpoints; i++) {
        createCheckpoint(new THREE.Vector3(
            (Math.random() - 0.5) * 120,
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 120
        ), i);
    }
    
    updateUI();
    console.log(`Level ${level} loaded with ${modelsLoaded.plane ? 'aircraft models' : 'procedural models'}`);
}

window.startGame = function(level) {
    if (!initialized) {
        alert('Game loading...');
        return;
    }
    
    handleUserInteraction(); // Add user interaction for audio
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('gameOver').style.display = 'none';
    const creditsEl = document.getElementById('credits');
    if (creditsEl) creditsEl.classList.add('hidden');
    const pauseEl = document.getElementById('pauseMenu');
    if (pauseEl) pauseEl.classList.add('hidden');
    gameState.playing = true;
    gameState.paused = false;
    gameState.score = 0;
    gameState.energy = 100;
    gameState.shield = 0;
    gameState.cameraMode = 0;
    gameState.kills = 0;
    gameState.weaponCooldown = 0;
    ship.position.set(0, 0, 0);
    ship.rotation.set(0, 0, 0);
    createLevel(level);
    if (gameState.musicOn) startAmbient();
    animate();
}

window.restartGame = function() {
    window.startGame(gameState.level);
}

window.nextLevel = function() {
    if (gameState.level < 3) {
        window.startGame(gameState.level + 1);
    } else {
        alert("Congratulations! You've completed all levels!");
        backToMenu();
    }
}

//Proper endGame function
function endGame(won) {
    gameState.playing = false;
    gameState.paused = false;
    stopAmbient();
    const gameOverDiv = document.getElementById('gameOver');
    const gameOverText = document.getElementById('gameOverText');
    const gameStats = document.getElementById('gameStats');
    const nextLevelBtn = document.getElementById('nextLevelBtn');
    
    if (won) {
        gameOverText.innerHTML = `🏆 LEVEL ${gameState.level} COMPLETE! 🏆`;
        playSound(450, 0.6);
        setTimeout(() => playSound(550, 0.6), 250);
        setTimeout(() => playSound(700, 1), 500);
        
        // Show Next Level button if not on the last level
        if (gameState.level < 3) {
            nextLevelBtn.style.display = 'block';
        } else {
            nextLevelBtn.style.display = 'none';
        }
    } else {
        gameOverText.innerHTML = `💥 MISSION FAILED 💥`;
        createExplosion(ship.position, 0x00ffff);
        playSound(60, 1.2, 'sawtooth', 0.18);
        // Hide Next Level button on failure
        nextLevelBtn.style.display = 'none';
    }
    
    gameStats.innerHTML = `
        <div style="text-align: left; display: inline-block;">
        <strong>═══ MISSION REPORT ═══</strong><br>
        Final Score: <span style="color: #ff0;">${gameState.score}</span><br>
        Orbs Collected: ${gameState.orbsCollected}/${gameState.orbsTotal}<br>
        Enemies Destroyed: ${gameState.kills}<br>
        Checkpoints Reached: ${gameState.checkpointsReached}/${gameState.totalCheckpoints}<br>
        Max Combo: ${gameState.combo}x
        </div>
    `;
    
    gameOverDiv.style.display = 'block';
}

window.backToMenu = function() {
    document.getElementById('menu').classList.remove('hidden');
    document.getElementById('gameOver').style.display = 'none';
    const pauseEl = document.getElementById('pauseMenu');
    if (pauseEl) pauseEl.classList.add('hidden');
    const creditsEl = document.getElementById('credits');
    if (creditsEl) creditsEl.classList.add('hidden');
    
    // Hide the Next Level button when returning to menu
    const nextLevelBtn = document.getElementById('nextLevelBtn');
    if (nextLevelBtn) nextLevelBtn.style.display = 'none';
    
    gameState.playing = false;
    gameState.paused = false;
    stopAmbient();
}

function updateShip() {
    if (!gameState.playing || gameState.paused || !ship) return;
    
    const deltaTime = 16 / 1000;
    const moveSpeed = gameState.speed * gameState.boost * (gameState.powerups.speed ? 1.6 : 1);
    
    if (keys[' '] && gameState.energy > 0) {
        gameState.boost = 2.5;
        gameState.energy -= 0.3;

        createMovementFlames();
        
        if (Math.random() > 0.7) {
            const particlePos = ship.position.clone();
            const offset = new THREE.Vector3(0, 0, 2);
            offset.applyQuaternion(ship.quaternion);
            particlePos.add(offset);
            createParticle(particlePos, 0x00ffff, 0.3, new THREE.Vector3(0, 0, 0.4));
        }
    } else {
        gameState.boost = 1;
        gameState.energy = Math.min(100, gameState.energy + 0.15);
    }
        // Update engine glow intensity during boost
    if (ship.userData.engineGlows) {
        const glowIntensity = keys[' '] && gameState.energy > 0 ? 1.5 : 1.0;
        
        ship.userData.engineGlows.forEach(glow => {
            const targetOpacity = glow.userData.baseOpacity * glowIntensity;
            glow.material.opacity += (targetOpacity - glow.material.opacity) * 0.1;
            
            // Pulsing effect during boost
            if (keys[' '] && gameState.energy > 0) {
                const pulse = Math.sin(Date.now() * 0.02) * 0.1 + 1.0;
                glow.scale.set(pulse, pulse, pulse);
            } else {
                glow.scale.set(1, 1, 1);
            }
        });
    }
    
    // Full 360° rotation with proper direction
    const maxRotation = Math.PI * 2; // Full 360 degrees in radians
    
    // Calculate target rotation based on mouse input
    ship.userData.targetRotation = {
        y: -mouse.x * maxRotation, // Full horizontal rotation
        x: mouse.y * (Math.PI / 2), // 90° up/down limit (more natural)
        z: -mouse.x * (Math.PI / 4) // 45° roll for banking effect
    };
    
    // Smooth rotation with full range
    const rotationSpeed = 0.15;
    
    // Handle full 360° rotation for Y-axis (wrap around)
    let targetY = ship.userData.targetRotation.y;
    let currentY = ship.rotation.y;
    
    // Normalize angles to handle wrap-around
    targetY = ((targetY + Math.PI) % (Math.PI * 2)) - Math.PI;
    currentY = ((currentY + Math.PI) % (Math.PI * 2)) - Math.PI;
    
    ship.rotation.y = currentY + (targetY - currentY) * rotationSpeed;
    ship.rotation.x += (ship.userData.targetRotation.x - ship.rotation.x) * rotationSpeed;
    ship.rotation.z += (ship.userData.targetRotation.z - ship.rotation.z) * rotationSpeed;
    
    // Movement relative to ship's rotation
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(ship.quaternion);
    
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(ship.quaternion);
    
    const up = new THREE.Vector3(0, 1, 0);
    
    // Movement controls - now relative to ship's orientation
    if (keys['w'] || keys['arrowup']) {
        ship.position.add(forward.clone().multiplyScalar(moveSpeed));
    }
    if (keys['s'] || keys['arrowdown']) {
        ship.position.add(forward.clone().multiplyScalar(-moveSpeed));
    }
    if (keys['a'] || keys['arrowleft']) {
        ship.position.add(right.clone().multiplyScalar(-moveSpeed));
    }
    if (keys['d'] || keys['arrowright']) {
        ship.position.add(right.clone().multiplyScalar(moveSpeed));
    }
    if (keys['q']) {
        ship.position.add(up.clone().multiplyScalar(moveSpeed));
    }
    if (keys['e']) {
        ship.position.add(up.clone().multiplyScalar(-moveSpeed));
    }
    
    // Position boundaries
    ship.position.x = Math.max(-100, Math.min(100, ship.position.x));
    ship.position.y = Math.max(-50, Math.min(50, ship.position.y));
    ship.position.z = Math.max(-100, Math.min(100, ship.position.z));
    
    // Firing
    if (mouse.clicked) {
        fireProjectile();
    }
    
    if (gameState.weaponCooldown > 0) {
        gameState.weaponCooldown -= deltaTime;
    }
    
    updateCamera();
}

function updateCamera() {
    if (!ship || !camera) return;
    
    if (gameState.cameraMode === 0) {
        const offset = new THREE.Vector3(0, 6, 14);
        offset.applyQuaternion(ship.quaternion);
        const targetPos = ship.position.clone().add(offset);
        camera.position.lerp(targetPos, 0.15);
        camera.lookAt(ship.position);
    } else if (gameState.cameraMode === 1) {
        const targetPos = ship.position.clone();
        targetPos.y += 1.2;
        camera.position.lerp(targetPos, 0.2);
        camera.rotation.copy(ship.rotation);
    } else {
        const targetPos = new THREE.Vector3(ship.position.x, ship.position.y + 65, ship.position.z);
        camera.position.lerp(targetPos, 0.15);
        camera.lookAt(ship.position);
    }
    
    if (miniMapCamera) {
        miniMapCamera.position.set(ship.position.x, 100, ship.position.z);
    }
}

function checkCollisions() {
    if (!ship) return;
    
    for (let i = orbs.length - 1; i >= 0; i--) {
        const orb = orbs[i];
        const dist = ship.position.distanceTo(orb.position);
        if (dist < 2.5) {
            scene.remove(orb);
            orbs.splice(i, 1);
            gameState.orbsCollected++;
            gameState.combo++;
            gameState.comboTimer = 3.5;
            
            const points = (100 * gameState.level) + (gameState.combo * 50);
            gameState.score += points;
            
            playSound(850 + (gameState.combo * 120), 0.12);
            
            for (let j = 0; j < 10; j++) {
                createParticle(orb.position, 0xffff00, 0.35);
            }
            
            if (gameState.combo > 1) {
                showCombo();
            }
            
            if (gameState.orbsCollected >= gameState.orbsTotal) {
                setTimeout(() => endGame(true), 500);
            }
        }
    }
    
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        const dist = ship.position.distanceTo(powerup.position);
        if (dist < 2.2) {
            scene.remove(powerup);
            powerups.splice(i, 1);
            
            activatePowerup(powerup.userData.type);
            playSound(650, 0.35, 'triangle');
            
            for (let j = 0; j < 12; j++) {
                createParticle(powerup.position, powerup.material.color, 0.45);
            }
        }
    }
    
    for (let i = checkpoints.length - 1; i >= 0; i--) {
        const checkpoint = checkpoints[i];
        if (!checkpoint.userData.reached) {
            const dist = ship.position.distanceTo(checkpoint.position);
            if (dist < 5) {
                checkpoint.userData.reached = true;
                gameState.checkpointsReached++;
                gameState.score += 500;
                
                showCheckpointMessage();
                playSound(700, 0.4, 'sine');
                
                for (let j = 0; j < 15; j++) {
                    createParticle(checkpoint.position, 0x00ff00, 0.5);
                }
            }
        }
    }
    
    obstacles.forEach(obs => {
        const dist = ship.position.distanceTo(obs.position);
        const collisionDist = obs.userData.size || 3;
        if (dist < collisionDist + 1.5) {
            if (gameState.shield > 0) {
                gameState.shield = Math.max(0, gameState.shield - 2);
            } else {
                gameState.energy = Math.max(0, gameState.energy - 1);
                gameState.combo = 0;
            }
            
            if (gameState.energy <= 0) {
                setTimeout(() => endGame(false), 100);
            }
        }
    });
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const proj = projectiles[i];
        let hitSomething = false;
        
        for (let j = obstacles.length - 1; j >= 0; j--) {
            const obs = obstacles[j];
            const dist = proj.position.distanceTo(obs.position);
            if (dist < obs.userData.size) {
                obs.userData.health--;
                
                scene.remove(proj);
                projectiles.splice(i, 1);
                hitSomething = true;
                
                createExplosion(obs.position, 0xff9900);
                
                if (obs.userData.health <= 0) {
                    scene.remove(obs);
                    obstacles.splice(j, 1);
                    gameState.score += 50;
                }
                break;
            }
        }
        
        if (hitSomething) continue;
        
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            const dist = proj.position.distanceTo(enemy.position);
            if (dist < 1.5) {
                enemy.userData.health--;
                
                scene.remove(proj);
                projectiles.splice(i, 1);
                
                if (enemy.userData.health <= 0) {
                    createExplosion(enemy.position, 0xff0000);
                    scene.remove(enemy);
                    enemies.splice(j, 1);
                    gameState.kills++;
                    gameState.score += 200 * gameState.level;
                    playSound(150, 0.4, 'sawtooth', 0.12);
                }
                break;
            }
        }
    }
    
    enemies.forEach(enemy => {
        const dist = ship.position.distanceTo(enemy.position);
        const currentTime = Date.now();
        
        if (dist < 3) { // Collision distance
            // Check attack cooldown
            if (currentTime - enemy.userData.lastAttackTime > enemy.userData.attackCooldown) {
                
                // Create attack effect
                createEnemyAttackEffect(enemy.position, ship.position);
                
                if (gameState.shield > 0) {
                    gameState.shield = Math.max(0, gameState.shield - 5); // More shield damage
                    playSound(300, 0.2, 'square', 0.1); // Shield hit sound
                } else {
                    gameState.energy = Math.max(0, gameState.energy - 3); // More energy drain
                    gameState.combo = 0;
                    playSound(200, 0.3, 'sawtooth', 0.15); // Energy drain sound
                    
                    // Screen shake effect on energy hit
                    cameraShake(0.3);
                }
                
                enemy.userData.lastAttackTime = currentTime;
                
                if (gameState.energy <= 0) {
                    setTimeout(() => endGame(false), 100);
                }
            }
        }
    });
}
function createEnemyAttackEffect(fromPos, toPos) {
    // Create energy beam effect
    const beamGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const beamMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    
    // Position beam between enemy and player
    const direction = new THREE.Vector3().subVectors(toPos, fromPos);
    const distance = direction.length();
    const center = new THREE.Vector3().addVectors(fromPos, toPos).multiplyScalar(0.5);
    
    beam.position.copy(center);
    beam.scale.set(1, distance, 1);
    beam.lookAt(toPos);
    
    scene.add(beam);
    
    // Animate beam
    const beamLife = 0.2; // Short duration
    const startTime = Date.now();
    
    function animateBeam() {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = elapsed / beamLife;
        
        if (progress < 1) {
            beam.material.opacity = 0.8 * (1 - progress);
            beam.scale.x = beam.scale.y = 1 - progress;
            requestAnimationFrame(animateBeam);
        } else {
            scene.remove(beam);
        }
    }
    animateBeam();
    
    // Create impact particles at player position
    for (let i = 0; i < 8; i++) {
        createParticle(toPos, 0xff0000, 0.2, 
            new THREE.Vector3(
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5,
                (Math.random() - 0.5) * 0.5
            )
        );
    }
}

function cameraShake(intensity = 0.2) {
    const originalPosition = camera.position.clone();
    const shakeDuration = 300; // ms
    
    function doShake(elapsed) {
        if (elapsed < shakeDuration) {
            camera.position.x = originalPosition.x + (Math.random() - 0.5) * intensity;
            camera.position.y = originalPosition.y + (Math.random() - 0.5) * intensity;
            requestAnimationFrame(() => doShake(elapsed + 16));
        } else {
            camera.position.copy(originalPosition);
        }
    }
    doShake(0);
}

function activatePowerup(type) {
    const duration = 10;
    gameState.powerups[type] = duration;
    
    const messages = {
        shield: '🛡️ SHIELD ACTIVATED',
        speed: '⚡ SPEED BOOST',
        weapon: '🔥 WEAPON POWER'
    };
    
    showPowerupNotif(messages[type]);
    
    if (type === 'shield') {
        gameState.shield = 100;
    } else if (type === 'weapon') {
        gameState.score += 300 * gameState.level;
    }
}

function showCombo() {
    const comboDiv = document.getElementById('combo');
    comboDiv.textContent = `✨ ${gameState.combo}x COMBO! ✨`;
    comboDiv.style.display = 'block';
    comboDiv.style.animation = 'none';
    setTimeout(() => {
        comboDiv.style.animation = 'comboScale 0.5s';
    }, 10);
}

function showPowerupNotif(text) {
    const notif = document.getElementById('powerupNotif');
    notif.textContent = text;
    notif.style.display = 'block';
    notif.style.animation = 'none';
    setTimeout(() => {
        notif.style.animation = 'powerupPop 2s forwards';
    }, 10);
    setTimeout(() => {
        notif.style.display = 'none';
    }, 2000);
}

function showCheckpointMessage() {
    const indicator = document.getElementById('checkpoint-indicator');
    indicator.textContent = `✓ CHECKPOINT +500pts!`;
    indicator.style.display = 'block';
    indicator.style.animation = 'none';
    setTimeout(() => {
        indicator.style.animation = 'powerupPop 2s forwards';
    }, 10);
    setTimeout(() => {
        indicator.style.display = 'none';
    }, 2000);
}

function updateUI() {
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('orbs').textContent = gameState.orbsCollected;
    document.getElementById('orbsTotal').textContent = gameState.orbsTotal;
    document.getElementById('enemyCount').textContent = enemies.length;
    document.getElementById('checkpointCount').textContent = gameState.checkpointsReached;
    document.getElementById('checkpointTotal').textContent = gameState.totalCheckpoints;
    
    const energyPercent = Math.max(0, Math.min(100, (gameState.energy / 100) * 100));
    document.getElementById('energyBar').style.width = energyPercent + '%';
    
    const shieldPercent = Math.max(0, Math.min(100, (gameState.shield / 100) * 100));
    document.getElementById('shieldBar').style.width = shieldPercent + '%';
    
    const weaponPercent = Math.max(0, Math.min(100, ((1 - (gameState.weaponCooldown / 0.25)) * 100)));
    document.getElementById('weaponBar').style.width = weaponPercent + '%';
    
    let powerupText = '';
    Object.keys(gameState.powerups).forEach(type => {
        if (gameState.powerups[type] > 0) {
            const icons = { shield: '🛡️', speed: '⚡', weapon: '🔥' };
            powerupText += `${icons[type]} ${Math.ceil(gameState.powerups[type])}s `;
        }
    });
    document.getElementById('powerupStatus').textContent = powerupText;
    
    if (gameState.comboTimer > 0) {
        document.getElementById('combo').style.display = 'block';
    } else {
        document.getElementById('combo').style.display = 'none';
        if (gameState.comboTimer <= 0) {
            gameState.combo = 0;
        }
    }
}

function updateCameraLabel() {
    const modes = ['Third Person', 'First Person', 'Top Down'];
    document.getElementById('cameraMode').textContent = modes[gameState.cameraMode];
}

// Proper animate function with safe checkpoint handling
function animate() {
    if (!gameState.playing) return;
    requestAnimationFrame(animate);
    
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastFrameTime) / 1000;
    lastFrameTime = currentTime;
    
    if (gameState.paused) {
        renderer.render(scene, camera);
        if (miniMapRenderer && miniMapCamera) {
            miniMapRenderer.render(scene, miniMapCamera);
        }
        return;
    }

    updateShip();
    
    orbs.forEach(orb => {
        orb.rotation.y += 0.035;
        orb.position.y += Math.sin(Date.now() * 0.002 + orb.position.x) * 0.025;
    });
    
    obstacles.forEach(obs => {
        obs.rotation.x += obs.userData.rotationSpeed.x;
        obs.rotation.y += obs.userData.rotationSpeed.y;
        obs.rotation.z += obs.userData.rotationSpeed.z;
    });
    
    powerups.forEach(p => {
        p.rotation.x += 0.025;
        p.rotation.y += 0.035;
        p.position.y += Math.sin(Date.now() * 0.0035 + p.position.x) * 0.035;
    });
    
    // Safe checkpoint animation with comprehensive validation
    for (let i = checkpoints.length - 1; i >= 0; i--) {
        const c = checkpoints[i];
        
        // CRITICAL: Validate checkpoint exists and is properly initialized
        if (!c || !c.isObject3D || !c.parent || !c.userData) {
            checkpoints.splice(i, 1);
            continue;
        }
        
        // Validate rings array exists and is valid
        if (!c.userData.rings || !Array.isArray(c.userData.rings) || c.userData.rings.length === 0) {
            scene.remove(c);
            checkpoints.splice(i, 1);
            continue;
        }
        
        // Rotate checkpoint
        c.rotation.y += 0.02;
        
        // Animate ring rotations (only if not reached yet)
        if (!c.userData.reached) {
            for (let j = 0; j < c.userData.rings.length; j++) {
                const ring = c.userData.rings[j];
                if (ring && ring.isObject3D && ring.rotation && ring.parent === c) {
                    ring.rotation.x += 0.01;
                }
            }
        }
        
        // Handle reached checkpoints - fade and remove
        if (c.userData.reached) {
            let shouldRemove = true;
            let hasValidRing = false;
            
            for (let j = 0; j < c.userData.rings.length; j++) {
                const ring = c.userData.rings[j];
                
                // Ultra-defensive validation - check EVERYTHING
                if (!ring || !ring.isObject3D || !ring.parent || ring.parent !== c) {
                    continue; // Skip invalid ring
                }
                
                if (!ring.material || typeof ring.material.opacity !== 'number') {
                    continue; // Skip ring with invalid material
                }
                
                hasValidRing = true;
                
                // Fade the ring
                ring.material.opacity = Math.max(0, ring.material.opacity - 0.01);
                
                if (ring.material.opacity > 0.01) {
                    shouldRemove = false;
                }
            }
            
            // Remove checkpoint if all rings are faded or no valid rings exist
            if (shouldRemove || !hasValidRing) {
                scene.remove(c);
                checkpoints.splice(i, 1);
            }
        }
    }
    
    // Enemy behavior
    enemies.forEach(enemy => {
        const direction = ship.position.clone().sub(enemy.position).normalize();
        const distanceToPlayer = ship.position.distanceTo(enemy.position);
        
        // Always face the player when chasing
        if (distanceToPlayer < 100) {
            enemy.lookAt(ship.position);
        }
        
        // Move toward player when in range
        if (distanceToPlayer < 80) {
            const chaseSpeed = enemy.userData.speed;
            enemy.position.add(direction.multiplyScalar(chaseSpeed));
            
            // Show target indicator when close
            if (distanceToPlayer < 25 && enemy.userData.targetRing && enemy.userData.targetRing.material) {
                enemy.userData.targetRing.material.opacity = 0.5 + Math.sin(Date.now() * 0.01) * 0.3;
            } else if (enemy.userData.targetRing && enemy.userData.targetRing.material) {
                enemy.userData.targetRing.material.opacity = 0;
            }
        } else {
            // Simple idle movement - just hover in place
            enemy.position.y += Math.sin(Date.now() * 0.002 + enemy.position.x) * 0.01;
        }
        
        // Pulsing light intensity
        const light = enemy.children.find(child => child.isPointLight);
        if (light && light.userData && typeof light.userData.baseIntensity === 'number') {
            const intensityPulse = Math.sin(Date.now() * 0.008) * 0.5 + 1;
            light.intensity = light.userData.baseIntensity * intensityPulse;
        }
    });
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.position.add(p.userData.velocity);
        p.userData.life -= deltaTime;
        
        if (p.userData.life <= 0) {
            scene.remove(p);
            projectiles.splice(i, 1);
        }
    }
    
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.position.add(p.userData.velocity);
        
        // Different behavior for flame particles vs explosion particles
        if (p.userData.maxLife !== undefined) {
            // Flame particles - faster fade, grow then shrink
            p.userData.life -= 0.05;
            const lifeRatio = p.userData.life / p.userData.maxLife;
            
            // Flame particles grow then shrink
            if (lifeRatio > 0.5) {
                p.scale.multiplyScalar(1.02); // Grow initially
            } else {
                p.scale.multiplyScalar(0.95); // Shrink at end
            }
            
            // Flame color changes (orange to red)
            if (p.material.color) {
                const hue = 0.1 * lifeRatio; // From orange to red
                p.material.color.setHSL(hue, 1.0, 0.4 + 0.3 * lifeRatio);
            }
            
            p.material.opacity = Math.max(0, p.userData.life * 0.8);
        } else {
            // Original explosion particles
            p.userData.life -= 0.025;
            p.material.opacity = Math.max(0, p.userData.life);
            p.scale.multiplyScalar(0.96);
        }
        
        if (p.userData.life <= 0) {
            scene.remove(p);
            particles.splice(i, 1);
        }
    }
    
    Object.keys(gameState.powerups).forEach(type => {
        if (gameState.powerups[type] > 0) {
            gameState.powerups[type] -= deltaTime;
            if (gameState.powerups[type] <= 0) {
                delete gameState.powerups[type];
            }
        }
    });
    
    if (gameState.comboTimer > 0) {
        gameState.comboTimer -= deltaTime;
    }
    
    checkCollisions();
    updateUI();
    
    renderer.render(scene, camera);
    if (miniMapRenderer && miniMapCamera) {
        miniMapRenderer.render(scene, miniMapCamera);
    }
}

function onMouseMove(e) {
    if (gameState.paused) return;
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Pause/Resume controls
window.togglePause = function() {
    if (!gameState.playing) return;
    gameState.paused = !gameState.paused;
    const pauseEl = document.getElementById('pauseMenu');
    if (pauseEl) {
        if (gameState.paused) {
            pauseEl.classList.remove('hidden');
        } else {
            pauseEl.classList.add('hidden');
        }
    }
}

window.resumeGame = function() {
    if (!gameState.playing) return;
    gameState.paused = false;
    const pauseEl = document.getElementById('pauseMenu');
    if (pauseEl) pauseEl.classList.add('hidden');
}

// Credits controls
window.showCredits = function() {
    const menu = document.getElementById('menu');
    const credits = document.getElementById('credits');
    if (menu) menu.classList.add('hidden');
    if (credits) credits.classList.remove('hidden');
}

window.hideCredits = function() {
    const menu = document.getElementById('menu');
    const credits = document.getElementById('credits');
    if (credits) credits.classList.add('hidden');
    if (menu) menu.classList.remove('hidden');
}