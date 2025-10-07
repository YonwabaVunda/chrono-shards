//THIS IS UI.JS
export class UIManager {
  constructor() {
    // Menus
    this.menu = document.getElementById("menu");
    this.pauseMenu = document.getElementById("pauseMenu");
    this.settingsMenu = document.getElementById("settingsMenu");

    // Buttons
    this.startBtn = document.getElementById("startBtn");
    this.settingsBtn = document.getElementById("settingsBtn");
    this.quitBtn = document.getElementById("quitBtn");

    this.resumeBtn = document.getElementById("resumeBtn");
    this.pauseSettingsBtn = document.getElementById("pauseSettingsBtn");
    this.mainMenuBtn = document.getElementById("mainMenuBtn");

    this.backBtn = document.getElementById("backBtn");
  }

  hideAllMenus() {
    this.menu.style.display = "none";
    this.pauseMenu.style.display = "none";
    this.settingsMenu.style.display = "none";
    
  }

  showMenu(menuName) {
    this.hideAllMenus();
    switch (menuName) {
      case "menu": this.menu.style.display = "flex"; break;
      case "pause": this.pauseMenu.style.display = "flex"; break;
      case "settings": this.settingsMenu.style.display = "flex"; break;
      default: break;
    }
  }
}
