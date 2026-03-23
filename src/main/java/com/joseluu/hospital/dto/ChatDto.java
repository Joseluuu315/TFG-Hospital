package com.joseluu.hospital.dto;

import com.joseluu.hospital.entity.enums.ChatType;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ChatDto {
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
    private int unreadCount;
}
