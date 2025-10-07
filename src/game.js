import { Level1 } from "./scenes/level1.js";
// import { Level2 } from "./scenes/level2.js";
// import { Level3 } from "./scenes/level3.js";

export class Game {
  constructor(scene, camera, ui) {
    this.scene = scene;
    this.camera = camera;
    this.ui = ui;
    this.currentLevel = null;
    this.levelIndex = 1;
    this.state = "menu";

    // Array to track objects for current level
    this.levelObjects = [];

    // Show main menu
    this.ui.showMenu("menu");

    // Menu button events
    this.ui.startBtn.addEventListener("click", () => this.startGame());
    this.ui.settingsBtn.addEventListener("click", () => this.showSettings());
    this.ui.quitBtn.addEventListener("click", () => this.quitGame());
    this.ui.resumeBtn.addEventListener("click", () => this.resumeGame());
    this.ui.pauseSettingsBtn.addEventListener("click", () => this.showSettings());
    this.ui.mainMenuBtn.addEventListener("click", () => this.returnToMainMenu());
    this.ui.backBtn.addEventListener("click", () => this.closeSettings());

    // ESC toggles pause/resume
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (this.state === "playing") this.pauseGame();
        else if (this.state === "paused") this.resumeGame();
      }
    });
  }

  // --- Menu & State ---
  showMenu(menu) {
    this.ui.hideAllMenus();
    switch (menu) {
      case "menu": this.ui.menu.style.display = "flex"; break;
      case "pause": this.ui.pauseMenu.style.display = "flex"; break;
      case "settings": this.ui.settingsMenu.style.display = "flex"; break;
    }
  }

  startGame() {
    this.levelIndex = 1;
    this.loadLevel(this.levelIndex);
    this.state = "playing";
    this.showMenu(null);
  }

  pauseGame() {
    this.state = "paused";
    this.showMenu("pause");
  }

  resumeGame() {
    this.state = "playing";
    this.showMenu(null);
  }

  returnToMainMenu() {
    this.state = "menu";
    this.clearLevelObjects();
    this.currentLevel = null;
    this.showMenu("menu");
  }

  showSettings() {
    this.state = "settings";
    this.showMenu("settings");
  }

  closeSettings() {
    if (this.currentLevel) {
      this.showMenu("pause");
      this.state = "paused";
    } else {
      this.showMenu("menu");
      this.state = "menu";
    }
  }

  quitGame() {
    alert("Thanks for playing Chrono Shards!");
    window.close();
  }

  // --- Level Management ---
  loadLevel(levelNum) {
    // Clear previous level objects
    this.clearLevelObjects();

    // Create a new array for this level
    this.levelObjects = [];

    // Load level
    switch (levelNum) {
      case 1:
        this.currentLevel = new Level1(this.scene, this.camera, this.levelObjects);
        break;
      // case 2: this.currentLevel = new Level2(this.scene, this.camera, this.levelObjects); break;
      // case 3: this.currentLevel = new Level3(this.scene, this.camera, this.levelObjects); break;
      default:
        alert("All shards collected. Game complete!");
        this.state = "end";
        this.returnToMainMenu();
        return;
    }

    // Hook shard collection → load next level
    this.currentLevel.onShardCollected = () => {
      alert(`Shard collected! Loading level ${levelNum + 1}`);
      this.levelIndex++;
      this.loadLevel(this.levelIndex);
    };

    this.state = "playing";
  }

  // Clear all objects from previous level
  clearLevelObjects() {
    if (!this.levelObjects) return;

    this.levelObjects.forEach((obj) => {
      if (!obj) return;
      this.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });

    this.levelObjects = [];
  }

  // --- Game Loop Update ---
  update(delta) {
    if (this.state === "playing" && this.currentLevel) {
      this.currentLevel.update(delta);
    }
  }
}
