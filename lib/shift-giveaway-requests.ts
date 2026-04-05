import {
  getMostRecentWorkedShiftEnd,
  getScheduleEntryForEmployeeAndDate,
  parseShiftRange,
  type ScheduleEntry,
} from "@/lib/mock-schedule";
import { mockEmployees } from "@/lib/mock-data";

export type ShiftGiveawayRequestStatus = "pending" | "approved" | "denied";
export type ShiftRequestKind = "giveaway" | "switch";
export type ShiftExchangeRole =
  | "dealer"
  | "dual_rate"
  | "floor"
  | "chip_runner"
  | "cage"
  | "unknown";
export type ShiftRequestApprovalRoute = "automatic" | "floor_admin" | "admin_only";

export type ShiftGiveawayRequest = {
  id: string;
  requestKind: ShiftRequestKind;
  requesterName: string;
  requesterRole?: ShiftExchangeRole;
  targetDealerName: string;
  targetDealerRole?: ShiftExchangeRole;
  shiftDate: string;
  shiftDayLabel: string;
  requesterShiftTime: string;
  targetDealerShiftTime: string;
  targetDealerStatus: "scheduled" | "off";
  approvalRoute?: ShiftRequestApprovalRoute;
  note?: string;
  status: ShiftGiveawayRequestStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  denialReason?: string;
  validationSnapshot: {
    submittedAtLeastFourHoursBefore: boolean;
    targetDealerEligibleForRestWindow: boolean;
    restHoursBeforeShift: number | null;
    targetDealerAlreadyAtSixDays: boolean;
  };
};

export const SHIFT_REQUEST_KIND_LABELS: Record<ShiftRequestKind, string> = {
  giveaway: "Giveaway",
  switch: "Switch Shift",
};

export const SHIFT_GIVEAWAY_STATUS_LABELS: Record<
  ShiftGiveawayRequestStatus,
  string
> = {
  pending: "Pending",
  approved: "Approved",
  denied: "Denied",
};

export const SHIFT_REQUEST_ROUTE_LABELS: Record<ShiftRequestApprovalRoute, string> = {
  automatic: "Automatic",
  floor_admin: "Floor + Admin",
  admin_only: "Admin Only",
};

export function normalizeShiftExchangeRole(dept?: string | null): ShiftExchangeRole {
  const normalized = dept?.trim().toLowerCase() ?? "";

  if (!normalized) {
    return "unknown";
  }

  if (normalized.includes("dual")) {
    return "dual_rate";
  }

  if (normalized.includes("floor")) {
    return "floor";
  }

  if (normalized.includes("chip")) {
    return "chip_runner";
  }

  if (normalized.includes("cage")) {
    return "cage";
  }

  if (normalized.includes("dealer")) {
    return "dealer";
  }

  return "unknown";
}

export function getEmployeeShiftExchangeRole(
  scheduleEntries: ScheduleEntry[],
  employeeName: string,
  shiftDate?: string,
) {
  const exactEntry = shiftDate
    ? getScheduleEntryForEmployeeAndDate(scheduleEntries, employeeName, shiftDate)
    : null;

  if (exactEntry?.dept) {
    return normalizeShiftExchangeRole(exactEntry.dept);
  }

  const scheduledEntry = scheduleEntries.find(
    (entry) =>
      entry.employeeName === employeeName &&
      entry.status === "scheduled" &&
      entry.dept,
  );

  if (scheduledEntry?.dept) {
    return normalizeShiftExchangeRole(scheduledEntry.dept);
  }

  const employeeRecord = mockEmployees.find((employee) =>
    employee.aliases.some((alias) => alias.aliasName === employeeName),
  );

  const primaryDepartment = employeeRecord?.departmentAssignments.find(
    (assignment) => assignment.isPrimary,
  )?.department.departmentName;

  return normalizeShiftExchangeRole(primaryDepartment);
}

export function canRolesSwitch(
  requesterRole: ShiftExchangeRole,
  targetRole: ShiftExchangeRole,
) {
  switch (requesterRole) {
    case "dealer":
      return targetRole === "dealer" || targetRole === "dual_rate";
    case "dual_rate":
      return (
        targetRole === "dealer" ||
        targetRole === "dual_rate" ||
        targetRole === "floor"
      );
    case "floor":
      return targetRole === "floor" || targetRole === "dual_rate";
    case "chip_runner":
      return targetRole === "chip_runner";
    case "cage":
      return targetRole === "cage";
    default:
      return false;
  }
}

export function getShiftRequestApprovalRoute(args: {
  requestKind: ShiftRequestKind;
  requesterRole: ShiftExchangeRole;
  targetRole: ShiftExchangeRole;
}) {
  const { requestKind, requesterRole, targetRole } = args;

  if (requestKind === "switch") {
    if (requesterRole === "chip_runner" || requesterRole === "cage") {
      return "admin_only" as const;
    }

    if (
      (requesterRole === "floor" || requesterRole === "dual_rate") &&
      (targetRole === "floor" || targetRole === "dual_rate")
    ) {
      return "automatic" as const;
    }
  }

  if (requesterRole === "chip_runner" || requesterRole === "cage") {
    return "admin_only" as const;
  }

  return "floor_admin" as const;
}

export function validateShiftGiveawayRequest(args: {
  scheduleEntries: ScheduleEntry[];
  requesterName: string;
  targetDealerName: string;
  shiftDate: string;
  requestKind?: ShiftRequestKind;
  now?: Date;
}) {
  const {
    scheduleEntries,
    requesterName,
    targetDealerName,
    shiftDate,
    requestKind = "giveaway",
    now = new Date(),
  } = args;

  if (requesterName === targetDealerName) {
    return {
      valid: false,
      message: "Choose a different dealer.",
      restHoursBeforeShift: null,
      submittedAtLeastFourHoursBefore: false,
      targetDealerEligibleForRestWindow: false,
      targetDealerAlreadyAtSixDays: false,
    };
  }

  const requesterEntry = getScheduleEntryForEmployeeAndDate(
    scheduleEntries,
    requesterName,
    shiftDate,
  );
  const targetEntry = getScheduleEntryForEmployeeAndDate(
    scheduleEntries,
    targetDealerName,
    shiftDate,
  );
  const requesterRole = getEmployeeShiftExchangeRole(
    scheduleEntries,
    requesterName,
    shiftDate,
  );
  const targetRole = getEmployeeShiftExchangeRole(
    scheduleEntries,
    targetDealerName,
    shiftDate,
  );
  const approvalRoute = getShiftRequestApprovalRoute({
    requestKind,
    requesterRole,
    targetRole,
  });

  if (!requesterEntry || requesterEntry.status !== "scheduled") {
    return {
      valid: false,
      message:
        requestKind === "switch"
          ? "That shift is not available to switch."
          : "That shift is not available to give away.",
      restHoursBeforeShift: null,
      submittedAtLeastFourHoursBefore: false,
      targetDealerEligibleForRestWindow: false,
      targetDealerAlreadyAtSixDays: false,
      requesterRole,
      targetRole,
      approvalRoute,
    };
  }

  if (!targetEntry) {
    return {
      valid: false,
      message: "That dealer does not have a schedule entry for this day.",
      restHoursBeforeShift: null,
      submittedAtLeastFourHoursBefore: false,
      targetDealerEligibleForRestWindow: false,
      targetDealerAlreadyAtSixDays: false,
      requesterRole,
      targetRole,
      approvalRoute,
    };
  }

  const requesterRange = parseShiftRange(requesterEntry.shiftDate, requesterEntry.shiftTime);

  if (!requesterRange) {
    return {
      valid: false,
      message: "That shift cannot be validated yet.",
      restHoursBeforeShift: null,
      submittedAtLeastFourHoursBefore: false,
      targetDealerEligibleForRestWindow: false,
      targetDealerAlreadyAtSixDays: false,
      requesterRole,
      targetRole,
      approvalRoute,
    };
  }

  const submittedAtLeastFourHoursBefore =
    requesterRange.start.getTime() - now.getTime() >= 4 * 60 * 60 * 1000;

  const lastWorkedEnd = getMostRecentWorkedShiftEnd(
    scheduleEntries,
    targetDealerName,
    requesterRange.start,
  );
  const targetDealerScheduledDays = scheduleEntries.filter(
    (entry) =>
      entry.employeeName === targetDealerName &&
      entry.status === "scheduled" &&
      entry.shiftTime !== "OFF" &&
      entry.shiftDate.slice(0, 7) === shiftDate.slice(0, 7),
  ).length;
  const targetDealerAlreadyAtSixDays = targetDealerScheduledDays >= 6;
  const restHoursBeforeShift = lastWorkedEnd
    ? Number(
        ((requesterRange.start.getTime() - lastWorkedEnd.getTime()) /
          (60 * 60 * 1000)).toFixed(1),
      )
    : null;
  const targetDealerEligibleForRestWindow =
    targetEntry.status === "scheduled" || restHoursBeforeShift === null
      ? true
      : restHoursBeforeShift >= 9.5;
  const roleCompatible =
    requestKind === "switch"
      ? canRolesSwitch(requesterRole, targetRole)
      : true;

  if (!roleCompatible) {
    return {
      valid: false,
      message: "That coworker is not eligible for this switch based on role coverage.",
      restHoursBeforeShift,
      submittedAtLeastFourHoursBefore,
      targetDealerEligibleForRestWindow,
      targetDealerAlreadyAtSixDays,
      requesterRole,
      targetRole,
      approvalRoute,
    };
  }

  if (requestKind === "switch" && targetEntry.status !== "scheduled") {
    return {
      valid: false,
      message: "Switch Shift requires another dealer who is already scheduled that day.",
      restHoursBeforeShift,
      submittedAtLeastFourHoursBefore,
      targetDealerEligibleForRestWindow,
      targetDealerAlreadyAtSixDays,
      requesterRole,
      targetRole,
      approvalRoute,
    };
  }

  if (!submittedAtLeastFourHoursBefore) {
    return {
      valid: false,
      message:
        requestKind === "switch"
          ? "Switch requests must be submitted at least 4 hours before the shift."
          : "Giveaway requests must be submitted at least 4 hours before the shift.",
      restHoursBeforeShift,
      submittedAtLeastFourHoursBefore,
      targetDealerEligibleForRestWindow,
      targetDealerAlreadyAtSixDays,
      requesterRole,
      targetRole,
      approvalRoute,
    };
  }

  if (!targetDealerEligibleForRestWindow) {
    return {
      valid: false,
      message:
        requestKind === "switch"
          ? "That dealer must have at least 9.5 hours off before the earlier shift starts."
          : "That dealer must be off at least 9.5 hours before this shift starts.",
      restHoursBeforeShift,
      submittedAtLeastFourHoursBefore,
      targetDealerEligibleForRestWindow,
      targetDealerAlreadyAtSixDays,
      requesterRole,
      targetRole,
      approvalRoute,
    };
  }

  return {
    valid: true,
    message: "",
    requesterEntry,
    targetEntry,
    requesterRole,
    targetRole,
    approvalRoute,
    roleCompatible,
    restHoursBeforeShift,
    submittedAtLeastFourHoursBefore,
    targetDealerEligibleForRestWindow,
    targetDealerAlreadyAtSixDays,
  };
}

export function applyApprovedGiveawayRequest(
  scheduleEntries: ScheduleEntry[],
  request: ShiftGiveawayRequest,
) {
  const requesterEntry = getScheduleEntryForEmployeeAndDate(
    scheduleEntries,
    request.requesterName,
    request.shiftDate,
  );
  const targetEntry = getScheduleEntryForEmployeeAndDate(
    scheduleEntries,
    request.targetDealerName,
    request.shiftDate,
  );

  if (!requesterEntry || !targetEntry) {
    return scheduleEntries;
  }

  return scheduleEntries.map((entry) => {
    if (entry.id === requesterEntry.id) {
      return {
        ...entry,
        shiftTime: targetEntry.shiftTime,
        dept: targetEntry.dept,
        status: targetEntry.status,
      };
    }

    if (entry.id === targetEntry.id) {
      return {
        ...entry,
        shiftTime: requesterEntry.shiftTime,
        dept: requesterEntry.dept,
        status: requesterEntry.status,
      };
    }

    return entry;
  });
}
