package com.joseluu.hospital.entity;

import com.joseluu.hospital.entity.enums.HospitalStatus;

import java.time.LocalDateTime;

public class HospitalEntity {
    private String hospitalName;
    private String hospitalAddress;
    private String hospitalCity;
    private String hospitalState;
    private String hospitalTaxId;
    private HospitalStatus hospitalStatus;
    private String adminId;
    //private List<Announcement> listAnnouncement;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
