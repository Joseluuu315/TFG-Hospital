package com.joseluu.hospital.service;

import com.joseluu.hospital.dto.GlobalStatsDto;
import com.joseluu.hospital.dto.HospitalDto;
import com.joseluu.hospital.dto.PayrollDto;
import com.joseluu.hospital.dto.PayrollSummaryDto;
import com.joseluu.hospital.dto.UserDto;
import com.joseluu.hospital.entity.enums.HospitalStatus;
import com.joseluu.hospital.entity.enums.UserRole;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Servicio que prepara el resumen global visible en administracion.
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
     * Compone el resumen global de hospitales, usuarios y nominas.
     */
    public GlobalStatsDto getGlobalStats() {
        List<UserDto> users = userService.getAll();
        List<HospitalDto> hospitals = hospitalService.getAll();

        int activeHospitals = countActiveHospitals(hospitals);
        int totalHospitals = hospitals.size();

        return GlobalStatsDto.builder()
                .totalHospitals(totalHospitals)
                .activeHospitals(activeHospitals)
                .suspendedHospitals(totalHospitals - activeHospitals)
                .totalUsers(users.size())
                .usersByRole(countUsersByRole(users))
                .payrollsByMonth(buildPayrollHistory())
                .build();
    }

    /**
     * Cuenta cuantos hospitales estan activos.
     */
    private int countActiveHospitals(List<HospitalDto> hospitals) {
        int count = 0;
        for (HospitalDto hospital : hospitals) {
            if (hospital.getStatus() == HospitalStatus.ACTIVE) {
                count++;
            }
        }
        return count;
    }

    /**
     * Cuenta usuarios por rol.
     */
    private Map<UserRole, Integer> countUsersByRole(List<UserDto> users) {
        Map<UserRole, Integer> counts = new LinkedHashMap<>();
        counts.put(UserRole.ROOT, 0);
        counts.put(UserRole.HOSPITAL_ADMIN, 0);
        counts.put(UserRole.WORKER, 0);

        for (UserDto user : users) {
            UserRole role = user.getRole();
            if (role != null && counts.containsKey(role)) {
                counts.put(role, counts.get(role) + 1);
            }
        }

        return counts;
    }

    /**
     * Agrupa nominas por mes y calcula el total bruto de cada periodo.
     */
    private List<PayrollSummaryDto> buildPayrollHistory() {
        Map<String, List<PayrollDto>> grouped = new TreeMap<>();
        for (PayrollDto payroll : payrollService.getAll()) {
            grouped.computeIfAbsent(payroll.getPeriod(), key -> new ArrayList<>()).add(payroll);
        }

        List<PayrollSummaryDto> summaries = new ArrayList<>();
        grouped.forEach((period, payrolls) -> summaries.add(buildPayrollSummary(period, payrolls)));
        return summaries;
    }

    /**
     * Crea el resumen mensual de un grupo de nominas.
     */
    private PayrollSummaryDto buildPayrollSummary(String period, List<PayrollDto> payrolls) {
        double total = 0;
        for (PayrollDto payroll : payrolls) {
            total += payroll.getGrossSalary() + payroll.getOvertimeAmount() + payroll.getBonusAmount();
        }

        return PayrollSummaryDto.builder()
                .month(period)
                .count(payrolls.size())
                .total(total)
                .build();
    }
}
