package com.joseluu.hospital.manager;

import com.joseluu.hospital.utils.ConfigUtils;

public class ChatBotManager {

    /*
    Manager para manejar el chat bot, mandaremos un prompt inicial con datos
    sobre la gestion de la empresa para que en las preguntas harcodeadas
    tenga el bot respuestas solidas, sin dar margen de error ninguno ya que sera
    el asistente 24/7 de los usuarios que usen la app
     */


    public void runChatBot(){
        String tokenIA = ConfigUtils.chatTokens;

        System.out.println("Bot 24h iniciado con exito");
    }

    public void stopChatBot() {
        System.out.println("Bot 24h parado con exito");

    }
}
