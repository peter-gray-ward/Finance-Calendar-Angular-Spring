package ward.peter.finance_calendar.models;

import java.time.LocalDate;
import java.util.UUID;
import jakarta.persistence.*;

import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expense {
    @Id
    private UUID id;

    private String name;
    private Double amount;
    private LocalDate startdate;
    private LocalDate recurrenceenddate;

    @Column(name = "user_id")
    private UUID userId;

    private String frequency;
}
