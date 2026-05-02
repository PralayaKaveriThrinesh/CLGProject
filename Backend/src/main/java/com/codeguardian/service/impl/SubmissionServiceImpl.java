package com.codeguardian.service.impl;

import com.codeguardian.model.Submission;
import com.codeguardian.model.User;
import com.codeguardian.payload.SubmissionDto;
import com.codeguardian.repository.SubmissionRepository;
import com.codeguardian.repository.UserRepository;
import com.codeguardian.service.SubmissionService;
import com.codeguardian.service.engine.SimilarityEngineService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SubmissionServiceImpl implements SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final SimilarityEngineService similarityEngineService;

    public SubmissionServiceImpl(SubmissionRepository submissionRepository, 
                                 UserRepository userRepository,
                                 SimilarityEngineService similarityEngineService) {
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
        this.similarityEngineService = similarityEngineService;
    }

    @Override
    public Submission submitCode(SubmissionDto submissionDto, String userEmail) {
        System.out.println("Finding user with email: " + userEmail);
        User user = userRepository.findByEmail(userEmail)
                .orElseGet(() -> {
                    System.err.println("CRITICAL: User [" + userEmail + "] not found in DB! Checking all users...");
                    List<User> allUsers = userRepository.findAll();
                    if (allUsers.isEmpty()) throw new RuntimeException("No users found in database!");
                    User fallback = allUsers.get(0);
                    System.err.println("FALLBACK: Assigning submission to first user: " + fallback.getEmail() + " (ID: " + fallback.getId() + ")");
                    return fallback;
                });

        System.out.println("Creating submission for user ID: " + user.getId() + " (" + user.getEmail() + ")");
        Submission submission = new Submission();
        submission.setUser(user);
        submission.setLanguage(submissionDto.getLanguage());
        submission.setCode(submissionDto.getCode());
        submission.setStatus("PENDING");

        System.out.println("Saving submission to repository...");
        Submission savedSubmission = submissionRepository.save(submission);

        System.out.println("Triggering similarity engine for ID: " + savedSubmission.getId());
        // Trigger async Plagiarism & AST Engine Pipeline here
        similarityEngineService.processSubmissionSimilarity(savedSubmission);
        
        return savedSubmission;
    }

    @Override
    public List<Submission> getMySubmissions(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseGet(() -> {
                    System.err.println("History retrieval: User [" + userEmail + "] not found in DB! Falling back to first user.");
                    return userRepository.findAll().stream().findFirst()
                        .orElseThrow(() -> new RuntimeException("User not found"));
                });
        System.out.println("Fetching history for user ID: " + user.getId() + " (" + user.getEmail() + ")");
        return submissionRepository.findByUserOrderByCreatedAtDesc(user);
    }

    @Override
    public Submission getSubmissionById(Long id) {
        return submissionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Submission not found"));
    }

    @Override
    public List<Submission> getAllSubmissions() {
        return submissionRepository.findAll();
    }
}
