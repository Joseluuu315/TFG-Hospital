package com.joseluu.hospital.controller;

import com.joseluu.hospital.dto.GeneratePayrollRequestDto;
import com.joseluu.hospital.dto.PayrollAdjustmentDto;
import com.joseluu.hospital.dto.PayrollDto;
import com.joseluu.hospital.dto.PayrollItemDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.entity.enums.UserRole;
import com.joseluu.hospital.exception.ForbiddenException;
import com.joseluu.hospital.service.AdvancedPayrollService;
import com.joseluu.hospital.service.AuthService;
import com.joseluu.hospital.service.PayrollService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Endpoints para la generacion avanzada de nominas y sus ajustes.
 * Todas las operaciones de escritura requieren rol HOSPITAL_ADMIN o ROOT.
 */
@Tag(name = "Nominas avanzadas", description = "Generacion, lineas de calculo y ajustes manuales de nominas")
@RestController
public class AdvancedPayrollController {
    private final AdvancedPayrollService advancedPayrollService;
    private final AuthService authService;
    private final PayrollService payrollService;

    public AdvancedPayrollController(AdvancedPayrollService advancedPayrollService,
                                     AuthService authService,
                                     PayrollService payrollService) {
        this.advancedPayrollService = advancedPayrollService;
        this.authService = authService;
        this.payrollService = payrollService;
    }

    /**
     * Genera o recalcula la nomina de un trabajador en un periodo.
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Generar nomina", description = "Calcula y persiste la nomina de un trabajador para el periodo indicado.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PostMapping("/api/hospitals/{hospitalId}/payrolls/generate")
    public PayrollDto generate(@RequestHeader(name = "Authorization", required = false) String authorization,
                               @PathVariable String hospitalId,
                               @Valid @RequestBody GeneratePayrollRequestDto request) {
        UserDto actor = authService.getUserFromBearer(authorization);
        assertCanAccessHospital(actor, hospitalId);
        return advancedPayrollService.generate(hospitalId, request.getWorkerId(), request.getPeriod(), actor.getId());
    }

    /**
     * Devuelve las lineas detalladas de una nomina.
     * Accesible por cualquier usuario autenticado (el trabajador puede ver las lineas de su nomina).
     */
    @Operation(summary = "Lineas de una nomina", description = "Devuelve el desglose de conceptos de una nomina.")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/api/payrolls/{payrollId}/items")
    public List<PayrollItemDto> getItems(@RequestHeader(name = "Authorization", required = false) String authorization,
                                         @PathVariable String payrollId) {
        PayrollDto payroll = payrollService.getById(payrollId);
        assertCanAccessPayroll(authService.getUserFromBearer(authorization), payroll);
        return advancedPayrollService.getItems(payrollId);
    }

    /**
     * Crea un ajuste manual de bonificacion o penalizacion.
     * Solo HOSPITAL_ADMIN o ROOT.
     */
    @Operation(summary = "Crear ajuste de nomina", description = "Aplica una bonificacion o deduccion manual a una nomina.")
    @PreAuthorize("hasAnyRole('HOSPITAL_ADMIN','ROOT')")
    @PostMapping("/api/payroll-adjustments")
    public PayrollAdjustmentDto createAdjustment(@RequestHeader(name = "Authorization", required = false) String authorization,
                                                 @RequestBody PayrollAdjustmentDto request) {
        assertCanAccessHospital(authService.getUserFromBearer(authorization), request.getHospitalId());
        return advancedPayrollService.createAdjustment(request);
    }

    private void assertCanAccessPayroll(UserDto actor, PayrollDto payroll) {
        if (actor.getRole() == UserRole.ROOT) {
            return;
        }
        if (actor.getRole() == UserRole.HOSPITAL_ADMIN) {
            assertCanAccessHospital(actor, payroll.getHospitalId());
            return;
        }
        if (actor.getRole() == UserRole.WORKER && actor.getId().equals(payroll.getWorkerId())) {
            return;
        }
        throw new ForbiddenException("No puedes acceder a esta nomina");
    }

    private void assertCanAccessHospital(UserDto actor, String hospitalId) {
        if (actor.getRole() == UserRole.ROOT) {
            return;
        }
        if (actor.getRole() == UserRole.HOSPITAL_ADMIN
                && actor.getHospitalId() != null
                && actor.getHospitalId().equals(hospitalId)) {
            return;
        }
        throw new ForbiddenException("No puedes gestionar nominas de este hospital");
    }
}
