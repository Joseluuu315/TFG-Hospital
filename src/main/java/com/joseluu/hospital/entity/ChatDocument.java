package com.joseluu.hospital.entity;

import com.joseluu.hospital.entity.enums.ChatType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chats")
public class ChatDocument {
    @Id
    private String id;
    private ChatType type;
    private String name;
    private String description;
    private List<String> participants;
    private List<String> participantNames;
    private String createdBy;
    private String hospitalId;
    private String lastMessage;
    private String lastMessageTime;
    private Map<String, Integer> unreadCounts;
    private String createdAt;
    private String updatedAt;
}
