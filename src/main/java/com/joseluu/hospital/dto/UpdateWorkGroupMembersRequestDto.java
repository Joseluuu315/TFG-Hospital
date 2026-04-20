package com.joseluu.hospital.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateWorkGroupMembersRequestDto {
    @NotBlank(message = "El userId es obligatorio")
    private String userId;
}
