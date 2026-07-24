import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class TestPassword {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = "$2a$10$y1/xsqpoLRTwGMuopoLSROiC4VXrd88lZcvaTD.gz8nFuN7k6kYmy";
        String[] passwordsToTest = {"password", "123456", "12345678", "admin", "user", "zhanfinance"};
        
        for (String p : passwordsToTest) {
            if (encoder.matches(p, hash)) {
                System.out.println("Match found: " + p);
                return;
            }
        }
        System.out.println("No match found in the common passwords.");
    }
}
