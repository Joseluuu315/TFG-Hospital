package com.joseluu.hospital.entity;

import com.joseluu.hospital.entity.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class UserDocument {
    @Id
    private String id;
    private String firstName;
    private String lastName;
    private String imageURL;
    private String email;
    private String password;
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
    private List<CalendarEventDocument> calendarEvents;
    private List<String> leaveRequestIds;
    private String createdAt;
    private String updatedAt;
}
