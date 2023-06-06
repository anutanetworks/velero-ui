document.addEventListener("DOMContentLoaded", function () {
    loadNavbar();
});

function loadNavbar() {
    const navbarElement = document.querySelector("#navbar");
    fetch("navbar")
        .then(response => {
            if (!response.ok) {
                throw new Error("Error loading navbar");
            }
            return response.text();
        })
        .then(navbarHtml => {
            navbarElement.innerHTML = navbarHtml;
            const logoutButton = document.querySelector("#logoutButton");
            if (logoutButton) {
                logoutButton.addEventListener("click", handleLogout);
            }
        })
        .catch(error => console.error("Failed to load navbar:", error));
}


function handleLogout() {
    fetch("logout", {
        method: "POST",
    })
        .then(response => {
            if (response.ok) {
                window.location.href = "login";
            } else {
                console.error("Failed to logout:", response.statusText);
            }
        })
        .catch(error => console.error("Failed to logout:", error));
}
