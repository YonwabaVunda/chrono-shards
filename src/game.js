import { Level1 } from "./scenes/level1.js";
import { Level2 } from "./scenes/level2.js";
import { Level3 } from "./scenes/level3.js";
import { Minimap } from "./minimap.js";

export class Game {
  constructor(scene, camera, ui) {
    this.scene = scene;
    this.camera = camera;
    this.ui = ui;
    this.currentLevel = null;
    this.levelIndex = 1;
    this.state = "menu";
    this.minimap = null;

    this.ui.showMenu();

    // Setup menu actions
    this.ui.startBtn.addEventListener("click", () => {
      this.loadLevel(this.levelIndex);
    });
  }

  loadLevel(levelNum) {
    if (this.currentLevel && this.currentLevel.dispose) {
      this.currentLevel.dispose();
    }

    this.scene.clear();

    switch (levelNum) {
      case 1: 
        this.currentLevel = new Level1(this.scene, this.camera); 
        break;
      case 2: 
        this.currentLevel = new Level2(this.scene, this.camera); 
        break;
      case 3: 
        this.currentLevel = new Level3(this.scene, this.camera); 
        break;
      default: 
        console.log("All shards collected. Game complete!");
        this.state = "end";
        this.showGameComplete();
        if (this.minimap) {
          this.minimap.destroy();
          this.minimap = null;
        }
        return;
    }

    this.currentLevel.onAllShardsCollected = () => {
      console.log(`Level ${levelNum} completed! Loading level ${levelNum + 1}`);
      this.levelIndex++;
      this.loadLevel(this.levelIndex);
    };

    this.state = "playing";
    
    // Initialize minimap after level loads
    setTimeout(() => {
      if (!this.minimap && this.currentLevel && this.currentLevel.player) {
        this.minimap = new Minimap(this.scene, this.camera, this.currentLevel.player);
      } else if (this.minimap && this.currentLevel) {
        this.minimap.changeLevel(this.scene);
      }
    }, 500);
  }

  update(deltaTime) {
    if (this.state === "playing" && this.currentLevel) {
      this.currentLevel.update(deltaTime);
    }
  }

  showGameComplete() {
    // Simple game complete message
    const message = document.createElement('div');
    message.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 24px;
      background: rgba(0,0,0,0.8);
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      z-index: 1000;
    `;
    message.innerHTML = `
      <h1>🎉 Timeline Restored!</h1>
      <p>You've collected all Chrono Shards across time!</p>
      <button onclick="location.reload()" style="padding: 10px 20px; margin: 10px; background: #00ffff; border: none; border-radius: 5px; cursor: pointer;">Play Again</button>
    `;
    document.body.appendChild(message);
  }
}