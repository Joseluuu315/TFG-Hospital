package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.UpsertWorkerContractRequestDto;
import com.joseluu.hospital.dto.WorkerContractDto;
import com.joseluu.hospital.service.WorkerContractService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoints para consultar y actualizar contratos de trabajadores.
 */
@RestController
public class WorkerContractsController {
    private final WorkerContractService workerContractService;

    public WorkerContractsController(WorkerContractService workerContractService) {
        this.workerContractService = workerContractService;
    }

    /**
     * Devuelve el contrato activo del trabajador.
     */
    @GetMapping("/api/workers/{workerId}/contract")
    public WorkerContractDto getActive(@PathVariable String workerId) {
        return workerContractService.getActiveByWorker(workerId);
    }

    /**
     * Crea o sustituye el contrato activo de un trabajador.
     */
    @PutMapping("/api/hospitals/{hospitalId}/workers/contracts")
    public WorkerContractDto upsert(@PathVariable String hospitalId,
                                    @Valid @RequestBody UpsertWorkerContractRequestDto request) {
        return workerContractService.upsert(hospitalId, request);
    }
}
