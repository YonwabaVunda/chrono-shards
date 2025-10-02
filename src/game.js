import { Level1 } from "./scenes/level1.js";
//import { Level2 } from "./scenes/level2.js";
// import { Level3 } from "./scenes/level3.js";

export class Game {
  constructor(scene, camera, ui) {
    this.scene = scene;
    this.camera = camera;
    this.ui = ui;
    this.currentLevel = null;
    this.levelIndex = 1;
    this.state = "menu";

    this.ui.showMenu();

    // Setup menu actions
    this.ui.startBtn.addEventListener("click", () => {
      this.loadLevel(this.levelIndex);
    });
  }

  loadLevel(levelNum) {
    if (this.currentLevel && this.currentLevel.dispose) {
      this.currentLevel.dispose(); // optional: clean up old meshes
    }

    this.scene.clear();

    switch (levelNum) {
      case 1: this.currentLevel = new Level1(this.scene, this.camera); break;
      case 2: this.currentLevel = new Level2(this.scene, this.camera); break;
      case 3: this.currentLevel = new Level3(this.scene, this.camera); break;
      default: 
        console.log("All shards collected. Game complete!");
        this.state = "end";
        return;
    }

    this.currentLevel.onShardCollected = () => {
      console.log(`Shard collected! Loading level ${levelNum + 1}`);
      this.levelIndex++;
      this.loadLevel(this.levelIndex);
    };

    this.state = "playing";
  }

  update() {
    if (this.state === "playing" && this.currentLevel) {
      this.currentLevel.update();
    }
  }
}
