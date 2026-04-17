package com.joseluu.hospital.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateHospitalRequestDto {
    @NotBlank(message = "El nombre del hospital es obligatorio")
    @Size(max = 200, message = "El nombre no puede superar los 200 caracteres")
    private String name;

    @NotBlank(message = "La direccion es obligatoria")
    private String address;

    @NotBlank(message = "La ciudad es obligatoria")
    private String city;

    @NotBlank(message = "La provincia es obligatoria")
    private String province;

    @NotBlank(message = "El CIF/NIF es obligatorio")
    private String taxId;

    @Email(message = "El email del administrador no tiene un formato valido")
    private String adminEmail;
}
