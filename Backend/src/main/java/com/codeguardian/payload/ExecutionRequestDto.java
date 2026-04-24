package com.codeguardian.payload;

public class ExecutionRequestDto {
    private String language;
    private String code;
    private String input;

    // Getters and Setters
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getInput() { return input; }
    public void setInput(String input) { this.input = input; }
}
