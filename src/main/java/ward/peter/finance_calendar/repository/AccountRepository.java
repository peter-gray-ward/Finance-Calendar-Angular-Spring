package ward.peter.finance_calendar.repository;

import ward.peter.finance_calendar.model.Account;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

import java.util.UUID;

@Repository
public class AccountRepository {
    private final JdbcTemplate jdbcTemplate;

    public AccountRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void save(Account account) throws IllegalArgumentException {
        // Check if the username already exists
        String checkSql = "SELECT COUNT(*) FROM public.\"user\" WHERE name = ?";
        Integer count = jdbcTemplate.queryForObject(checkSql, new Object[]{account.getName()}, Integer.class);

        if (count != null && count > 0) {
            throw new IllegalArgumentException("Username already exists.");
        }

        // Proceed to save the new account
        String sql = "INSERT INTO public.\"user\" (id, name, password, checking_balance) VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(
            sql,
            UUID.randomUUID(),
            account.getName(),
            account.getPassword(),
            0.0
        );
    }

    // Method to find an account by name
    public Optional<Account> findByName(String name) {
        String sql = "SELECT * FROM public.\"user\" WHERE name = ?";
        try {
            Account account = jdbcTemplate.queryForObject(sql, new Object[]{name}, new AccountRowMapper());
            return Optional.of(account);
        } catch (Exception e) {
            return Optional.empty(); // Return empty if no user found
        }
    }

    // RowMapper to map ResultSet to Account object
    private static class AccountRowMapper implements RowMapper<Account> {
        @Override
        public Account mapRow(ResultSet rs, int rowNum) throws SQLException {
            Account account = new Account();
            account.setId(rs.getString("id"));
            account.setName(rs.getString("name"));
            account.setPassword(rs.getString("password"));
            account.setCheckingBalance(rs.getDouble("checking_balance")); // Adjust based on your table structure
            return account;
        }
    }
}