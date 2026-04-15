package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.ChatDto;
import com.joseluu.hospital.dto.ChatMessageDto;
import com.joseluu.hospital.dto.CreatePrivateChatRequestDto;
import com.joseluu.hospital.dto.SendMessageRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la mensajería interna.
 */
@RestController
@RequestMapping("/api/chats")
public class ChatController {
    private final ChatService chatService;
    private final AuthService authService;

    public ChatController(ChatService chatService, AuthService authService) {
        this.chatService = chatService;
        this.authService = authService;
    }

    /**
     * Lista los chats del usuario autenticado.
     */
    @GetMapping
    public List<ChatDto> getMyChats(@RequestHeader(name = "Authorization", required = false) String authorization) {
        UserDto user = authService.getUserFromBearer(authorization);
        return chatService.getChatsForUser(user.getId());
    }

    /**
     * Devuelve los mensajes del chat solicitado.
     */
    @GetMapping("/{chatId}/messages")
    public List<ChatMessageDto> getMessages(@RequestHeader(name = "Authorization", required = false) String authorization,
                                            @PathVariable String chatId) {
        authService.getUserFromBearer(authorization);
        return chatService.getMessages(chatId);
    }

    /**
     * Envía un mensaje en el chat.
     */
    @PostMapping("/{chatId}/messages")
    public ChatMessageDto sendMessage(@RequestHeader(name = "Authorization", required = false) String authorization,
                                      @PathVariable String chatId,
                                      @Valid @RequestBody SendMessageRequestDto request) {
        UserDto user = authService.getUserFromBearer(authorization);
        return chatService.sendMessage(chatId, user.getId(), user.getNombre() + " " + user.getApellidos(), request.getContent());
    }

    /**
     * Abre un chat privado entre el usuario actual y el indicado.
     */
    @PostMapping("/private")
    public ChatDto createPrivateChat(@RequestHeader(name = "Authorization", required = false) String authorization,
                                     @Valid @RequestBody CreatePrivateChatRequestDto request) {
        UserDto user = authService.getUserFromBearer(authorization);
        return chatService.createPrivateChat(user.getId(), request.getUserId());
    }

    /**
     * Marca como leídos los mensajes del chat para el usuario actual.
     */
    @PatchMapping("/{chatId}/read")
    public void markAsRead(@RequestHeader(name = "Authorization", required = false) String authorization,
                           @PathVariable String chatId) {
        UserDto user = authService.getUserFromBearer(authorization);
        chatService.markAsRead(chatId, user.getId());
    }
}
