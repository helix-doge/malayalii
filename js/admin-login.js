import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://dytrdmvicireccasxxvj.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5dHJkbXZpY2lyZWNjYXN4eHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyMTk1MjYsImV4cCI6MjA3ODc5NTUyNn0.MJpdbbhUI7BkZ_FtHao_83R2ncEQyTv3nS-YZBCyIHY"; // replace with your anon key
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
