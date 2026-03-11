package com.joseluu.hospital.entity;

import com.joseluu.hospital.entity.enums.HospitalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "hospitals")
public class HospitalDocument {
    @Id
    private String id;
    private String name;
    private String address;
    private String city;
    private String province;
    private String taxId;
    private HospitalStatus status;
    private String superAdminId;
    private List<AnnouncementDocument> announcements;
    private String createdAt;
    private String updatedAt;
}
