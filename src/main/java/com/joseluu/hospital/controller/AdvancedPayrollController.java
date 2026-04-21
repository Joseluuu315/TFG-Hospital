package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.GeneratePayrollRequestDto;
import com.joseluu.hospital.dto.PayrollAdjustmentDto;
import com.joseluu.hospital.dto.PayrollDto;
import com.joseluu.hospital.dto.PayrollItemDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.service.AdvancedPayrollService;
import com.joseluu.hospital.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints para la generacion avanzada de nominas y sus ajustes.
 */
@RestController
public class AdvancedPayrollController {
    private final AdvancedPayrollService advancedPayrollService;
    private final AuthService authService;

    public AdvancedPayrollController(AdvancedPayrollService advancedPayrollService, AuthService authService) {
        this.advancedPayrollService = advancedPayrollService;
        this.authService = authService;
    }

    /**
     * Genera o recalcula la nomina de un trabajador en un periodo.
     */
    @PostMapping("/api/hospitals/{hospitalId}/payrolls/generate")
    public PayrollDto generate(@RequestHeader(name = "Authorization", required = false) String authorization,
                               @PathVariable String hospitalId,
                               @Valid @RequestBody GeneratePayrollRequestDto request) {
        UserDto actor = authService.getUserFromBearer(authorization);
        return advancedPayrollService.generate(hospitalId, request.getWorkerId(), request.getPeriod(), actor.getId());
    }

    /**
     * Devuelve las lineas detalladas de una nomina.
     */
    @GetMapping("/api/payrolls/{payrollId}/items")
    public List<PayrollItemDto> getItems(@PathVariable String payrollId) {
        return advancedPayrollService.getItems(payrollId);
    }

    /**
     * Crea un ajuste manual de bonificacion o penalizacion.
     */
    @PostMapping("/api/payroll-adjustments")
    public PayrollAdjustmentDto createAdjustment(@RequestBody PayrollAdjustmentDto request) {
        return advancedPayrollService.createAdjustment(request);
    }
}
