import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://dytrdmvicireccasxxvj.supabase.co";
const supabaseKey = "YOUR_PUBLIC_ANON_KEY"; // replace with your anon key
const supabase = createClient(supabaseUrl, supabaseKey);

const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    alert("Please enter both fields");
    return;
  }

  // Call Supabase function
  const { data, error } = await supabase.rpc("check_admin_login", {
    user_input: username,
    pass_input: password
  });

  if (error) {
    alert("Server error: " + error.message);
    return;
  }

  if (data === true) {
    localStorage.setItem("adminLoggedIn", "true");
    alert("Login successful");
    window.location.href = "admin.html";
  } else {
    alert("Invalid username or password");
  }
});
