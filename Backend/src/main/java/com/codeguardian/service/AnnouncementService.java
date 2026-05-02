package com.codeguardian.service;

import com.codeguardian.model.Announcement;
import com.codeguardian.model.User;
import com.codeguardian.repository.AnnouncementRepository;
import com.codeguardian.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

    public AnnouncementService(AnnouncementRepository announcementRepository, UserRepository userRepository) {
        this.announcementRepository = announcementRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Announcement createAnnouncement(Long userId, String message) {
        // Deactivate all previous announcements
        List<Announcement> activeAnnouncements = announcementRepository.findAll();
        for (Announcement a : activeAnnouncements) {
            a.setActive(false);
        }
        announcementRepository.saveAll(activeAnnouncements);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Announcement announcement = new Announcement();
        announcement.setUser(user);
        announcement.setMessage(message);
        announcement.setActive(true);

        return announcementRepository.save(announcement);
    }

    public Optional<Announcement> getLatestAnnouncement() {
        return announcementRepository.findFirstByActiveTrueOrderByCreatedAtDesc();
    }
}
