package com.joseluu.hospital.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserPresenceDto {
    private String userId;
    private boolean online;
    private String lastSeenAt;
}
