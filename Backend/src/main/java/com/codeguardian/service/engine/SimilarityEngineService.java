package com.codeguardian.service.engine;

import com.codeguardian.model.Similarity;
import com.codeguardian.model.Submission;
import com.codeguardian.repository.SimilarityRepository;
import com.codeguardian.repository.SubmissionRepository;
import com.github.javaparser.ast.CompilationUnit;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class SimilarityEngineService {

    private final PreprocessingService preprocessingService;
    private final SubmissionRepository submissionRepository;
    private final SimilarityRepository similarityRepository;

    public SimilarityEngineService(PreprocessingService preprocessingService,
                                   SubmissionRepository submissionRepository,
                                   SimilarityRepository similarityRepository) {
        this.preprocessingService = preprocessingService;
        this.submissionRepository = submissionRepository;
        this.similarityRepository = similarityRepository;
    }

    @Async
    public void processSubmissionSimilarity(Submission newSubmission) {
        List<Submission> previousSubmissions = submissionRepository.findAll();
        
        List<String> newTokens = preprocessingService.tokenize(newSubmission.getCode());
        CompilationUnit newAST = preprocessingService.generateAST(newSubmission.getCode());

        for (Submission past : previousSubmissions) {
            if (past.getId().equals(newSubmission.getId())) continue;

            List<String> pastTokens = preprocessingService.tokenize(past.getCode());
            CompilationUnit pastAST = preprocessingService.generateAST(past.getCode());

            double tokenScore = calculateTokenSimilarity(newTokens, pastTokens);
            double astScore = calculateASTSimilarity(newAST, pastAST);
            double logicScore = calculateLogicSimilarity(newAST, pastAST);

            // Final Score = (Token * 0.3) + (AST * 0.5) + (Logic * 0.2)
            double finalScore = (tokenScore * 0.3) + (astScore * 0.5) + (logicScore * 0.2);

            Similarity similarity = new Similarity();
            similarity.setSubmissionA(newSubmission.getId());
            similarity.setSubmissionB(past.getId());
            similarity.setScore(finalScore);

            similarityRepository.save(similarity);
        }
        
        newSubmission.setStatus("COMPLETED");
        submissionRepository.save(newSubmission);
    }

    private double calculateTokenSimilarity(List<String> tokens1, List<String> tokens2) {
        Set<String> set1 = new HashSet<>(tokens1);
        Set<String> set2 = new HashSet<>(tokens2);

        Set<String> intersection = new HashSet<>(set1);
        intersection.retainAll(set2);

        Set<String> union = new HashSet<>(set1);
        union.addAll(set2);

        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }

    private double calculateASTSimilarity(CompilationUnit ast1, CompilationUnit ast2) {
        if (ast1 == null || ast2 == null) return 0.0;
        // Simplified AST heuristic: count matching node types
        long count1 = ast1.getChildNodes().size();
        long count2 = ast2.getChildNodes().size();
        
        long diff = Math.abs(count1 - count2);
        long max = Math.max(count1, count2);
        
        return max == 0 ? 0.0 : 1.0 - ((double) diff / max);
    }

    private double calculateLogicSimilarity(CompilationUnit ast1, CompilationUnit ast2) {
        // Simplified Logic heuristic based on structural hints
        return calculateASTSimilarity(ast1, ast2) * 0.8;
    }
}
