package com.codeguardian.service;

public interface AIService {
    String getSuggestions(Long submissionId);
    String beautifyCode(String code, String language);
    String chat(String message);
}
