package com.joseluu.hospital.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateHospitalRequestDto {
    @NotBlank(message = "El nombre es obligatorio")
    private String name;
    @NotBlank(message = "La direccion es obligatoria")
    private String address;
    @NotBlank(message = "La ciudad es obligatoria")
    private String city;
    private String province;
    private String taxId;
    @Email(message = "El email del administrador no tiene un formato valido")
    private String adminEmail;
}
