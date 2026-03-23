package com.joseluu.hospital.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ChatMessageDto {
    private String id;
    private String chatId;
    private String senderId;
    private String senderImageURL;
    private String senderName;
    private String content;
    private String timestamp;
    private boolean read;
}
