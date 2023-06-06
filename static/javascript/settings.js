$(document).ready(function() {
  // Handle the change password form submission
  $("#changePasswordForm").submit(function(event) {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Get the values from the form inputs
    var username = $("#usernameInput").val();
    var oldPassword = $("#oldPasswordInput").val();
    var newPassword = $("#newPasswordInput").val();

    // Make an AJAX request to the backend to change the password
    $.ajax({
      type: "POST",
      url: "change-password",
      data: JSON.stringify({
        username: username,
        oldPassword: oldPassword,
        newPassword: newPassword
      }),
      contentType: "application/json",
      dataType: "json",
      success: function(response) {
        // Show a success message
        alert(response.message);
        // Clear the form inputs
        $("#usernameInput").val("");
        $("#oldPasswordInput").val("");
        $("#newPasswordInput").val("");
      },
      error: function(response) {
        // Show an error message
        alert(response.responseJSON.message);
      }
    });
  });
});
