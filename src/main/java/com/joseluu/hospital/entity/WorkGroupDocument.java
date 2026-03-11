package com.joseluu.hospital.entity;

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
@Document(collection = "work_groups")
public class WorkGroupDocument {
    @Id
    private String id;
    private String name;
    private String description;
    private String hospitalId;
    private List<String> members;
    private List<String> memberNames;
    private String createdBy;
    private String chatId;
    private String createdAt;
    private String updatedAt;
}
