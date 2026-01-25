// Make sure DOM is loaded
document.addEventListener("DOMContentLoaded", () => {

  const androidBtn = document.getElementById("androidBtn");
  const iosBtn = document.getElementById("iosBtn");

  if (!androidBtn || !iosBtn) {
    console.error("Buttons not found in DOM");
    return;
  }

  // ANDROID CLICK
  androidBtn.addEventListener("click", () => {
    alert("ANDROID button clicked");
    // later you can navigate or load apps here
  });

  // IOS CLICK
  iosBtn.addEventListener("click", () => {
    alert("iOS / iPad button clicked");
    // later you can navigate or load apps here
  });

});
