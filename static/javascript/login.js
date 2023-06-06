import { getBaseUrl } from "./config.js";
import { saveAuthToken } from "./utils.js";

const loginForm = document.querySelector("#login-form");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const errorContainer = document.querySelector("#error-container");

console.log("errorContainer", errorContainer); // add this line

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorContainer.innerHTML = "";

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    errorContainer.innerHTML = "<p>Please enter a username and password.</p>";
    return;
  }

  try {
    const response = await fetch(`${getBaseUrl()}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      errorContainer.innerHTML = `<p>${errorData.message}</p>`;
      return;
    }

    const { token } = await response.json();
    saveAuthToken(token);
    window.location.href = `${getBaseUrl()}`;
  } catch (error) {
    errorContainer.innerHTML = `<p>${error.message}</p>`;
  }

});
