package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.ChatDto;
import com.joseluu.hospital.dto.ChatMessageDto;
import com.joseluu.hospital.dto.CreatePrivateChatRequestDto;
import com.joseluu.hospital.dto.SendMessageRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.ChatService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la mensajería interna.
 */
@RestController
@RequestMapping("/api/chats")
@Validated
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
    @ResponseStatus(HttpStatus.OK)
    public List<ChatDto> getMyChats(@RequestHeader(name = "Authorization", required = false) String authorization) {
        UserDto user = authService.getUserFromBearer(authorization);
        return chatService.getChatsForUser(user.getId());
    }

    /**
     * Devuelve los mensajes del chat solicitado.
     */
    @GetMapping("/{chatId}/messages")
    @ResponseStatus(HttpStatus.OK)
    public List<ChatMessageDto> getMessages(@RequestHeader(name = "Authorization", required = false) String authorization,
                                            @PathVariable @NotBlank(message = "El chatId es obligatorio") String chatId) {
        authService.getUserFromBearer(authorization);
        return chatService.getMessages(chatId);
    }

    /**
     * Envía un mensaje en el chat.
     */
    @PostMapping("/{chatId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageDto sendMessage(@RequestHeader(name = "Authorization", required = false) String authorization,
                                      @PathVariable @NotBlank(message = "El chatId es obligatorio") String chatId,
                                      @Valid @RequestBody SendMessageRequestDto request) {
        UserDto user = authService.getUserFromBearer(authorization);
        return chatService.sendMessage(chatId, user.getId(), user.getNombre() + " " + user.getApellidos(), request.getContent());
    }

    /**
     * Abre un chat privado entre el usuario actual y el indicado.
     */
    @PostMapping("/private")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatDto createPrivateChat(@RequestHeader(name = "Authorization", required = false) String authorization,
                                     @Valid @RequestBody CreatePrivateChatRequestDto request) {
        UserDto user = authService.getUserFromBearer(authorization);
        if (user.getId().equals(request.getUserId())) {
            throw new IllegalArgumentException("No se puede crear un chat privado consigo mismo");
        }
        return chatService.createPrivateChat(user.getId(), request.getUserId());
    }

    /**
     * Marca como leídos los mensajes del chat para el usuario actual.
     */
    @PatchMapping("/{chatId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAsRead(@RequestHeader(name = "Authorization", required = false) String authorization,
                           @PathVariable @NotBlank(message = "El chatId es obligatorio") String chatId) {
        UserDto user = authService.getUserFromBearer(authorization);
        chatService.markAsRead(chatId, user.getId());
    }
}
