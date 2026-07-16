<?php
if (["REQUEST_METHOD"] == "POST") {
     = "info@organicreachseo.com"; // Change this to the client's actual email
     = "New Contact Form Submission";
    
     = htmlspecialchars(["fullname"]);
     = htmlspecialchars(["phone"]);
     = htmlspecialchars(["email"]);
     = htmlspecialchars(["interest"]);
     = htmlspecialchars(["message"]);
    
     = "Name: \n";
     .= "Email: \n";
     .= "Phone: \n";
     .= "Interest: \n\n";
     .= "Message:\n\n";
    
     = "From: " . "\r\n" .
               "Reply-To: " . "\r\n" .
               "X-Mailer: PHP/" . phpversion();
               
    if (mail(, , , )) {
        header("Location: contact.html?status=success");
        exit();
    } else {
        header("Location: contact.html?status=error");
        exit();
    }
} else {
    header("Location: contact.html");
    exit();
}
?>