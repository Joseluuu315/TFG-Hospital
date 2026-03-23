package com.joseluu.hospital.dto;

import lombok.Data;

import java.util.List;

@Data
public class CreateWorkGroupRequestDto {
    private String name;
    private String description;
    private List<String> members;
}
