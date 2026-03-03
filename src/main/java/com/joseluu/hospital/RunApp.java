package com.joseluu.hospital;

import com.joseluu.hospital.manager.ChatBotManager;
import com.joseluu.hospital.manager.MongoManager;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RunApp {
    @Getter
    @Setter
    public static ChatBotManager chatBotManager = new ChatBotManager();
    public static MongoManager mongoManager = new MongoManager();

    public static void main(String[] args) {
        //Run services
        chatBotManager.runChatBot();
        mongoManager.startDatabase();

        SpringApplication.run(RunApp.class, args);
    }

}
