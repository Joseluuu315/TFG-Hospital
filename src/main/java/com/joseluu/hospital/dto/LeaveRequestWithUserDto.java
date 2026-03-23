package com.joseluu.hospital.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LeaveRequestWithUserDto {
    private UserDto user;
    private LeaveRequestDto request;
}
