<?php
// Połączenie z bazą danych
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "sklep_rowerowy";

try {
    $conn = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo "Błąd połączenia: " . $e->getMessage();
    die();
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = $_POST['name'];
    $surname = $_POST['surname'];
    $email = $_POST['email'];
    $password = $_POST['password'];
    
    // Sprawdzenie czy email już istnieje
    $stmt = $conn->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    
    if ($stmt->rowCount() > 0) {
        echo "Ten email jest już zarejestrowany!";
    } else {
        // Hashowanie hasła
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        // Wstawienie nowego użytkownika
        $stmt = $conn->prepare("INSERT INTO users (name, surname, email, password) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $surname, $email, $hashed_password]);
        
        // Przekierowanie do strony logowania
        header("Location: login.html");
        exit();
    }
}
?> 