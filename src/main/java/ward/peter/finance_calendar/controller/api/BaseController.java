package ward.peter.finance_calendar.controller.api;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/")
public class BaseController {

    @PostMapping("/login")
    public String loginRedirect() {
        System.out.println("/login...");
        return "redirect:/api/account/login";
    }
}
