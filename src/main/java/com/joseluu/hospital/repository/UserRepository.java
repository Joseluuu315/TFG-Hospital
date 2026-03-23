package com.joseluu.hospital.repository;

import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.entity.enums.UserRole;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<UserDocument, String> {
    Optional<UserDocument> findByEmailIgnoreCase(String email);
    List<UserDocument> findByRole(UserRole role);
}
