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
    public ResponseEntity<Submission> submitCode(@RequestBody SubmissionDto submissionDto, Authentication authentication) {
        String email = authentication.getName();
        Submission saved = submissionService.submitCode(submissionDto, email);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @GetMapping("/submissions/my")
    public ResponseEntity<List<Submission>> getMySubmissions(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(submissionService.getMySubmissions(email));
    }

    @GetMapping("/submissions/{id}")
    public ResponseEntity<Submission> getSubmissionById(@PathVariable Long id) {
        return ResponseEntity.ok(submissionService.getSubmissionById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/submissions")
    public ResponseEntity<List<Submission>> getAllSubmissionsAdmin() {
        return ResponseEntity.ok(submissionService.getAllSubmissions());
    }
}
