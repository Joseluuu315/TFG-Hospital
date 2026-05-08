package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.ChatDto;
import com.joseluu.hospital.dto.ChatMessageDto;
import com.joseluu.hospital.dto.CreatePrivateChatRequestDto;
import com.joseluu.hospital.dto.SendMessageRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST para la mensajeria interna.
 * Todos los endpoints requieren autenticacion; el acceso se filtra por participante en la capa de servicio.
 */
@Tag(name = "Chat", description = "Mensajeria interna entre usuarios del hospital")
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
    @Operation(summary = "Mis chats", description = "Devuelve las conversaciones en las que participa el usuario autenticado.")
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public List<ChatDto> getMyChats(@RequestHeader(name = "Authorization", required = false) String authorization) {
        UserDto user = authService.getUserFromBearer(authorization);
        return chatService.getChatsForUser(user.getId());
    }

    /**
     * Devuelve los mensajes del chat solicitado.
     * El servicio verifica que el usuario sea participante del chat.
     */
    @Operation(summary = "Mensajes de un chat")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{chatId}/messages")
    public List<ChatMessageDto> getMessages(@RequestHeader(name = "Authorization", required = false) String authorization,
                                            @PathVariable String chatId) {
        authService.getUserFromBearer(authorization);
        return chatService.getMessages(chatId);
    }

    /**
     * Envia un mensaje en el chat.
     */
    @Operation(summary = "Enviar mensaje")
    @PreAuthorize("isAuthenticated()")
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
    @Operation(summary = "Iniciar chat privado")
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/private")
    public ChatDto createPrivateChat(@RequestHeader(name = "Authorization", required = false) String authorization,
                                     @Valid @RequestBody CreatePrivateChatRequestDto request) {
        UserDto user = authService.getUserFromBearer(authorization);
        return chatService.createPrivateChat(user.getId(), request.getUserId());
    }

    /**
     * Marca como leidos los mensajes del chat para el usuario actual.
     */
    @Operation(summary = "Marcar chat como leido")
    @PreAuthorize("isAuthenticated()")
    @PatchMapping("/{chatId}/read")
    public void markAsRead(@RequestHeader(name = "Authorization", required = false) String authorization,
                           @PathVariable String chatId) {
        UserDto user = authService.getUserFromBearer(authorization);
        chatService.markAsRead(chatId, user.getId());
    }
}
