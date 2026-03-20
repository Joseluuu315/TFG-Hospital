package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.CreateWorkGroupRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.dto.WorkGroupDto;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.entity.WorkGroupDocument;
import com.joseluu.hospital.repository.UserRepository;
import com.joseluu.hospital.repository.WorkGroupRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Servicio para administrar grupos de trabajo y su chat asociado.
 */
@Service
public class WorkGroupService {
    private final WorkGroupRepository workGroupRepository;
    private final UserRepository userRepository;
    private final ChatService chatService;

    public WorkGroupService(WorkGroupRepository workGroupRepository,
                            UserRepository userRepository,
                            ChatService chatService) {
        this.workGroupRepository = workGroupRepository;
        this.userRepository = userRepository;
        this.chatService = chatService;
    }

    /**
     * Lista los grupos del hospital del usuario.
     */
    public List<WorkGroupDto> getForUser(UserDto user) {
        if (user.getHospitalId() == null) {
            return new ArrayList<>();
        }
        return workGroupRepository.findByHospitalId(String.valueOf(user.getHospitalId())).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene un grupo por id validando el hospital.
     */
    public WorkGroupDto getById(String id, UserDto user) {
        WorkGroupDocument group = workGroupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado"));
        validateHospitalScope(group, user);
        return toDto(group);
    }

    /**
     * Crea un grupo de trabajo y su chat.
     */
    public WorkGroupDto create(CreateWorkGroupRequestDto request, UserDto user) {
        String hospitalId = String.valueOf(user.getHospitalId());

        List<String> members = new ArrayList<>(new LinkedHashSet<>(request.getMembers() == null ? List.of() : request.getMembers()));
        if (!members.contains(user.getId())) {
            members.add(0, user.getId());
        }

        List<UserDocument> users = userRepository.findAllById(members);
        String description = request.getDescription() == null || request.getDescription().isBlank()
                ? "Grupo de trabajo coordinado por " + user.getNombre()
                : request.getDescription();

        String now = LocalDateTime.now().toString();
        String name = request.getName().trim();

        String chatId = chatService.createGroupChat(user.getId(), hospitalId, name, description, members).getId();
        WorkGroupDocument group = WorkGroupDocument.builder()
                .id(UUID.randomUUID().toString())
                .name(name)
                .description(description)
                .hospitalId(hospitalId)
                .members(members)
                .memberNames(mapNames(members, users))
                .createdBy(user.getId())
                .chatId(chatId)
                .createdAt(now)
                .updatedAt(now)
                .build();

        return toDto(workGroupRepository.save(group));
    }

    /**
     * Actualiza el grupo y sincroniza participantes en el chat.
     */
    public WorkGroupDto update(String id, CreateWorkGroupRequestDto request, UserDto user) {
        WorkGroupDocument group = workGroupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado"));
        validateHospitalScope(group, user);

        List<String> members = new ArrayList<>(new LinkedHashSet<>(request.getMembers() == null ? List.of() : request.getMembers()));
        if (!members.contains(user.getId())) {
            members.add(0, user.getId());
        }
        List<UserDocument> users = userRepository.findAllById(members);

        group.setName(request.getName().trim());
        group.setDescription(request.getDescription() == null || request.getDescription().isBlank()
                ? group.getDescription()
                : request.getDescription());
        group.setMembers(members);
        group.setMemberNames(mapNames(members, users));
        group.setUpdatedAt(LocalDateTime.now().toString());

        chatService.updateGroupParticipants(group.getChatId(), group.getMembers());

        return toDto(workGroupRepository.save(group));
    }

    /**
     * Elimina un grupo y su chat.
     */
    public void delete(String id, UserDto user) {
        WorkGroupDocument group = workGroupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado"));
        validateHospitalScope(group, user);
        chatService.deleteChat(group.getChatId());
        workGroupRepository.deleteById(id);
    }

    /**
     * Agrega un miembro al grupo y actualiza el chat.
     */
    public WorkGroupDto addMember(String id, String userId, UserDto currentUser) {
        WorkGroupDocument group = workGroupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado"));
        validateHospitalScope(group, currentUser);

        if (!group.getMembers().contains(userId)) {
            group.getMembers().add(userId);
        }
        List<UserDocument> users = userRepository.findAllById(group.getMembers());
        group.setMemberNames(mapNames(group.getMembers(), users));
        group.setUpdatedAt(LocalDateTime.now().toString());
        chatService.updateGroupParticipants(group.getChatId(), group.getMembers());
        return toDto(workGroupRepository.save(group));
    }

    /**
     * Elimina un miembro del grupo y actualiza el chat.
     */
    public WorkGroupDto removeMember(String id, String userId, UserDto currentUser) {
        WorkGroupDocument group = workGroupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Grupo no encontrado"));
        validateHospitalScope(group, currentUser);

        group.setMembers(group.getMembers().stream()
                .filter(memberId -> !memberId.equals(userId))
                .collect(Collectors.toList()));
        List<UserDocument> users = userRepository.findAllById(group.getMembers());
        group.setMemberNames(mapNames(group.getMembers(), users));
        group.setUpdatedAt(LocalDateTime.now().toString());
        chatService.updateGroupParticipants(group.getChatId(), group.getMembers());
        return toDto(workGroupRepository.save(group));
    }

    /**
     * Valida que el grupo pertenece al mismo hospital que el usuario.
     */
    private void validateHospitalScope(WorkGroupDocument group, UserDto user) {
        if (user.getHospitalId() == null || !group.getHospitalId().equals(String.valueOf(user.getHospitalId()))) {
            throw new IllegalArgumentException("No puedes acceder a este grupo");
        }
    }

    /**
     * Obtiene los nombres completos de los miembros.
     */
    private List<String> mapNames(List<String> memberIds, List<UserDocument> users) {
        return memberIds.stream()
                .map(memberId -> users.stream()
                        .filter(user -> user.getId().equals(memberId))
                        .findFirst()
                        .map(user -> user.getFirstName() + " " + user.getLastName())
                        .orElse("Usuario"))
                .collect(Collectors.toList());
    }

    /**
     * Convierte la entidad a DTO.
     */
    private WorkGroupDto toDto(WorkGroupDocument document) {
        return WorkGroupDto.builder()
                .id(document.getId())
                .name(document.getName())
                .description(document.getDescription())
                .hospitalId(document.getHospitalId())
                .members(document.getMembers())
                .memberNames(document.getMemberNames())
                .createdBy(document.getCreatedBy())
                .chatId(document.getChatId())
                .createdAt(document.getCreatedAt())
                .build();
    }
}
