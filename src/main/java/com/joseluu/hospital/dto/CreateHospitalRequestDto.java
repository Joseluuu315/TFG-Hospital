package com.joseluu.hospital.dto;

import lombok.Data;

@Data
public class CreateHospitalRequestDto {
    private String name;
    private String address;
    private String city;
    private String province;
    private String taxId;
    private String adminEmail;
}
