package com.codeguardian.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "similarities")
public class Similarity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submission_a_id", nullable = false)
    private Long submissionA;

    @Column(name = "submission_b_id", nullable = false)
    private Long submissionB;

    @Column(nullable = false)
    private Double score;
}
