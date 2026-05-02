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
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(120000); // 120 seconds for local LLM
        this.restTemplate = new org.springframework.web.client.RestTemplate(factory);
    }

    @Override
    public String getSuggestions(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        String apiUrl = "http://localhost:11434/api/generate";

        String prompt = "Analyze this code submission for a student coding platform called CodeGuardian.\n" +
                "Language: " + submission.getLanguage() + "\n" +
                "Code:\n" + submission.getCode() + "\n\n" +
                "Provide a detailed report with exactly three sections:\n" +
                "1. ANALYSIS: A deep dive into the code's logic, structure, and performance.\n" +
                "2. PLAGIARISM: A professional assessment of potential code similarity or suspicious patterns.\n" +
                "3. SUGGESTIONS: Clear, actionable tips to improve the code.\n\n" +
                "Use a professional and constructive tone.";

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "llama3");
        requestBody.put("prompt", prompt);
        requestBody.put("stream", false);

        try {
            Map<String, Object> response = restTemplate.postForObject(apiUrl, requestBody, Map.class);
            if (response != null && response.containsKey("response")) {
                return (String) response.get("response");
            }
            return "Unable to generate analysis using local Ollama. Ensure Ollama is running with llama3.";
        } catch (Exception e) {
            System.err.println("Ollama Analysis Error for sub #" + submissionId + ": " + e.getMessage());
            return "Local AI Error: " + e.getMessage();
        }
    }

    @Override
    public String beautifyCode(String code, String language) {
        String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

        String prompt = "Rewrite the given code into a clean, professional, and production-quality version.\n\n" +
                "Requirements:\n" +
                "1. Fix all syntax errors and inconsistencies.\n" +
                "2. Follow best practices and standard conventions for the " + language + " language.\n" +
                "3. Improve code structure (use functions, classes, or modules where appropriate).\n" +
                "4. Use clear, meaningful, and consistent naming for variables and functions.\n" +
                "5. Add proper entry point or main function if applicable.\n" +
                "6. Add detailed yet concise comments explaining logic and important steps.\n" +
                "7. Improve readability with proper formatting and indentation.\n" +
                "8. Optimize code where possible without changing the core logic.\n" +
                "9. Ensure the code is maintainable and scalable.\n" +
                "10. Remove unnecessary or redundant code.\n\n" +
                "Output:\n" +
                "Return only the improved code with comments. Do not include explanations outside the code.\n\n" +
                "CODE TO BEAUTIFY:\n" + code;

        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> content = new HashMap<>();
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);
        content.put("parts", List.of(part));
        requestBody.put("contents", List.of(content));

        for (int retry = 0; retry < 2; retry++) {
            try {
                Map<String, Object> response = restTemplate.postForObject(apiUrl, requestBody, Map.class);
                if (response != null && response.containsKey("candidates")) {
                    List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                    if (!candidates.isEmpty()) {
                        Map<String, Object> candidate = candidates.get(0);
                        Map<String, Object> resContent = (Map<String, Object>) candidate.get("content");
                        List<Map<String, Object>> parts = (List<Map<String, Object>>) resContent.get("parts");
                        if (!parts.isEmpty()) {
                            String result = (String) parts.get(0).get("text");
                            return result.replaceAll("```[a-z]*\\n?|```", "").trim();
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("AI Beautify Error (Retry " + retry + "): " + e.getMessage());
                if (e.getMessage().contains("429") || e.getMessage().contains("503")) {
                    if (retry == 1) break; // Go to local fallback
                    try { Thread.sleep(1000); } catch (InterruptedException ignored) {}
                    continue; 
                }
                break;
            }
        }

        // UNLIMITED FALLBACK: Local Rule-Based Beautifier (Standardized Format)
        return localBeautify(code, language);
    }

    private String localBeautify(String code, String language) {
        StringBuilder sb = new StringBuilder();
        String sep = language.equals("python") || language.equals("ruby") ? "#" : "//";
        String lineSep = sep + " ---------------------------------------------\n";
        
        sb.append(lineSep).append(sep).append(" Optimized by CodeGuardian (Local Mode)\n").append(lineSep).append("\n");
        
        String[] lines = code.split("\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) {
                sb.append("\n");
                continue;
            }
            
            String comment = "";
            if (trimmed.contains("def ") || trimmed.contains("function ") || (trimmed.contains("public") && trimmed.contains("("))) {
                comment = "  " + sep + " Define logic and functions";
            } else if (trimmed.contains("if ") || trimmed.contains("else")) {
                comment = "  " + sep + " Conditional check";
            } else if (trimmed.contains("for ") || trimmed.contains("while")) {
                comment = "  " + sep + " Iterate through sequence";
            } else if (trimmed.contains("print") || trimmed.contains("System.out") || trimmed.contains("console.log")) {
                comment = "  " + sep + " Output the result";
            } else if (trimmed.contains(" = ")) {
                comment = "  " + sep + " Initialize/assign value";
            }
            
            sb.append(line).append(comment).append("\n");
        }
        
        if (language.equals("python")) {
            sb.append("\n").append(lineSep).append(sep).append(" Program execution starts here\n").append(lineSep);
            sb.append("if __name__ == \"__main__\":\n    # Run the main process\n    pass");
        }
        
        return sb.toString().trim();
    }

    @Override
    public String chat(String message) {
        String apiUrl = "http://localhost:11434/api/generate";

        String systemPrompt = "You are the CodeGuardian Assistant, a helpful and friendly AI guide for the CodeGuardian student coding platform. " +
                "Your purpose is to provide information about the app's features (Code Analysis, Code Beautification, Submissions, Leaderboard, and Announcements) and help with coding concepts. " +
                "STRICT RULES:\n" +
                "1. NEVER reveal personal information, scores, or code of other students.\n" +
                "2. If asked about another user, politely decline and offer to help with the app or the user's own code.\n" +
                "3. Keep responses helpful, encouraging, and professional.\n\n" +
                "User: " + message;

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "llama3");
        requestBody.put("prompt", systemPrompt);
        requestBody.put("stream", false);

        try {
            Map<String, Object> response = restTemplate.postForObject(apiUrl, requestBody, Map.class);
            if (response != null && response.containsKey("response")) {
                return (String) response.get("response");
            }
            return "I'm having trouble connecting to my brain right now. Please try again later!";
        } catch (Exception e) {
            System.err.println("ChatBot Error: " + e.getMessage());
            return "I'm offline at the moment. (Error: " + e.getMessage() + ")";
        }
    }
}
