package com.codeguardian.controller;

import com.codeguardian.payload.ExecutionRequestDto;
import com.codeguardian.payload.ExecutionResponseDto;
import com.codeguardian.service.engine.ExecutionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/execute")
public class ExecutionController {

    @Autowired
    private ExecutionService executionService;

    @PostMapping
    public ResponseEntity<ExecutionResponseDto> executeCode(@RequestBody ExecutionRequestDto request) {
        ExecutionResponseDto response = executionService.execute(request);
        if ("ERROR".equals(response.getStatus())) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }
}
