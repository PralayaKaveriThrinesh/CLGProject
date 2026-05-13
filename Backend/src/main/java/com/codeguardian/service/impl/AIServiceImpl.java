package com.codeguardian.service.impl;

import com.codeguardian.model.Submission;
import com.codeguardian.repository.SubmissionRepository;
import com.codeguardian.service.AIService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AIServiceImpl implements AIService {

    @Value("${google.gemini.api.key}")
    private String apiKey;

    private final SubmissionRepository submissionRepository;
    private final RestTemplate restTemplate;

    private static final String OLLAMA_URL   = "http://localhost:11434/api/generate";
    private static final String OLLAMA_MODEL = "llama3";
    private static final String GEMINI_URL   =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

    public AIServiceImpl(SubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
        org.springframework.http.client.SimpleClientHttpRequestFactory factory =
            new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(15000); // 15 seconds
        factory.setReadTimeout(180000); // 180 seconds for generation
        this.restTemplate = new RestTemplate(factory);
    }

    private String callAI(String prompt) {
        System.out.println("[CodeGuardian] Consulting Gemini...");
        long startTime = System.currentTimeMillis();
        String result = callGemini(prompt);
        long duration = System.currentTimeMillis() - startTime;

        if (result != null && !result.startsWith("Error") && !result.startsWith("I'm having trouble")) {
            System.out.println("[CodeGuardian] Gemini responded in " + duration + "ms");
            return result;
        }

        System.out.println("[CodeGuardian] Gemini failed/timeout after " + duration + "ms. Falling back to Ollama (llama3)...");
        startTime = System.currentTimeMillis();
        result = callOllama(prompt);
        duration = System.currentTimeMillis() - startTime;
        System.out.println("[CodeGuardian] Ollama responded in " + duration + "ms");
        return result;
    }

    // ── Ollama / llama3 (primary) ─────────────────────────────────────────────
    private String callOllama(String prompt) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("model", OLLAMA_MODEL);
            body.put("prompt", prompt);
            body.put("stream", false);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            Map<String, Object> response = restTemplate.postForObject(OLLAMA_URL, entity, Map.class);

            if (response != null && response.containsKey("response")) {
                return (String) response.get("response");
            }
            return "Error: Empty response from Ollama.";
        } catch (Exception e) {
            System.err.println("[CodeGuardian] Ollama Error: " + e.getMessage());
            return "Error: " + e.getMessage();
        }
    }

    // ── Gemini (fallback) ─────────────────────────────────────────────────────
    private String callGemini(String prompt) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", apiKey);

            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", Collections.singletonList(part));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(content));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            Map<String, Object> response = restTemplate.postForObject(GEMINI_URL, entity, Map.class);
            if (response != null && response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map<String, Object> resContent = (Map<String, Object>) candidates.get(0).get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) resContent.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }
            return "I'm having trouble processing that right now. Please try again later.";
        } catch (Exception e) {
            System.err.println("[CodeGuardian] Gemini API Error: " + e.getMessage());
            return "Error connecting to AI Service: " + e.getLocalizedMessage();
        }
    }

    // ── Service methods ───────────────────────────────────────────────────────
    @Override
    public String getSuggestions(Long submissionId) {
        Submission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        String prompt = "Analyze this code submission for a student coding platform called CodeGuardian.\n" +
                "Language: " + submission.getLanguage() + "\n" +
                "Code:\n" + submission.getCode() + "\n\n" +
                "Provide a detailed report with exactly three sections:\n" +
                "1. ANALYSIS: A deep dive into the code's logic, structure, and performance.\n" +
                "2. PLAGIARISM: A professional assessment of potential code similarity or suspicious patterns.\n" +
                "3. SUGGESTIONS: Clear, actionable tips to improve the code.\n\n" +
                "Use a professional and constructive tone. Format the output with clear headings.";

        return callAI(prompt);
    }

    @Override
    public String beautifyCode(String code, String language) {
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
                "Return the improved code. IMPORTANT: If you include an introductory explanation, theory, or a list of refactoring steps (1-10), you MUST wrap them inside language-appropriate block comments (e.g., /* ... */ for Java/JS/C++, or # for Python) so the entire response is a valid, runnable source file.\n\n" +
                "CODE TO BEAUTIFY:\n" + code;

        String result = callAI(prompt);

        if (result.startsWith("Error") || result.contains("I'm having trouble")) {
            return localBeautify(code, language);
        }

        return result.replaceAll("```[a-z]*\\n?|```", "").trim();
    }

    @Override
    public String chat(String message) {
        String systemPrompt = "You are the CodeGuardian Assistant, a helpful and friendly AI guide for the CodeGuardian student coding platform. " +
                "Your purpose is to provide information about the app's features (Code Analysis, Code Beautification, Submissions, Leaderboard, and Announcements) and help with coding concepts. " +
                "STRICT RULES:\n" +
                "1. NEVER reveal personal information, scores, or code of other students.\n" +
                "2. If asked about another user, politely decline and offer to help with the app or the user's own code.\n" +
                "3. Keep responses helpful, encouraging, and professional.\n\n" +
                "User: " + message;

        return callAI(systemPrompt);
    }

    // ── Local fallback beautifier (no AI required) ────────────────────────────
    private String localBeautify(String code, String language) {
        StringBuilder sb = new StringBuilder();
        String sep = language.equals("python") || language.equals("ruby") ? "#" : "//";
        String lineSep = sep + " ---------------------------------------------\n";

        sb.append(lineSep).append(sep).append(" Optimized by CodeGuardian (Local Mode)\n").append(lineSep).append("\n");

        String[] lines = code.split("\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) { sb.append("\n"); continue; }

            String comment = "";
            if (trimmed.contains("def ") || trimmed.contains("function ") || (trimmed.contains("public") && trimmed.contains("(")))
                comment = "  " + sep + " Define logic and functions";
            else if (trimmed.contains("if ") || trimmed.contains("else"))
                comment = "  " + sep + " Conditional check";
            else if (trimmed.contains("for ") || trimmed.contains("while"))
                comment = "  " + sep + " Iterate through sequence";
            else if (trimmed.contains("print") || trimmed.contains("System.out") || trimmed.contains("console.log"))
                comment = "  " + sep + " Output the result";
            else if (trimmed.contains(" = "))
                comment = "  " + sep + " Initialize/assign value";

            sb.append(line).append(comment).append("\n");
        }

        if (language.equals("python")) {
            sb.append("\n").append(lineSep).append(sep).append(" Program execution starts here\n").append(lineSep);
            sb.append("if __name__ == \"__main__\":\n    # Run the main process\n    pass");
        }

        return sb.toString().trim();
    }
}
