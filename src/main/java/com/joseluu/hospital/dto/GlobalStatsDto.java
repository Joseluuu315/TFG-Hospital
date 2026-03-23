package com.joseluu.hospital.dto;

import com.joseluu.hospital.entity.enums.UserRole;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class GlobalStatsDto {
    private int totalHospitals;
    private int activeHospitals;
    private int suspendedHospitals;
    private int totalUsers;
    private Map<UserRole, Integer> usersByRole;
    private List<PayrollSummaryDto> payrollsByMonth;
}
