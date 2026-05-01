package com.russian.learn.controller;

import com.russian.learn.entity.User;
import com.russian.learn.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        User user = userService.getProfile(userId);

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("email", user.getEmail());
        profile.put("nickname", user.getNickname());
        profile.put("dailyGoal", user.getDailyGoal());
        profile.put("theme", user.getTheme());
        profile.put("createdAt", user.getCreatedAt());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/theme")
    public ResponseEntity<Map<String, String>> updateTheme(
            HttpServletRequest request,
            @RequestBody Map<String, String> body) {
        Long userId = (Long) request.getAttribute("userId");
        String theme = body.get("theme");
        if (theme == null || theme.isEmpty()) {
            throw new IllegalArgumentException("Theme is required");
        }
        userService.updateTheme(userId, theme);

        Map<String, String> response = new HashMap<>();
        response.put("theme", theme);
        response.put("message", "Theme updated successfully");
        return ResponseEntity.ok(response);
    }
}
