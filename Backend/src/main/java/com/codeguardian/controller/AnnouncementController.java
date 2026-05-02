package com.codeguardian.controller;

import com.codeguardian.model.Announcement;
import com.codeguardian.service.AnnouncementService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    public AnnouncementController(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    @GetMapping("/latest")
    public ResponseEntity<?> getLatest() {
        return announcementService.getLatestAnnouncement()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Announcement> create(@RequestBody Map<String, Object> payload) {
        Long userId = Long.valueOf(payload.get("userId").toString());
        String message = payload.get("message").toString();
        return ResponseEntity.ok(announcementService.createAnnouncement(userId, message));
    }
}
