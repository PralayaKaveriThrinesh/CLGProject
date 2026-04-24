package com.codeguardian.repository;

import com.codeguardian.model.Submission;
import com.codeguardian.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    List<Submission> findByUser(User user);
    List<Submission> findByUserOrderByCreatedAtDesc(User user);
}
