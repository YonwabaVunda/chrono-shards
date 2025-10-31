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

function initAudio() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            console.log('Audio not supported');
        }
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
    // If already sequencer running, do nothing
    if (music.stepTimer) return;
    try {
        // Create voices
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

        // Sequencer
        music.stepIdx = 0;
        const msPerBeat = 60000 / music.bpm;

        const scheduleStep = () => {
            // Lead
            const leadStep = music.leadPattern[music.stepIdx % music.leadPattern.length];
            if (leadStep.f > 0) {
                music.leadOsc.frequency.setTargetAtTime(leadStep.f, audioCtx.currentTime, 0.01);
                // ADSR-like envelope
                music.leadGain.gain.cancelScheduledValues(audioCtx.currentTime);
                music.leadGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
                music.leadGain.gain.linearRampToValueAtTime(0.045, audioCtx.currentTime + 0.02);
                music.leadGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + (leadStep.d * msPerBeat) / 1000 - 0.01);
            }

            // Arp
            const arpStep = music.arpPattern[music.stepIdx % music.arpPattern.length];
            if (arpStep.f > 0) {
                music.arpOsc.frequency.setTargetAtTime(arpStep.f, audioCtx.currentTime, 0.01);
                music.arpGain.gain.cancelScheduledValues(audioCtx.currentTime);
                music.arpGain.gain.setValueAtTime(0.0, audioCtx.currentTime);
                music.arpGain.gain.linearRampToValueAtTime(0.03, audioCtx.currentTime + 0.01);
                music.arpGain.gain.linearRampToValueAtTime(0.0, audioCtx.currentTime + (arpStep.d * msPerBeat) / 1000 - 0.01);
            }

            // Bass every two steps
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
                800 // safety cap
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
    
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000515, 0.0006);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 8, 15);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
            initAudio();
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
        initAudio();
        mouse.clicked = true;
    });
    document.addEventListener('mouseup', () => mouse.clicked = false);
    
    console.log('✓ Game Ready!');
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
        initAudio();
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
    //setTimeout(() => finishIntro(), t + 400);
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
    const ambientLight = new THREE.AmbientLight(0x505070, 0.7);
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffee, 1.5);
    sunLight.position.set(60, 70, 60);
    sunLight.castShadow = true;
    scene.add(sunLight);
    
    const light1 = new THREE.PointLight(0x00ffff, 2, 180);
    light1.position.set(-50, 25, -50);
    scene.add(light1);
    
    const light2 = new THREE.PointLight(0xff00ff, 2, 180);
    light2.position.set(50, 25, 50);
    scene.add(light2);
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
    
    const bodyGeometry = new THREE.ConeGeometry(1, 3.5, 4);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x00ffff, 
        emissive: 0x004466,
        shininess: 120
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    body.castShadow = true;
    ship.add(body);
    
    const wingGeometry = new THREE.BoxGeometry(6, 0.35, 1.8);
    const wingMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x0099ff,
        emissive: 0x002266
    });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.set(0, 0, -0.6);
    wings.castShadow = true;
    ship.add(wings);
    
    const cockpitGeometry = new THREE.SphereGeometry(0.55, 12, 12);
    const cockpitMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.7
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.5, 0.7);
    ship.add(cockpit);
    
    const engineLight = new THREE.PointLight(0x00ffff, 3, 15);
    engineLight.position.set(0, 0, -2);
    ship.add(engineLight);
    
    [-2.2, 2.2].forEach(x => {
        const engineGeometry = new THREE.CylinderGeometry(0.35, 0.45, 1, 8);
        const engineMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.95
        });
        const engine = new THREE.Mesh(engineGeometry, engineMaterial);
        engine.position.set(x, 0, -1.4);
        engine.rotation.x = Math.PI / 2;
        ship.add(engine);
    });
    
    ship.position.set(0, 0, 0);
    ship.userData.targetRotation = { x: 0, y: 0, z: 0 };
    scene.add(ship);
}

function createParticle(pos, color, size = 0.5, velocity = null) {
    const geometry = new THREE.SphereGeometry(size, 6, 6);
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
    const geometry = new THREE.SphereGeometry(0.3, 8, 8);
    const material = new THREE.MeshBasicMaterial({
        color: 0xff3300,
        transparent: true,
        opacity: 0.9
    });
    const mesh = new THREE.Mesh(geometry, material);
    projectile.add(mesh);
    
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

function createEnemy(pos) {
    const enemy = new THREE.Group();
    
    const bodyGeometry = new THREE.OctahedronGeometry(1.2);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        emissive: 0x660000,
        emissiveIntensity: 0.7
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    enemy.add(body);
    
    const light = new THREE.PointLight(0xff0000, 2, 25);
    enemy.add(light);
    
    enemy.position.copy(pos);
    enemy.userData.health = 2;
    enemy.userData.speed = 0.12 + Math.random() * 0.08;
    
    scene.add(enemy);
    enemies.push(enemy);
}

function createCheckpoint(pos, index) {
    const checkpoint = new THREE.Group();
    
    const ringGeometry = new THREE.TorusGeometry(4, 0.3, 16, 32);
    const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    checkpoint.add(ring);
    
    const ring2 = ring.clone();
    ring2.rotation.y = Math.PI / 2;
    checkpoint.add(ring2);
    
    const light = new THREE.PointLight(0x00ff00, 3, 40);
    checkpoint.add(light);
    
    checkpoint.position.copy(pos);
    checkpoint.userData.index = index;
    checkpoint.userData.reached = false;
    
    scene.add(checkpoint);
    checkpoints.push(checkpoint);
}

function createLevel(level) {
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
    
    for (let i = 0; i < gameState.orbsTotal; i++) {
        const orbGeometry = new THREE.SphereGeometry(0.9, 16, 16);
        const orbMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.95
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        
        orb.position.set(
            (Math.random() - 0.5) * 160,
            (Math.random() - 0.5) * 45,
            (Math.random() - 0.5) * 160
        );
        
        const orbLight = new THREE.PointLight(0xffff00, 2.5, 28);
        orb.add(orbLight);
        
        const ringGeometry = new THREE.TorusGeometry(1.3, 0.12, 8, 20);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        orb.add(ring);
        orb.userData.ring = ring;
        
        scene.add(orb);
        orbs.push(orb);
    }
    
    const obstacleCount = 10 + (level * 8);
    for (let i = 0; i < obstacleCount; i++) {
        const size = 2 + Math.random() * (level * 1.5);
        const geometry = new THREE.DodecahedronGeometry(size);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x888888,
            flatShading: true
        });
        const obstacle = new THREE.Mesh(geometry, material);
        
        obstacle.position.set(
            (Math.random() - 0.5) * 170,
            (Math.random() - 0.5) * 45,
            (Math.random() - 0.5) * 170
        );
        
        obstacle.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        obstacle.castShadow = true;
        obstacle.userData.rotationSpeed = {
            x: (Math.random() - 0.5) * 0.02,
            y: (Math.random() - 0.5) * 0.02,
            z: (Math.random() - 0.5) * 0.02
        };
        obstacle.userData.size = size;
        obstacle.userData.health = 2;
        
        scene.add(obstacle);
        obstacles.push(obstacle);
    }
    
    const powerupCount = 3 + level;
    for (let i = 0; i < powerupCount; i++) {
        const types = ['shield', 'speed', 'weapon'];
        const type = types[Math.floor(Math.random() * types.length)];
        const colors = { shield: 0x00ffff, speed: 0x00ff00, weapon: 0xff00ff };
        
        const geometry = new THREE.OctahedronGeometry(0.7, 0);
        const material = new THREE.MeshPhongMaterial({
            color: colors[type],
            emissive: colors[type],
            emissiveIntensity: 0.9,
            transparent: true,
            opacity: 0.85
        });
        const powerup = new THREE.Mesh(geometry, material);
        powerup.position.set(
            (Math.random() - 0.5) * 150,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 150
        );
        powerup.userData.type = type;
        
        const light = new THREE.PointLight(colors[type], 2.5, 22);
        powerup.add(light);
        
        scene.add(powerup);
        powerups.push(powerup);
    }
    
    const enemyCount = 2 + (level ** level);
    for (let i = 0; i < enemyCount; i++) {
        createEnemy(new THREE.Vector3(
            (Math.random() - 0.5) * 140,
            (Math.random() - 0.5) * 35,
            (Math.random() - 0.5) * 140
        ));
    }
    
    for (let i = 0; i < gameState.totalCheckpoints; i++) {
        createCheckpoint(new THREE.Vector3(
            (Math.random() - 0.5) * 120,
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 120
        ), i);
    }
    
    updateUI();
}

window.startGame = function(level) {
    if (!initialized) {
        alert('Game loading...');
        return;
    }
    
    initAudio();
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('gameOver').style.display = 'none';
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

window.backToMenu = function() {
    document.getElementById('menu').classList.remove('hidden');
    document.getElementById('gameOver').style.display = 'none';
    const pauseEl = document.getElementById('pauseMenu');
    if (pauseEl) pauseEl.classList.add('hidden');
    gameState.playing = false;
    gameState.paused = false;
    stopAmbient();
}

function updateShip() {
    if (!gameState.playing || gameState.paused || !ship) return;
    
    const deltaTime = 16 / 1000; // Normalized to 60fps
    const moveSpeed = gameState.speed * gameState.boost * (gameState.powerups.speed ? 1.6 : 1);
    
    if (keys[' '] && gameState.energy > 0) {
        gameState.boost = 2.5;
        gameState.energy -= 0.3;
        
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
    
    // Forward/Backward
    if (keys['w'] || keys['arrowup']) ship.position.z -= moveSpeed;
    if (keys['s'] || keys['arrowdown']) ship.position.z += moveSpeed;
    
    // Left/Right
    if (keys['a'] || keys['arrowleft']) ship.position.x -= moveSpeed;
    if (keys['d'] || keys['arrowright']) ship.position.x += moveSpeed;
    
    // Up/Down - Q to go up, E to go down
    if (keys['q']) ship.position.y += moveSpeed;
    if (keys['e']) ship.position.y -= moveSpeed;
    
    // Smooth rotation
    ship.userData.targetRotation.y = -mouse.x * 0.5;
    ship.userData.targetRotation.x = mouse.y * 0.3;
    ship.userData.targetRotation.z = -mouse.x * 0.2;
    
    ship.rotation.y += (ship.userData.targetRotation.y - ship.rotation.y) * 0.1;
    ship.rotation.x += (ship.userData.targetRotation.x - ship.rotation.x) * 0.1;
    ship.rotation.z += (ship.userData.targetRotation.z - ship.rotation.z) * 0.1;
    
    ship.position.x = Math.max(-100, Math.min(100, ship.position.x));
    ship.position.y = Math.max(-50, Math.min(50, ship.position.y));
    ship.position.z = Math.max(-100, Math.min(100, ship.position.z));
    
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
                createParticle(powerup.position, powerup.material.color.getHex(), 0.45);
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
        if (dist < 2) {
            if (gameState.shield > 0) {
                gameState.shield = Math.max(0, gameState.shield - 3);
            } else {
                gameState.energy = Math.max(0, gameState.energy - 2);
                gameState.combo = 0;
            }
            
            if (gameState.energy <= 0) {
                setTimeout(() => endGame(false), 100);
            }
        }
    });
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

function endGame(won) {
    gameState.playing = false;
    gameState.paused = false;
    stopAmbient();
    const gameOverDiv = document.getElementById('gameOver');
    const gameOverText = document.getElementById('gameOverText');
    const gameStats = document.getElementById('gameStats');
    
    if (won) {
        gameOverText.innerHTML = `🏆 LEVEL ${gameState.level} COMPLETE! 🏆`;
        playSound(450, 0.6);
        setTimeout(() => playSound(550, 0.6), 250);
        setTimeout(() => playSound(700, 1), 500);
    } else {
        gameOverText.innerHTML = `💥 MISSION FAILED 💥`;
        createExplosion(ship.position, 0x00ffff);
        playSound(60, 1.2, 'sawtooth', 0.18);
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
        if (orb.userData.ring) {
            orb.userData.ring.rotation.z += 0.025;
            const scale = 1 + Math.sin(Date.now() * 0.006) * 0.15;
            orb.userData.ring.scale.set(scale, scale, 1);
        }
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
    
    checkpoints.forEach(c => {
        c.rotation.y += 0.02;
        if (c.children[0]) c.children[0].rotation.x += 0.01;
        if (c.userData.reached && c.children[0] && c.children[0].material) {
            c.children.forEach(child => {
                if (child.material && child.material.opacity > 0) {
                    child.material.opacity = Math.max(0, child.material.opacity - 0.01);
                }
            });
        }
    });
    
    enemies.forEach(enemy => {
        enemy.rotation.y += 0.05;
        const direction = ship.position.clone().sub(enemy.position).normalize();
        enemy.position.add(direction.multiplyScalar(enemy.userData.speed));
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
        p.userData.life -= 0.025;
        p.material.opacity = Math.max(0, p.userData.life);
        p.scale.multiplyScalar(0.96);
        
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
