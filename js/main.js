// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {

  const androidBtn = document.getElementById("androidBtn");
  const iosBtn = document.getElementById("iosBtn");

  if (!androidBtn || !iosBtn) {
    console.error("Buttons not found. Check index.html IDs.");
    return;
  }

  // ANDROID BUTTON
  androidBtn.addEventListener("click", () => {
    alert("ANDROID button clicked");
  });

  // IOS BUTTON
  iosBtn.addEventListener("click", () => {
    alert("iOS / iPAD button clicked");
  });

});
