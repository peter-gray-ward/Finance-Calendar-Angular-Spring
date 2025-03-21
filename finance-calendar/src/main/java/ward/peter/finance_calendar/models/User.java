package ward.peter.finance_calendar.models;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "\"user\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    private UUID id;

    private String name;
    private String password;

    @Column(name = "checking_balance")
    private Double checkingBalance = 0.0;

    private String role = "USER";

    @Override
    public String toString() {
        return "User(\n" + "\n" + this.id.toString() + "\n\t" + this.name + ":" + this.password + "\n\t" + this.checkingBalance.toString() + "\n\t" + this.role + "\n)";
    }
}
