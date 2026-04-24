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
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Submission submission = new Submission();
        submission.setUser(user);
        submission.setLanguage(submissionDto.getLanguage());
        submission.setCode(submissionDto.getCode());
        submission.setStatus("PENDING");

        Submission savedSubmission = submissionRepository.save(submission);

        // Trigger async Plagiarism & AST Engine Pipeline here
        similarityEngineService.processSubmissionSimilarity(savedSubmission);
        
        return savedSubmission;
    }

    @Override
    public List<Submission> getMySubmissions(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
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
