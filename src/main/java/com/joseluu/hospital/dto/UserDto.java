package com.joseluu.hospital.dto;

import com.joseluu.hospital.entity.enums.UserRole;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UserDto {
    private String id;
    private String firstName;
    private String lastName;
    private String imageURL;
    private String nombre;
    private String apellidos;
    private String email;
    private String phone;
    private String dateOfBirth;
    private String dni;
    private UserRole role;
    private boolean enabled;
    private boolean accountNonLocked;
    private String hospitalId;
    private String hospitalName;
    private String department;
    private String jobTitle;
    private String hireDate;
    private Double baseSalary;
    private List<CalendarEventDto> calendarEvents;
    private List<LeaveRequestDto> leaveRequests;
    private String createdAt;
    private String updatedAt;

    /**
     * Mantiene sincronizados los nombres en ingles y en castellano.
     */
    public void syncNames() {
        if (firstName != null) {
            this.nombre = firstName;
        }
        if (lastName != null) {
            this.apellidos = lastName;
        }
    }
}
