package com.joseluu.hospital.dto;

import com.joseluu.hospital.entity.enums.HospitalStatus;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class HospitalDto {
    private String id;
    private String name;
    private String address;
    private String city;
    private String province;
    private String taxId;
    private HospitalStatus status;
    private String superAdminId;
    private List<AnnouncementDto> announcements;
    private String createdAt;
    private String updatedAt;
}
