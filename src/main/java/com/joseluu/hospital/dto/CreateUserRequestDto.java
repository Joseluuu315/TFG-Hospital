package com.joseluu.hospital.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Data;

@Data
public class CreateUserRequestDto {
    @NotBlank(message = "El nombre es obligatorio")
    private String firstName;
    @NotBlank(message = "Los apellidos son obligatorios")
    private String lastName;
    private String imageURL;
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email no tiene un formato valido")
    private String email;
    private String phone;
    private String dni;
    private String department;
    private String jobTitle;
    @PositiveOrZero(message = "El salario base debe ser mayor o igual a 0")
    private Double baseSalary;
    @NotBlank(message = "La password es obligatoria")
    private String password;
}
