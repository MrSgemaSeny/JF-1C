import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class CheckDb {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://localhost:5432/zhanfindb";
        try (Connection conn = DriverManager.getConnection(url, "test_user", "pass1");
             Statement stmt = conn.createStatement()) {
            
            System.out.println("--- Flyway History ---");
            ResultSet rs = stmt.executeQuery("SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank");
            while (rs.next()) {
                System.out.println(rs.getString("version") + " | " + rs.getString("description") + " | " + rs.getBoolean("success"));
            }
            
            System.out.println("--- Invoices Columns ---");
            ResultSet rs2 = stmt.executeQuery("SELECT column_name FROM information_schema.columns WHERE table_name = 'invoices'");
            while (rs2.next()) {
                System.out.println(rs2.getString(1));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
