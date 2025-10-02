import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';
import { Game } from "./game.js";
import { UIManager } from "./ui.js";

let renderer, camera, scene, game;

function init() {
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("gameCanvas") });
  renderer.setSize(window.innerWidth, window.innerHeight);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  const ui = new UIManager();
  game = new Game(scene, camera, ui);

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  game.update();
  renderer.render(scene, camera);
}
init();
