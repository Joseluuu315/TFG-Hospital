package com.joseluu.hospital.dto;

import com.joseluu.hospital.entity.enums.AnnouncementPriority;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementDto {

    private String id;
    private String title;
    private String content;
    private AnnouncementPriority priority;
    private String authorId;
    private String publishedAt;
    private String expiresAt;
    private boolean active;
}