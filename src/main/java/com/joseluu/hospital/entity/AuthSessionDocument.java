package com.joseluu.hospital.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "auth_sessions")
public class AuthSessionDocument {
    @Id
    private String id;

    @Indexed(unique = true)
    private String accessTokenHash;

    @Indexed(unique = true)
    private String refreshTokenHash;

    @Indexed
    private String userId;

    private String accessTokenExpiresAt;
    private String refreshTokenExpiresAt;
    private String createdAt;
    private String updatedAt;
}
