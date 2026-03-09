package com.joseluu.hospital.entity;

import com.joseluu.hospital.entity.enums.UserRole;

import java.time.LocalDate;
import java.time.LocalDateTime;


public class UserEntity {
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phoneNumber;
    private LocalDate dateOfBirth;
    private String dni;
    private UserRole userRole;
    private boolean isEnabled;
    //private boolean isAccountNonLocked
    private String hospitalId;
    private String departament;
    private String jobTitle;
    private LocalDate hireDate;
    private double baseSalary;
    //private List<CalendarEvent>
    //leaveRequest
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}