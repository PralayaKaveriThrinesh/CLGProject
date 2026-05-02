package com.codeguardian.controller;

import com.codeguardian.service.AIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/chatbot")
public class ChatBotController {

    private final AIService aiService;

    public ChatBotController(AIService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> request) {
        String message = request.get("message");
        String responseMessage = aiService.chat(message);
        Map<String, String> response = new HashMap<>();
        response.put("response", responseMessage);
        return ResponseEntity.ok(response);
    }
}
