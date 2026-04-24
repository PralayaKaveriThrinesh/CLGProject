package com.codeguardian.service;

import com.codeguardian.model.Submission;
import com.codeguardian.payload.SubmissionDto;

import java.util.List;

public interface SubmissionService {
    Submission submitCode(SubmissionDto submissionDto, String userEmail);
    List<Submission> getMySubmissions(String userEmail);
    Submission getSubmissionById(Long id);
    List<Submission> getAllSubmissions();
}
