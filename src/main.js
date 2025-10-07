import * as THREE from "three";
import { Game } from "./game.js";
import { UIManager } from "./ui.js";
import { Controls } from "./controls.js";
import { Player } from "./player.js";

let renderer, camera, scene, game, player, controls;
let previousTime = 0;

function init() {
  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("gameCanvas") });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);

  // Lights
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 5);
  scene.add(light);

  // Ground
  const groundGeo = new THREE.PlaneGeometry(100, 100);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // UI + Game
  const ui = new UIManager();
  game = new Game(scene, camera, ui);

  // ✅ Create player and controls AFTER scene exists
  player = new Player(scene);
  controls = new Controls(camera, renderer.domElement);

  // Start loop
  animate(0);
}

function animate(currentTime) {
  requestAnimationFrame(animate);
  const delta = (currentTime - previousTime) / 1000;
  previousTime = currentTime;

  if (player && controls) {
    const input = controls.getInputState();
    player.handleInput(input, delta);
    player.update(delta);
    controls.updateCamera(player.group.position);
  }

  renderer.render(scene, camera);
}

init();
