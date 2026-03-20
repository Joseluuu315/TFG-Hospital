package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.GlobalStatsDto;
import com.joseluu.hospital.dto.PayrollDto;
import com.joseluu.hospital.dto.PayrollSummaryDto;
import com.joseluu.hospital.entity.enums.HospitalStatus;
import com.joseluu.hospital.entity.enums.UserRole;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Servicio de calculo de estadisticas globales.
 */
@Service
public class GlobalStatsService {
    private final UserService userService;
    private final HospitalService hospitalService;
    private final PayrollService payrollService;

    public GlobalStatsService(UserService userService,
                              HospitalService hospitalService,
                              PayrollService payrollService) {
        this.userService = userService;
        this.hospitalService = hospitalService;
        this.payrollService = payrollService;
    }

    /**
     * Compone el resumen global de actividad.
     */
    public GlobalStatsDto getGlobalStats() {
        List<UserRole> roles = List.of(UserRole.ROOT, UserRole.HOSPITAL_ADMIN, UserRole.WORKER);
        Map<UserRole, Integer> counts = new LinkedHashMap<>();
        for (UserRole role : roles) {
            counts.put(role, (int) userService.getAll().stream().filter(u -> u.getRole() == role).count());
        }

        int activeHospitals = (int) hospitalService.getAll().stream()
                .filter(h -> h.getStatus() == HospitalStatus.ACTIVE)
                .count();
        int totalHospitals = hospitalService.getAll().size();

        return GlobalStatsDto.builder()
                .totalHospitals(totalHospitals)
                .activeHospitals(activeHospitals)
                .suspendedHospitals(totalHospitals - activeHospitals)
                .totalUsers(userService.getAll().size())
                .usersByRole(counts)
                .payrollsByMonth(buildPayrollHistory())
                .build();
    }

    /**
     * Agrupa nominas por mes y calcula totales.
     */
    private List<PayrollSummaryDto> buildPayrollHistory() {
        Map<String, List<PayrollDto>> grouped = new TreeMap<>();
        for (PayrollDto payroll : payrollService.getAll()) {
            grouped.computeIfAbsent(payroll.getPeriod(), key -> new ArrayList<>()).add(payroll);
        }
        List<PayrollSummaryDto> summaries = new ArrayList<>();
        grouped.forEach((period, list) -> {
            double total = list.stream()
                    .mapToDouble(p -> p.getGrossSalary() + p.getOvertimeAmount() + p.getBonusAmount())
                    .sum();
            summaries.add(PayrollSummaryDto.builder()
                    .month(period)
                    .count(list.size())
                    .total(total)
                    .build());
        });
        return summaries;
    }
}
