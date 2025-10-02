export class UIManager {
  constructor(onStart, onSettings, onQuit) {
    this.menu = document.getElementById("menu");
    this.startBtn = document.getElementById("startBtn");
    this.settingsBtn = document.getElementById("settingsBtn");
    this.quitBtn = document.getElementById("quitBtn");

    this.startBtn.addEventListener("click", () => {
      this.hideMenu();
      if (onStart) onStart();
    });

    this.settingsBtn.addEventListener("click", () => {
      alert("Settings are not implemented yet.");
      if (onSettings) onSettings();
    });

    this.quitBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to quit?")) {
        window.close(); // may not work in all browsers
        alert("Cannot close tab automatically. Please close it manually.");
        if (onQuit) onQuit();
      }
    });
  }

  showMenu() {
    this.menu.style.display = "flex";
  }

  hideMenu() {
    this.menu.style.display = "none";
  }
}
