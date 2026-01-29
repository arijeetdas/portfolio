const platformButtons = document.querySelectorAll(".platform-btn");
const downloadBtn = document.getElementById("download-btn");
const screenshotContainer = document.getElementById("screenshot-container");
const installSteps = document.getElementById("install-steps");

let activePlatform = "android";

/* ALL SCREENSHOTS (PLATFORM-INDEPENDENT) */
const allScreenshots = [
  "assets/apps/dice/mobile-1.jpg",
  "assets/apps/dice/mobile-2.jpg",
  "assets/apps/dice/desktop-1.png",
  "assets/apps/dice/desktop-2.png"
];

/* Platform-specific data (NO screenshots here) */
const platformData = {
  android: {
    downloadText: "Download for Android",
    downloadUrl: "https://github.com/arijeetdas/dice_app/releases/download/v1.1.0/DiceApp-Android-v1.1.0.apk",
    steps: [
      "Download the APK file",
      "Enable installation from unknown sources",
      "Install and open the app"
    ]
  },

  windows: {
    downloadText: "Download for Windows",
    downloadUrl: "https://github.com/arijeetdas/dice_app/releases/download/v1.1.0/DiceApp-Windows-v1.1.0.zip",
    steps: [
      "Download the zip file",
      "Extract the zip file",
      "Launch the .exe application"
    ]
  },

  linux: {
    downloadText: "Download for Linux",
    downloadUrl: "https://github.com/arijeetdas/dice_app/releases/download/v1.1.0/DiceApp-Linux-v1.1.0.zip",
    steps: [
      "Download the zip file",
      "Extract the zip file",
      "Launch the application"
    ]
  }
};

/* Update UI for selected platform */
function updatePlatform(platform) {
  const data = platformData[platform];
  if (!data) return;

  activePlatform = platform;

  /* Update download button */
  downloadBtn.textContent = data.downloadText;
  downloadBtn.href = data.downloadUrl;
  /* downloadBtn.target = "_blank"; */
  /* downloadBtn.rel = "noopener noreferrer"; */


  /* ALWAYS load ALL screenshots */
  screenshotContainer.innerHTML = "";
  allScreenshots.forEach(src => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "App screenshot";
    img.loading = "lazy";
    screenshotContainer.appendChild(img);
  });

  /* Update installation steps */
  installSteps.innerHTML = "";
  data.steps.forEach(step => {
    const li = document.createElement("li");
    li.textContent = step;
    installSteps.appendChild(li);
  });
}

/* Platform button click handling */
platformButtons.forEach(btn => {
  if (btn.classList.contains("disabled")) return;

  btn.addEventListener("click", () => {
    platformButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const platform = btn.dataset.platform;
    updatePlatform(platform);
  });
});

/* INITIAL LOAD */
const defaultBtn = document.querySelector('.platform-btn[data-platform="android"]');
if (defaultBtn) {
  defaultBtn.classList.add("active");
}
updatePlatform("android");