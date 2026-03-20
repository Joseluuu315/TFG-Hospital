package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.ChatDto;
import com.joseluu.hospital.dto.ChatMessageDto;
import com.joseluu.hospital.entity.ChatDocument;
import com.joseluu.hospital.entity.ChatMessageDocument;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.entity.enums.ChatType;
import com.joseluu.hospital.entity.enums.NotificationType;
import com.joseluu.hospital.repository.ChatMessageRepository;
import com.joseluu.hospital.repository.ChatRepository;
import com.joseluu.hospital.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Orquesta la lógica de negocio para chats y mensajes persistidos en MongoDB.
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
     * Devuelve los chats del usuario ordenados por el último mensaje.
     */
    public List<ChatDto> getChatsForUser(String userId) {
        return chatRepository.findByParticipantsContaining(userId).stream()
                .map(chat -> toDto(chat, userId))
                .sorted(Comparator.comparing(ChatDto::getLastMessageTime, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    /**
     * Obtiene los mensajes de un chat en orden cronológico.
     */
    public List<ChatMessageDto> getMessages(String chatId) {
        return chatMessageRepository.findByChatIdOrderByTimestampAsc(chatId).stream()
                .map(this::toMessageDto)
                .collect(Collectors.toList());
    }

    /**
     * Persiste un nuevo mensaje, actualiza el último mensaje y recalcula los contadores de lectura.
     */
    public ChatMessageDto sendMessage(String chatId, String senderId, String senderName, String content) {
        ChatDocument chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new IllegalArgumentException("Chat no encontrado"));

        // Obtener la imagen del remitente
        String senderImageURL = userRepository.findById(senderId)
                .map(UserDocument::getImageURL)
                .orElse(null);

        String timestamp = LocalDateTime.now().toString();
        ChatMessageDocument message = ChatMessageDocument.builder()
                .id(UUID.randomUUID().toString())
                .chatId(chatId)
                .senderId(senderId)
                .senderName(senderName)
                .senderImageURL(senderImageURL)   // ← añadido
                .content(content)
                .timestamp(timestamp)
                .read(true)
                .build();

        chat.setLastMessage(content);
        chat.setLastMessageTime(timestamp);
        Map<String, Integer> counts = Optional.ofNullable(chat.getUnreadCounts()).orElse(new HashMap<>());
        chat.getParticipants().stream()
                .filter(participant -> !participant.equals(senderId))
                .forEach(participant -> {
                    counts.put(participant, counts.getOrDefault(participant, 0) + 1);
                    notificationService.createNotification(participant, NotificationType.NEW_CHAT_MESSAGE, "Nuevo mensaje en " + chat.getName());
                });
        counts.put(senderId, 0);
        chat.setUnreadCounts(counts);
        chat.setUpdatedAt(timestamp);
        chatRepository.save(chat);

        return toMessageDto(chatMessageRepository.save(message));
    }

    /**
     * Crea (o reutiliza) un chat privado entre dos usuarios.
     */
    public ChatDto createPrivateChat(String currentUserId, String otherUserId) {
        List<UserDocument> users = userRepository.findAllById(List.of(currentUserId, otherUserId));
        if (users.size() < 2) {
            throw new IllegalArgumentException("No se encontraron ambos usuarios");
        }

        Optional<ChatDocument> existing = chatRepository.findAll().stream()
                .filter(chat -> chat.getType() == ChatType.PRIVATE)
                .filter(chat -> chat.getParticipants().contains(currentUserId) && chat.getParticipants().contains(otherUserId))
                .findFirst();

        if (existing.isPresent()) {
            return toDto(existing.get(), currentUserId);
        }

        UserDocument currentUser = users.stream().filter(u -> u.getId().equals(currentUserId)).findFirst().orElseThrow();
        UserDocument otherUser = users.stream().filter(u -> u.getId().equals(otherUserId)).findFirst().orElseThrow();

        ChatDocument chat = ChatDocument.builder()
                .id(UUID.randomUUID().toString())
                .type(ChatType.PRIVATE)
                .name(otherUser.getFirstName() + " " + otherUser.getLastName())
                .participants(List.of(currentUserId, otherUserId))
                .participantNames(List.of(currentUser.getFirstName(), otherUser.getLastName()))
                .createdBy(currentUserId)
                .hospitalId(currentUser.getHospitalId())
                .unreadCounts(new HashMap<>())
                .createdAt(LocalDateTime.now().toString())
                .updatedAt(LocalDateTime.now().toString())
                .build();

        chatRepository.save(chat);
        return toDto(chat, currentUserId);
    }

    /**
     * Crea un chat de grupo con los miembros indicados.
     */
    public ChatDto createGroupChat(String currentUserId,
                                   String hospitalId,
                                   String name,
                                   String description,
                                   List<String> memberIds) {
        List<String> participantIds = new java.util.ArrayList<>(new LinkedHashSet<>(memberIds));
        if (!participantIds.contains(currentUserId)) {
            participantIds.add(0, currentUserId);
        }

        List<UserDocument> users = userRepository.findAllById(participantIds);
        if (users.isEmpty()) {
            throw new IllegalArgumentException("No se encontraron miembros para el grupo");
        }

        List<String> participantNames = participantIds.stream()
                .map(userId -> users.stream()
                        .filter(user -> user.getId().equals(userId))
                        .findFirst()
                        .map(user -> user.getFirstName() + " " + user.getLastName())
                        .orElse("Usuario"))
                .collect(Collectors.toList());

        ChatDocument chat = ChatDocument.builder()
                .id(UUID.randomUUID().toString())
                .type(ChatType.GROUP)
                .name(name)
                .description(description)
                .participants(participantIds)
                .participantNames(participantNames)
                .createdBy(currentUserId)
                .hospitalId(hospitalId)
                .unreadCounts(buildUnreadMap(participantIds))
                .createdAt(LocalDateTime.now().toString())
                .updatedAt(LocalDateTime.now().toString())
                .build();

        return toDto(chatRepository.save(chat), currentUserId);
    }

    /**
     * Actualiza la lista de participantes y los contadores de lectura de un chat de grupo.
     */
    public void updateGroupParticipants(String chatId, List<String> participantIds) {
        ChatDocument chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new IllegalArgumentException("Chat no encontrado"));

        List<UserDocument> users = userRepository.findAllById(participantIds);
        chat.setParticipants(participantIds);
        chat.setParticipantNames(participantIds.stream()
                .map(userId -> users.stream()
                        .filter(user -> user.getId().equals(userId))
                        .findFirst()
                        .map(user -> user.getFirstName() + " " + user.getLastName())
                        .orElse("Usuario"))
                .collect(Collectors.toList()));
        chat.setUnreadCounts(buildUnreadMap(participantIds));
        chat.setUpdatedAt(LocalDateTime.now().toString());
        chatRepository.save(chat);
    }

    /**
     * Elimina un chat y sus mensajes asociados.
     */
    public void deleteChat(String chatId) {
        chatMessageRepository.deleteByChatId(chatId);
        chatRepository.deleteById(chatId);
    }

    /**
     * Marca todos los mensajes como leídos para un usuario concreto.
     */
    public void markAsRead(String chatId, String userId) {
        chatRepository.findById(chatId).ifPresent(chat -> {
            Map<String, Integer> counts = Optional.ofNullable(chat.getUnreadCounts()).orElse(new HashMap<>());
            counts.put(userId, 0);
            chat.setUnreadCounts(counts);
            chatRepository.save(chat);

            chatMessageRepository.findByChatIdOrderByTimestampAsc(chatId).forEach(message -> {
                if (!message.isRead()) {
                    message.setRead(true);
                    chatMessageRepository.save(message);
                }
            });
        });
    }

    /**
     * Inicializa el mapa de contadores de mensajes no leídos para un chat nuevo.
     */
    private Map<String, Integer> buildUnreadMap(List<String> participantIds) {
        Map<String, Integer> unread = new HashMap<>();
        participantIds.forEach(id -> unread.put(id, 0));
        return unread;
    }

    /**
     * Convierte la entidad persistida a un DTO enriquecido con el contador de no leídos.
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
     * Convierte un documento de mensaje en DTO.
     */
    private ChatMessageDto toMessageDto(ChatMessageDocument document) {
        return ChatMessageDto.builder()
                .id(document.getId())
                .chatId(document.getChatId())
                .senderId(document.getSenderId())
                .senderName(document.getSenderName())
                .senderImageURL(document.getSenderImageURL())  // ← añadido
                .content(document.getContent())
                .timestamp(document.getTimestamp())
                .read(document.isRead())
                .build();
    }
}
