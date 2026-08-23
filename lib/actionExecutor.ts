export function executeAction(
  action: string
) {
  switch (action) {
    case "DOWNLOAD_RESUME":
      window.open("/resume.pdf");
      break;

    case "ENABLE_DARK_MODE":
      document.documentElement.classList.add("dark");
      break;

    case "ENABLE_LIGHT_MODE":
      document.documentElement.classList.remove("dark");
      break;

    case "OPEN_CONTACT":
      window.dispatchEvent(
        new CustomEvent("open-contact")
      );
      break;

    default:
      break;
  }
}
