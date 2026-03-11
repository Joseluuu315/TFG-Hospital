package com.joseluu.hospital.entity;

import com.joseluu.hospital.entity.enums.AnnouncementPriority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementDocument {
    private String id;
    private String title;
    private String content;
    private AnnouncementPriority priority;
    private String authorId;
    private String publishedAt;
    private String expiresAt;
    private boolean active;
}
