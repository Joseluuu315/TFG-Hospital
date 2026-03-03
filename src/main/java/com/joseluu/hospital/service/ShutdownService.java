package com.joseluu.hospital.service;

import com.joseluu.hospital.manager.ChatBotManager;
import com.joseluu.hospital.manager.MongoManager;
import com.mongodb.client.MongoClient;
import jakarta.annotation.PreDestroy;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

/*
Anotaciones obtenidas
 */
@Component
public class ShutdownService {
    private MongoManager mongoManager = new MongoManager();
    private ChatBotManager chatBotManager = new ChatBotManager();

    @PreDestroy
    public void onShutDown (){
        //Stop service
        mongoManager.closeDatabase();
        chatBotManager.stopChatBot();
    }
}
