package com.codeguardian.service.engine;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PreprocessingService {

    public String normalizeCode(String code) {
        // Basic normalization: remove extra whitespace and standardize formatting
        return code.replaceAll("\\s+", " ").trim();
    }

    public List<String> tokenize(String code) {
        // Split by non-word characters for a naive token list
        return Arrays.stream(code.split("\\W+"))
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    public CompilationUnit generateAST(String code) {
        try {
            return StaticJavaParser.parse(code);
        } catch (Exception e) {
            System.err.println("Failed to parse code into AST: " + e.getMessage());
            return null;
        }
    }
}
