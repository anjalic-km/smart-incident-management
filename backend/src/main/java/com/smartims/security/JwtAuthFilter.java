package com.smartims.security;

import com.smartims.entity.User;
import com.smartims.enums.Role;
import com.smartims.repository.UserRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();

        if (path.startsWith("/api/auth")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
            response.sendError(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Invalid or expired token"
            );
            return;
        }

        Claims claims = jwtService.extractClaims(token);
        String email = claims.getSubject();
        String role = claims.get("role", String.class);

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null
                || Boolean.TRUE.equals(user.getLocked())
                || Boolean.FALSE.equals(user.getEnabled()))
        {

            response.sendError(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "User account is locked or disabled"
            );
            return;
        }
        if (isCompanyBlockedByAdmin(user)) {
            response.sendError(
                    HttpServletResponse.SC_UNAUTHORIZED,
                    "Company admin is disabled or locked. Access is temporarily blocked."
            );
            return;
        }

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))
                );

        authentication.setDetails(
                new WebAuthenticationDetailsSource().buildDetails(request)
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }

    private boolean isCompanyBlockedByAdmin(User user) {
        if (user == null || user.getRole() == Role.SUPER_ADMIN) {
            return false;
        }
        String company = user.getCompany();
        if (company == null || company.isBlank()) {
            return false;
        }
        var admins = userRepository.findByRoleAndCompany(Role.ADMIN, company);
        if (admins.isEmpty()) {
            return false;
        }
        return admins.stream().allMatch(admin -> !Boolean.TRUE.equals(admin.getEnabled()) || Boolean.TRUE.equals(admin.getLocked()));
    }

}
