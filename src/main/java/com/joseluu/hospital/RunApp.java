package com.joseluu.hospital;

import com.joseluu.hospital.chatbot.ChatBotManager;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class RunApp {

    public static ChatBotManager chatBotManager = new ChatBotManager();

    public static void main(String[] args) {
        //Run services
        chatBotManager.runChatBot();

        SpringApplication.run(RunApp.class, args);
    }

}
