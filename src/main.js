import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';
import { Game } from "./game.js";
import { UIManager } from "./ui.js";
import { Minimap } from "./minimap.js";

let renderer, camera, scene, game, minimap;
const clock = new THREE.Clock(); // Add this line - create the clock

function init() {
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("gameCanvas") });
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  const ui = new UIManager();
  game = new Game(scene, camera, ui);

  // Initialize minimap after game is created
  setTimeout(() => {
    if (game.currentLevel && game.currentLevel.player) {
      minimap = new Minimap(scene, camera, game.currentLevel.player);
    }
  }, 1000);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  
  const deltaTime = clock.getDelta(); // Now clock is defined
  
  game.update(deltaTime);
  
  // Update minimap if it exists
  if (minimap) {
    minimap.update();
  }
  
  renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Add minimap controls (optional)
window.addEventListener('keydown', (event) => {
  if (minimap) {
    if (event.key === 'm') {
      minimap.toggleVisibility();
    }
    if (event.key === '+') {
      minimap.setZoom(minimap.zoomLevel * 1.2);
    }
    if (event.key === '-') {
      minimap.setZoom(minimap.zoomLevel * 0.8);
    }
  }
});

init();