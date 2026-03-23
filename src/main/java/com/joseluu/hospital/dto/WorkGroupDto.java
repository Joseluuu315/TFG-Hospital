package com.joseluu.hospital.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class WorkGroupDto {
    private String id;
    private String name;
    private String description;
    private String hospitalId;
    private List<String> members;
    private List<String> memberNames;
    private String createdBy;
    private String chatId;
    private String createdAt;
}
