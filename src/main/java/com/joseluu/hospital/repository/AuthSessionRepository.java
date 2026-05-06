package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.AuthSessionDocument;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface AuthSessionRepository extends MongoRepository<AuthSessionDocument, String> {
    Optional<AuthSessionDocument> findByAccessTokenHash(String accessTokenHash);
    Optional<AuthSessionDocument> findByRefreshTokenHash(String refreshTokenHash);
    void deleteByAccessTokenHash(String accessTokenHash);
    void deleteByUserId(String userId);
    List<AuthSessionDocument> findByUserId(String userId);
}
