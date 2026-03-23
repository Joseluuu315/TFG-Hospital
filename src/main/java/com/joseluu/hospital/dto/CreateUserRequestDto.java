package com.joseluu.hospital.dto;

import lombok.Data;

@Data
public class CreateUserRequestDto {
    private String firstName;
    private String lastName;
    private String imageURL;
    private String email;
    private String phone;
    private String dni;
    private String department;
    private String jobTitle;
    private Double baseSalary;
    private String password;
}
