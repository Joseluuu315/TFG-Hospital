
package com.joseluu.hospital.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequestDto {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String dni;
    private String imageURL;
    private String department;
    private String jobTitle;
    private Double baseSalary;
    private Boolean enabled;
    private Boolean accountNonLocked;
    private String password;
}
