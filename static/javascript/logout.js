function logout() {
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
