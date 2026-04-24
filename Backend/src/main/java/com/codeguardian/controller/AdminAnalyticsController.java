package com.codeguardian.controller;

import com.codeguardian.model.Similarity;
import com.codeguardian.repository.SimilarityRepository;
import com.codeguardian.repository.SubmissionRepository;
import com.codeguardian.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final SimilarityRepository similarityRepository;

    public AdminAnalyticsController(UserRepository userRepository,
                                    SubmissionRepository submissionRepository,
                                    SimilarityRepository similarityRepository) {
        this.userRepository = userRepository;
        this.submissionRepository = submissionRepository;
        this.similarityRepository = similarityRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new HashMap<>();
        long totalUsers = userRepository.count();
        long totalSubmissions = submissionRepository.count();
        
        stats.put("totalUsers", totalUsers);
        stats.put("totalSubmissions", totalSubmissions);
        // Note: Plagiarism % and active users would be computed via deeper analytics logic
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        return getStats();
    }

    @GetMapping("/similarity-matrix")
    public ResponseEntity<List<Similarity>> getSimilarityMatrix() {
        return ResponseEntity.ok(similarityRepository.findAll());
    }
}
