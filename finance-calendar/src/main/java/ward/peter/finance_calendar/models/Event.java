package ward.peter.finance_calendar.models;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private UUID recurrenceid;
    private String summary;
    private LocalDate date;
    private LocalDate recurrenceenddate;
    private Double amount;
    private Double total;
    private Double balance;
    private Boolean exclude;
    private String frequency;

    @Column(name = "user_id")
    private UUID userId;
}
