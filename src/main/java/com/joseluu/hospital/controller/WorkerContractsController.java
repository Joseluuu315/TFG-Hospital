package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.UpsertWorkerContractRequestDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.dto.WorkerContractDto;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.WorkerContractService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoints para consultar y actualizar contratos de trabajadores.
 */
@Tag(name = "Contratos", description = "Gestion de contratos laborales de trabajadores")
@RestController
public class WorkerContractsController {
    private final WorkerContractService workerContractService;
    private final AuthService authService;

    public WorkerContractsController(WorkerContractService workerContractService, AuthService authService) {
        this.workerContractService = workerContractService;
        this.authService = authService;
    }

    /**
     * Devuelve el contrato activo del trabajador.
     * Accesible por HOSPITAL_ADMIN, ROOT (cualquier trabajador)
     * y por el propio trabajador para su propio contrato.
     */
    @Operation(summary = "Obtener contrato activo", description = "Devuelve el contrato vigente del trabajador indicado.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @GetMapping("/api/workers/{workerId}/contract")
    public WorkerContractDto getActive(@RequestHeader(name = "Authorization", required = false) String authorization,
                                       @PathVariable String workerId) {
        UserDto actor = authService.getUserFromBearer(authorization);
        return workerContractService.getActiveByWorker(workerId, actor);
    }

    /**
     * Crea o sustituye el contrato activo de un trabajador.
     * Requiere rol HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Crear o actualizar contrato", description = "Crea o reemplaza el contrato activo del trabajador. Solo HOSPITAL_ADMIN o ROOT.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PutMapping("/api/hospitals/{hospitalId}/workers/contracts")
    public WorkerContractDto upsert(@RequestHeader(name = "Authorization", required = false) String authorization,
                                    @PathVariable String hospitalId,
                                    @Valid @RequestBody UpsertWorkerContractRequestDto request) {
        UserDto actor = authService.getUserFromBearer(authorization);
        return workerContractService.upsert(hospitalId, request, actor);
    }
}
