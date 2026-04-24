package com.codeguardian.service.impl;

import com.codeguardian.model.Submission;
import com.codeguardian.repository.SubmissionRepository;
import com.codeguardian.service.AIService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AIServiceImpl implements AIService {

    @Value("${google.gemini.api.key}")
    private String apiKey;

    private final SubmissionRepository submissionRepository;
    private final RestTemplate restTemplate;

    public AIServiceImpl(SubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
        this.restTemplate = new RestTemplate();
    }

    @Override
    public String getSuggestions(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        String apiUrl = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + apiKey;

        String prompt = "Carefully analyze this student's code submission for plagiarism and suggest improvements. " +
                "Language: " + submission.getLanguage() + "\n" +
                "Code:\n" + submission.getCode() + "\n\n" +
                "Provide a JSON response with 'summary' and 'suggestions' (a list of strings).";

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> content = new HashMap<>();
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);
        content.put("parts", List.of(part));
        requestBody.put("contents", List.of(content));

        try {
            Map<String, Object> response = restTemplate.postForObject(apiUrl, requestBody, Map.class);
            // Simplistic extraction logic for the response
            if (response != null && response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> candidate = candidates.get(0);
                    Map<String, Object> resContent = (Map<String, Object>) candidate.get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) resContent.get("parts");
                    if (!parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }
            return "Unable to generate suggestions at this time.";
        } catch (Exception e) {
            return "AI Analysis Error: " + e.getMessage();
        }
    }
}
