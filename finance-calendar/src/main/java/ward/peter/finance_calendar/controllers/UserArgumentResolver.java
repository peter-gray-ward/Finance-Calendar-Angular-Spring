package ward.peter.finance_calendar.controllers;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import ward.peter.finance_calendar.utils.AuthUtil;
import ward.peter.finance_calendar.services.UserService;
import ward.peter.finance_calendar.models.User;

@Component
public class UserArgumentResolver implements HandlerMethodArgumentResolver {

    private final AuthUtil authUtil;
    private final UserService userService;

    public UserArgumentResolver(AuthUtil authUtil, UserService userService) {
        this.authUtil = authUtil;
        this.userService = userService;
    }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.getParameterType().equals(User.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, 
                                  ModelAndViewContainer mavContainer, 
                                  NativeWebRequest webRequest, 
                                  WebDataBinderFactory binderFactory) {
        HttpServletRequest request = (HttpServletRequest) webRequest.getNativeRequest();
        HttpServletResponse response = (HttpServletResponse) webRequest.getNativeResponse();
        HttpSession session = request.getSession();
        User user = authUtil.getRequestUser(request);
        if (user.getId() == null) {
            this.userService.logout(request, response, session);
        }
        return user;
    }
}
