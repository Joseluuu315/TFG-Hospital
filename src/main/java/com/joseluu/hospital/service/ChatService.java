package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.ChatDto;
import com.joseluu.hospital.dto.ChatMessageDto;
import com.joseluu.hospital.entity.ChatDocument;
import com.joseluu.hospital.entity.ChatMessageDocument;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.entity.enums.ChatType;
import com.joseluu.hospital.entity.enums.NotificationType;
import com.joseluu.hospital.exception.BadRequestException;
import com.joseluu.hospital.exception.NotFoundException;
import com.joseluu.hospital.repository.ChatMessageRepository;
import com.joseluu.hospital.repository.ChatRepository;
import com.joseluu.hospital.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Servicio encargado de chats y mensajes persistidos en MongoDB.
 */
@Service
public class ChatService {
    private final ChatRepository chatRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ChatService(ChatRepository chatRepository,
                       ChatMessageRepository chatMessageRepository,
                       UserRepository userRepository,
                       NotificationService notificationService) {
        this.chatRepository = chatRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    /**
     * Devuelve los chats del usuario ordenados por fecha del ultimo mensaje.
     */
    public List<ChatDto> getChatsForUser(String userId) {
        List<ChatDto> chats = new ArrayList<>();
        for (ChatDocument chat : chatRepository.findByParticipantsContaining(userId)) {
            chats.add(toDto(chat, userId));
        }
        chats.sort(Comparator.comparing(ChatDto::getLastMessageTime, Comparator.nullsLast(Comparator.reverseOrder())));
        return chats;
    }

    /**
     * Obtiene los mensajes de un chat en orden cronologico.
     */
    public List<ChatMessageDto> getMessages(String chatId) {
        List<ChatMessageDto> messages = new ArrayList<>();
        for (ChatMessageDocument message : chatMessageRepository.findByChatIdOrderByTimestampAsc(chatId)) {
            messages.add(toMessageDto(message));
        }
        return messages;
    }

    /**
     * Guarda un mensaje, actualiza el chat y recalcula no leidos.
     */
    public ChatMessageDto sendMessage(String chatId, String senderId, String senderName, String content) {
        if (content == null || content.isBlank()) {
            throw new BadRequestException("El contenido del mensaje es obligatorio");
        }

        ChatDocument chat = requireChat(chatId);
        String timestamp = LocalDateTime.now().toString();
        String senderImageURL = findSenderImage(senderId);

        ChatMessageDocument message = ChatMessageDocument.builder()
                .id(UUID.randomUUID().toString())
                .chatId(chatId)
                .senderId(senderId)
                .senderName(senderName)
                .senderImageURL(senderImageURL)
                .content(content)
                .timestamp(timestamp)
                .read(true)
                .build();

        updateChatAfterMessage(chat, senderId, content, timestamp);
        return toMessageDto(chatMessageRepository.save(message));
    }

    /**
     * Crea o reutiliza un chat privado entre dos usuarios.
     */
    public ChatDto createPrivateChat(String currentUserId, String otherUserId) {
        if (otherUserId == null || otherUserId.isBlank()) {
            throw new BadRequestException("El userId es obligatorio");
        }

        List<UserDocument> users = userRepository.findAllById(List.of(currentUserId, otherUserId));
        if (users.size() < 2) {
            throw new NotFoundException("No se encontraron ambos usuarios");
        }

        ChatDocument existing = findPrivateChat(currentUserId, otherUserId);
        if (existing != null) {
            return toDto(existing, currentUserId);
        }

        UserDocument currentUser = findUser(users, currentUserId);
        UserDocument otherUser = findUser(users, otherUserId);

        ChatDocument chat = ChatDocument.builder()
                .id(UUID.randomUUID().toString())
                .type(ChatType.PRIVATE)
                .name(otherUser.getFirstName() + " " + otherUser.getLastName())
                .participants(List.of(currentUserId, otherUserId))
                .participantNames(List.of(fullName(currentUser), fullName(otherUser)))
                .createdBy(currentUserId)
                .hospitalId(currentUser.getHospitalId())
                .unreadCounts(buildUnreadMap(List.of(currentUserId, otherUserId)))
                .createdAt(LocalDateTime.now().toString())
                .updatedAt(LocalDateTime.now().toString())
                .build();

        return toDto(chatRepository.save(chat), currentUserId);
    }

    /**
     * Crea un chat de grupo con los miembros indicados.
     */
    public ChatDto createGroupChat(String currentUserId,
                                   String hospitalId,
                                   String name,
                                   String description,
                                   List<String> memberIds) {
        if (name == null || name.isBlank()) {
            throw new BadRequestException("El nombre del chat es obligatorio");
        }
        if (memberIds == null || memberIds.isEmpty()) {
            throw new BadRequestException("Los participantes son obligatorios");
        }

        List<String> participantIds = normalizeParticipants(currentUserId, memberIds);
        List<UserDocument> users = userRepository.findAllById(participantIds);
        if (users.isEmpty()) {
            throw new NotFoundException("No se encontraron miembros para el grupo");
        }

        ChatDocument chat = ChatDocument.builder()
                .id(UUID.randomUUID().toString())
                .type(ChatType.GROUP)
                .name(name)
                .description(description)
                .participants(participantIds)
                .participantNames(buildParticipantNames(participantIds, users))
                .createdBy(currentUserId)
                .hospitalId(hospitalId)
                .unreadCounts(buildUnreadMap(participantIds))
                .createdAt(LocalDateTime.now().toString())
                .updatedAt(LocalDateTime.now().toString())
                .build();

        return toDto(chatRepository.save(chat), currentUserId);
    }

    /**
     * Actualiza participantes y contadores de lectura en un grupo.
     */
    public void updateGroupParticipants(String chatId, List<String> participantIds) {
        ChatDocument chat = requireChat(chatId);
        List<UserDocument> users = userRepository.findAllById(participantIds);

        chat.setParticipants(participantIds);
        chat.setParticipantNames(buildParticipantNames(participantIds, users));
        chat.setUnreadCounts(buildUnreadMap(participantIds));
        chat.setUpdatedAt(LocalDateTime.now().toString());

        chatRepository.save(chat);
    }

    /**
     * Elimina un chat y todos sus mensajes.
     */
    public void deleteChat(String chatId) {
        chatMessageRepository.deleteByChatId(chatId);
        chatRepository.deleteById(chatId);
    }

    /**
     * Marca como leido el chat para un usuario concreto.
     */
    public void markAsRead(String chatId, String userId) {
        chatRepository.findById(chatId).ifPresent(chat -> {
            Map<String, Integer> counts = chat.getUnreadCounts() == null
                    ? new HashMap<>()
                    : new HashMap<>(chat.getUnreadCounts());
            counts.put(userId, 0);
            chat.setUnreadCounts(counts);
            chatRepository.save(chat);

            for (ChatMessageDocument message : chatMessageRepository.findByChatIdOrderByTimestampAsc(chatId)) {
                if (!message.isRead()) {
                    message.setRead(true);
                    chatMessageRepository.save(message);
                }
            }
        });
    }

    /**
     * Busca la imagen del remitente.
     */
    private String findSenderImage(String senderId) {
        return userRepository.findById(senderId)
                .map(UserDocument::getImageURL)
                .orElse(null);
    }

    /**
     * Aplica los cambios del chat tras enviar un mensaje.
     */
    private void updateChatAfterMessage(ChatDocument chat, String senderId, String content, String timestamp) {
        chat.setLastMessage(content);
        chat.setLastMessageTime(timestamp);
        chat.setUnreadCounts(updateUnreadCounts(chat, senderId));
        chat.setUpdatedAt(timestamp);
        chatRepository.save(chat);
    }

    /**
     * Recalcula los no leidos y lanza notificaciones.
     */
    private Map<String, Integer> updateUnreadCounts(ChatDocument chat, String senderId) {
        Map<String, Integer> counts = chat.getUnreadCounts() == null
                ? new HashMap<>()
                : new HashMap<>(chat.getUnreadCounts());

        for (String participant : chat.getParticipants()) {
            if (participant.equals(senderId)) {
                counts.put(participant, 0);
                continue;
            }

            counts.put(participant, counts.getOrDefault(participant, 0) + 1);
            notificationService.createNotification(
                    participant,
                    NotificationType.NEW_CHAT_MESSAGE,
                    "Nuevo mensaje en " + chat.getName()
            );
        }

        return counts;
    }

    /**
     * Busca un chat privado existente entre dos usuarios.
     */
    private ChatDocument findPrivateChat(String currentUserId, String otherUserId) {
        for (ChatDocument chat : chatRepository.findAll()) {
            boolean isPrivate = chat.getType() == ChatType.PRIVATE;
            boolean hasBothUsers = chat.getParticipants().contains(currentUserId)
                    && chat.getParticipants().contains(otherUserId);
            if (isPrivate && hasBothUsers) {
                return chat;
            }
        }
        return null;
    }

    /**
     * Garantiza una lista de participantes sin duplicados.
     */
    private List<String> normalizeParticipants(String currentUserId, List<String> memberIds) {
        List<String> participantIds = new ArrayList<>(new LinkedHashSet<>(memberIds));
        if (!participantIds.contains(currentUserId)) {
            participantIds.add(0, currentUserId);
        }
        return participantIds;
    }

    /**
     * Construye los nombres visibles de los participantes.
     */
    private List<String> buildParticipantNames(List<String> participantIds, List<UserDocument> users) {
        List<String> names = new ArrayList<>();
        for (String userId : participantIds) {
            UserDocument user = findOptionalUser(users, userId);
            names.add(user != null ? fullName(user) : "Usuario");
        }
        return names;
    }

    /**
     * Crea el mapa de no leidos inicial.
     */
    private Map<String, Integer> buildUnreadMap(List<String> participantIds) {
        Map<String, Integer> unread = new HashMap<>();
        for (String participantId : participantIds) {
            unread.put(participantId, 0);
        }
        return unread;
    }

    /**
     * Obtiene un chat o lanza error.
     */
    private ChatDocument requireChat(String chatId) {
        return chatRepository.findById(chatId)
                .orElseThrow(() -> new NotFoundException("Chat no encontrado"));
    }

    /**
     * Busca un usuario dentro de una lista y obliga a que exista.
     */
    private UserDocument findUser(List<UserDocument> users, String userId) {
        UserDocument user = findOptionalUser(users, userId);
        if (user == null) {
            throw new NotFoundException("Usuario no encontrado");
        }
        return user;
    }

    /**
     * Busca un usuario dentro de una lista sin lanzar error.
     */
    private UserDocument findOptionalUser(List<UserDocument> users, String userId) {
        for (UserDocument user : users) {
            if (user.getId().equals(userId)) {
                return user;
            }
        }
        return null;
    }

    /**
     * Devuelve el nombre completo de un usuario.
     */
    private String fullName(UserDocument user) {
        return user.getFirstName() + " " + user.getLastName();
    }

    /**
     * Convierte el chat a DTO teniendo en cuenta los no leidos del usuario.
     */
    private ChatDto toDto(ChatDocument chat, String userId) {
        int unread = Optional.ofNullable(chat.getUnreadCounts())
                .map(counts -> counts.getOrDefault(userId, 0))
                .orElse(0);

        return ChatDto.builder()
                .id(chat.getId())
                .type(chat.getType())
                .name(chat.getName())
                .description(chat.getDescription())
                .participants(chat.getParticipants())
                .participantNames(chat.getParticipantNames())
                .createdBy(chat.getCreatedBy())
                .hospitalId(chat.getHospitalId())
                .lastMessage(chat.getLastMessage())
                .lastMessageTime(chat.getLastMessageTime())
                .unreadCount(unread)
                .build();
    }

    /**
     * Convierte un mensaje a DTO.
     */
    private ChatMessageDto toMessageDto(ChatMessageDocument document) {
        return ChatMessageDto.builder()
                .id(document.getId())
                .chatId(document.getChatId())
                .senderId(document.getSenderId())
                .senderName(document.getSenderName())
                .senderImageURL(document.getSenderImageURL())
                .content(document.getContent())
                .timestamp(document.getTimestamp())
                .read(document.isRead())
                .build();
    }
}
