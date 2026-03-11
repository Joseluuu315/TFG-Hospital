package com.joseluu.hospital.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chat_messages")
public class ChatMessageDocument {
    @Id
    private String id;
    private String chatId;
    private String senderId;
    private String senderImageURL;
    private String senderName;
    private String content;
    private String timestamp;
    private boolean read;
}
