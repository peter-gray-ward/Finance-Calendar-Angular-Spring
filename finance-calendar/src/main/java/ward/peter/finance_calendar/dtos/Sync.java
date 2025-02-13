package ward.peter.finance_calendar.dtos;

import lombok.*;

final class Page {
    public int CALENDAR = 1;
    public int DAY = 2;
    public int PREVIOUSMONTH = 3;
    public int NEXTMONTH = 4;
    public int EVENT = 5;
    public int PRESENTS = 6;
    public int IMAGINE = 7;
    public int LEFTPANEL = 8;
    public int RIGHTPANEL = 9;
    public int DAILYNEWS = 10;

}

final class Api {
    public String ADD_EXPENSE = "add-expense";
    public String DELETE_EXPENSE = "delete-expense";
    public String UPDATE_EXPENSE = "update-expense";
    public String REFRESH_CALENDAR = "refresh-calendar";
    public String CHANGE_MONTH = "change-month";
    public String GET_EVENT = "get-event";
    public String SAVE_THIS_EVENT = "save-this-event";
    public String SAVE_THIS_AND_FUTURE_EVENTS = "save-all-these-events";
    public String SAVE_CHECKING_BALANCE = "save-checking-balance";
    public String ADD_DEBT = "add-debt";
    public String UPDATE_DEBT = "update-debt";
    public String DELETE_DEBT = "delete-debt";
    public String CREATE_PAYMENT_PLAN = "create-payment-plan";
    public String CLUDE_THIS_EVENT = "clude-this-event";
    public String CLUDE_ALL_THESE_EVENTS = "clude-all-these-events";
    public String DELETE_THIS_EVENT = "delete-this-event";
    public String DELETE_ALL_THESE_EVENTS = "delete-all-these-events";
    public String ADD_EVENT = "add-event";
    public String LOGOUT = "logout";

}

final class Frequency {
    public String DAILY = "daily";
    public String WEEKLY = "weekly";
    public String BIWEEKLY = "biweekly";
    public String MONTHLY = "monthly";
    public String YEARLY = "yearly";
}

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sync {
    private Page page = new Page();
    private Api api = new Api();
    private Frequency frequency = new Frequency();
    private final String[] dow = new String[]{
        "Monday","Tuesday",
        "Wednesday","Thursday","Friday",
        "Saturday", "Sunday"
    };
    private final String[] months = new String[]{
        "January","February","March","April",
        "May","June","July","August",
        "September","October","November","December"
    };
    private Account account;
}
