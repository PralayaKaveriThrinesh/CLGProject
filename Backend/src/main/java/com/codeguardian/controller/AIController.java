package com.codeguardian.controller;

import com.codeguardian.service.AIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/analysis")
public class AIController {

    private final AIService aiService;

    public AIController(AIService aiService) {
        this.aiService = aiService;
    }

    @GetMapping("/ai-suggestions/{id}")
    public ResponseEntity<Map<String, String>> getAISuggestions(@PathVariable Long id) {
        String suggestions = aiService.getSuggestions(id);
        Map<String, String> response = new HashMap<>();
        response.put("suggestions", suggestions);
        return ResponseEntity.ok(response);
    }
}
