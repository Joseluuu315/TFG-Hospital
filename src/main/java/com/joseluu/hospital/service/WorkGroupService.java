package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.CreateWorkGroupRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.dto.WorkGroupDto;
import com.joseluu.hospital.entity.UserDocument;
import com.joseluu.hospital.entity.WorkGroupDocument;
import com.joseluu.hospital.exception.BadRequestException;
import com.joseluu.hospital.exception.ForbiddenException;
import com.joseluu.hospital.exception.NotFoundException;
import com.joseluu.hospital.repository.UserRepository;
import com.joseluu.hospital.repository.WorkGroupRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

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

        List<WorkGroupDto> groups = new ArrayList<>();
        for (WorkGroupDocument group : workGroupRepository.findByHospitalId(user.getHospitalId())) {
            groups.add(toDto(group));
        }
        return groups;
    }

    /**
     * Obtiene un grupo por id validando que pertenece al mismo hospital.
     */
    public WorkGroupDto getById(String id, UserDto user) {
        WorkGroupDocument group = requireGroup(id);
        validateHospitalScope(group, user);
        return toDto(group);
    }

    /**
     * Crea un grupo de trabajo y su chat.
     */
    public WorkGroupDto create(CreateWorkGroupRequestDto request, UserDto user) {
        validateCreateRequest(request, user);

        String hospitalId = user.getHospitalId();
        List<String> members = normalizeMembers(user.getId(), request.getMembers());
        List<UserDocument> users = userRepository.findAllById(members);
        String description = resolveDescription(request.getDescription(), user);
        String name = request.getName().trim();
        String now = LocalDateTime.now().toString();

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
     * Actualiza nombre, descripcion y miembros del grupo.
     */
    public WorkGroupDto update(String id, CreateWorkGroupRequestDto request, UserDto user) {
        WorkGroupDocument group = requireGroup(id);
        validateHospitalScope(group, user);
        validateGroupName(request);

        List<String> members = normalizeMembers(user.getId(), request.getMembers());
        List<UserDocument> users = userRepository.findAllById(members);

        group.setName(request.getName().trim());
        group.setDescription(resolveUpdatedDescription(group.getDescription(), request.getDescription()));
        group.setMembers(members);
        group.setMemberNames(mapNames(members, users));
        group.setUpdatedAt(LocalDateTime.now().toString());

        chatService.updateGroupParticipants(group.getChatId(), members);
        return toDto(workGroupRepository.save(group));
    }

    /**
     * Elimina un grupo y su chat asociado.
     */
    public void delete(String id, UserDto user) {
        WorkGroupDocument group = requireGroup(id);
        validateHospitalScope(group, user);
        chatService.deleteChat(group.getChatId());
        workGroupRepository.deleteById(id);
    }

    /**
     * Agrega un miembro al grupo.
     */
    public WorkGroupDto addMember(String id, String userId, UserDto currentUser) {
        WorkGroupDocument group = requireGroup(id);
        validateHospitalScope(group, currentUser);

        List<String> members = group.getMembers() == null ? new ArrayList<>() : new ArrayList<>(group.getMembers());
        if (!members.contains(userId)) {
            members.add(userId);
        }

        return saveMembers(group, members);
    }

    /**
     * Elimina un miembro del grupo.
     */
    public WorkGroupDto removeMember(String id, String userId, UserDto currentUser) {
        WorkGroupDocument group = requireGroup(id);
        validateHospitalScope(group, currentUser);

        List<String> members = new ArrayList<>();
        if (group.getMembers() != null) {
            for (String memberId : group.getMembers()) {
                if (!memberId.equals(userId)) {
                    members.add(memberId);
                }
            }
        }

        return saveMembers(group, members);
    }

    /**
     * Guarda una nueva lista de miembros y sincroniza el chat.
     */
    private WorkGroupDto saveMembers(WorkGroupDocument group, List<String> members) {
        List<UserDocument> users = userRepository.findAllById(members);
        group.setMembers(members);
        group.setMemberNames(mapNames(members, users));
        group.setUpdatedAt(LocalDateTime.now().toString());

        chatService.updateGroupParticipants(group.getChatId(), members);
        return toDto(workGroupRepository.save(group));
    }

    /**
     * Valida el alcance del hospital.
     */
    private void validateHospitalScope(WorkGroupDocument group, UserDto user) {
        if (user.getHospitalId() == null || !group.getHospitalId().equals(user.getHospitalId())) {
            throw new ForbiddenException("No puedes acceder a este grupo");
        }
    }

    /**
     * Valida la informacion minima para crear un grupo.
     */
    private void validateCreateRequest(CreateWorkGroupRequestDto request, UserDto user) {
        if (user.getHospitalId() == null || user.getHospitalId().isBlank()) {
            throw new BadRequestException("El usuario no tiene hospital asociado");
        }
        validateGroupName(request);
    }

    /**
     * Valida que el grupo tenga nombre.
     */
    private void validateGroupName(CreateWorkGroupRequestDto request) {
        if (request == null || request.getName() == null || request.getName().isBlank()) {
            throw new BadRequestException("El nombre del grupo es obligatorio");
        }
    }

    /**
     * Obtiene el grupo o lanza error.
     */
    private WorkGroupDocument requireGroup(String id) {
        return workGroupRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Grupo no encontrado"));
    }

    /**
     * Quita duplicados y garantiza que el creador este incluido.
     */
    private List<String> normalizeMembers(String currentUserId, List<String> requestedMembers) {
        List<String> members = new ArrayList<>(new LinkedHashSet<>(requestedMembers == null ? List.of() : requestedMembers));
        if (!members.contains(currentUserId)) {
            members.add(0, currentUserId);
        }
        return members;
    }

    /**
     * Resuelve la descripcion inicial del grupo.
     */
    private String resolveDescription(String description, UserDto user) {
        if (description == null || description.isBlank()) {
            return "Grupo de trabajo coordinado por " + user.getNombre();
        }
        return description;
    }

    /**
     * Resuelve la descripcion tras una actualizacion.
     */
    private String resolveUpdatedDescription(String currentDescription, String newDescription) {
        if (newDescription == null || newDescription.isBlank()) {
            return currentDescription;
        }
        return newDescription;
    }

    /**
     * Construye los nombres completos de los miembros.
     */
    private List<String> mapNames(List<String> memberIds, List<UserDocument> users) {
        List<String> names = new ArrayList<>();
        for (String memberId : memberIds) {
            names.add(findUserName(memberId, users));
        }
        return names;
    }

    /**
     * Busca el nombre visible de un usuario.
     */
    private String findUserName(String memberId, List<UserDocument> users) {
        for (UserDocument user : users) {
            if (user.getId().equals(memberId)) {
                return user.getFirstName() + " " + user.getLastName();
            }
        }
        return "Usuario";
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
