package com.codeguardian.repository;

import com.codeguardian.model.Similarity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SimilarityRepository extends JpaRepository<Similarity, Long> {
    List<Similarity> findBySubmissionAOrSubmissionB(Long submissionA, Long submissionB);
}
