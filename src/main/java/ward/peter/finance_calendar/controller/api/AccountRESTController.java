package ward.peter.finance_calendar.controller.api;

import ward.peter.finance_calendar.model.Account;
import ward.peter.finance_calendar.model.Expense;
import ward.peter.finance_calendar.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;
import java.util.List;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import jakarta.servlet.http.HttpSession;
import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.ui.Model;

@RestController
@RequestMapping("/api/account")
public class AccountRESTController {

    private final AccountService accountService;

    public AccountRESTController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/{userId}")
    public List<Expense> getExpensesByAccount(@PathVariable String userId) {
        return accountService.getExpensesByAccount(userId);
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest loginRequest, HttpSession session) {
        System.out.println("... LOGIN request ...");

        String name = loginRequest.getName();
        String password = loginRequest.getPassword();

        System.out.println(name + " : " + password);

        // Fetch user from the database
        Optional<Account> userOptional = accountService.findByName(name); // Implement this method in AccountService
        if (!userOptional.isPresent()) {
            return ResponseEntity.badRequest().body("{\"status\": \"error\", \"message\": \"Incorrect name.\"}");
        }

        Account user = userOptional.get();
        try {
            if (!PasswordUtil.verifyPassword(password, user.getPassword())) {
                return ResponseEntity.badRequest().body("{\"status\": \"error\", \"message\": \"Incorrect password.\"}");
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"status\": \"error\", \"message\": \"Error verifying password: " + e.getMessage() + "\"}");
        }

        session.setAttribute("user", user);
        
        return ResponseEntity.ok("{\"status\":\"success\",\"message\":\"Login successful\"}");
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(Model model) {
        model.asMap().remove("user");
        return ResponseEntity.ok("{\"status\":\"success\",\"message\":\"Logout successful\"}");
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest registerRequest) {
        String name = registerRequest.getName();
        String password = registerRequest.getPassword();

        // Check if the username already exists
        Optional<Account> existingUser = accountService.findByName(name);
        if (existingUser.isPresent()) {
            return ResponseEntity.badRequest().body("{\"status\": \"error\", \"message\": \"Username already exists.\"}");
        }

        try {
            // Hash the password
            String hashedPassword = PasswordUtil.hashPassword(password);

            // Create a new Account object
            Account newAccount = new Account();
            newAccount.setName(name);
            newAccount.setPassword(hashedPassword); // Store the hashed password

            // Save the new user to the database
            accountService.save(newAccount);

            return ResponseEntity.ok("{\"status\": \"success\", \"message\": \"Registration successful.\"}");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"status\": \"error\", \"message\": \"Error during registration: " + e.getMessage() + "\"}");
        }
    }
}

// Define LoginRequest and RegisterRequest classes
class LoginRequest {
    private String name;
    private String password;

    // Getter for name
    public String getName() {
        return name;
    }

    // Setter for name
    public void setName(String name) {
        this.name = name;
    }

    // Getter for password
    public String getPassword() {
        return password;
    }

    // Setter for password
    public void setPassword(String password) {
        this.password = password;
    }
}

class RegisterRequest {
    private String name;
    private String password;

    // Getter for name
    public String getName() {
        return name;
    }

    // Setter for name
    public void setName(String name) {
        this.name = name;
    }

    // Getter for password
    public String getPassword() {
        return password;
    }

    // Setter for password
    public void setPassword(String password) {
        this.password = password;
    }
}

class PasswordUtil {
    private static final int ITERATIONS = 11000; // Number of iterations
    private static final int KEY_LENGTH = 256; // Key length in bits

    // Method to hash a password
    public static String hashPassword(String password) throws Exception {
        byte[] salt = generateSalt();
        PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, KEY_LENGTH);
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        byte[] hash = factory.generateSecret(spec).getEncoded();
        return Base64.getEncoder().encodeToString(salt) + ":" + Base64.getEncoder().encodeToString(hash);
    }

    // Method to verify a password against a hash
    public static boolean verifyPassword(String password, String storedHash) throws Exception {
        String[] parts = storedHash.split(":");
        byte[] salt = Base64.getDecoder().decode(parts[0]);
        byte[] hash = Base64.getDecoder().decode(parts[1]);

        PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, ITERATIONS, hash.length * 8);
        SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
        byte[] testHash = factory.generateSecret(spec).getEncoded();

        return java.util.Arrays.equals(hash, testHash);
    }

    // Method to generate a random salt
    private static byte[] generateSalt() {
        SecureRandom random = new SecureRandom();
        byte[] salt = new byte[16]; // 16 bytes for salt
        random.nextBytes(salt);
        return salt;
    }
}