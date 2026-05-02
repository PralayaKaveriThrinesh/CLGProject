package com.codeguardian.controller;

import com.codeguardian.model.Submission;
import com.codeguardian.payload.SubmissionDto;
import com.codeguardian.service.SubmissionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @PostMapping("/submissions")
    public ResponseEntity<?> submitCode(@RequestBody SubmissionDto submissionDto, Authentication authentication) {
        try {
            String email;
            if (authentication == null) {
                System.out.println("No authentication found, processing as Guest");
                email = "guest@codeguardian.com"; // Fallback for demo/guest mode
            } else {
                email = authentication.getName();
                System.out.println("Processing submission for user: " + email);
            }
            Submission saved = submissionService.submitCode(submissionDto, email);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (Exception e) {
            System.err.println("Submission Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/submissions/my")
    public ResponseEntity<List<Submission>> getMySubmissions(Authentication authentication) {
        String email;
        if (authentication == null) {
            System.out.println("No authentication found for history retrieval, using guest fallback");
            email = "guest@codeguardian.com";
        } else {
            email = authentication.getName();
        }
        return ResponseEntity.ok(submissionService.getMySubmissions(email));
    }

    @GetMapping("/submissions/{id}")
    public ResponseEntity<Submission> getSubmissionById(@PathVariable Long id) {
        Submission submission = submissionService.getSubmissionById(id);
        System.out.println("Fetching submission #" + id + " - Code length: " + (submission.getCode() != null ? submission.getCode().length() : "NULL"));
        return ResponseEntity.ok(submission);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/submissions")
    public ResponseEntity<List<Submission>> getAllSubmissionsAdmin() {
        return ResponseEntity.ok(submissionService.getAllSubmissions());
    }
}
