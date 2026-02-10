import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://dytrdmvicireccasxxvj.supabase.co",
  "sb_publishable_Rr3_s1fI61dQp14A-Hk92A_j_ZCAnuW"
);

const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const errorMsg = document.getElementById("errorMsg");

loginBtn.onclick = async () => {
  errorMsg.textContent = "";
  loginBtn.textContent = "Logging in...";
  loginBtn.disabled = true;

  const { error } = await supabase.auth.signInWithPassword({
    email: emailEl.value.trim(),
    password: passwordEl.value
  });

  if (error) {
    errorMsg.textContent = error.message;
    loginBtn.textContent = "Login";
    loginBtn.disabled = false;
    return;
  }

  // Success → go to admin panel
  window.location.href = "admin.html";
};
