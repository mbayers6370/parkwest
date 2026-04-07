export type TimeOffReason =
  | "vacation"
  | "paid_sick_leave"
  | "bereavement"
  | "other";

export type TimeOffWindow = "request_in_advance" | "after_absence";

export type TimeOffStatus =
  | "pending"
  | "approved"
  | "not_approved"
  | "partial_approved";

export type TimeOffReviewSegment = {
  id: string;
  absenceStartDate: string;
  absenceEndDate: string;
  datesAbsent: string;
  status: Exclude<TimeOffStatus, "pending" | "partial_approved">;
  reviewedAt: string;
  reviewedBy?: string;
};

export type TimeOffRequest = {
  id: string;
  sourceRequestId?: string;
  fullName: string;
  supervisor: string;
  dateSubmitted: string;
  absenceStartDate?: string;
  absenceEndDate?: string;
  shift: string;
  location: string;
  hoursAbsent: string;
  datesAbsent: string;
  reason: TimeOffReason;
  explanation?: string;
  requestWindow: TimeOffWindow;
  status: TimeOffStatus;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewSegments?: TimeOffReviewSegment[];
};

export const TIME_OFF_REASON_LABELS: Record<TimeOffReason, string> = {
  vacation: "Vacation",
  paid_sick_leave: "Paid Sick Leave",
  bereavement: "Bereavement",
  other: "Other",
};

export const TIME_OFF_WINDOW_LABELS: Record<TimeOffWindow, string> = {
  request_in_advance: "Request In Advance",
  after_absence: "After Absence",
};

export const TIME_OFF_STATUS_LABELS: Record<TimeOffStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  not_approved: "Not Approved",
  partial_approved: "Partial Approval",
};

export const MOCK_TIME_OFF_REQUESTS: TimeOffRequest[] = [];

export const TIME_OFF_REQUESTS_STORAGE_KEY = "parkwest-time-off-requests";

function startOfSaturdayWeek(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const day = date.getDay();
  const diff = (day + 1) % 7;
  const start = new Date(date);
  start.setDate(date.getDate() - diff);
  start.setHours(12, 0, 0, 0);
  return start;
}

function formatWeekLabel(start: Date) {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startMonth = start.toLocaleString("en-US", { month: "long" });
  const endMonth = end.toLocaleString("en-US", { month: "long" });

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}`;
  }

  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
}

export function groupRequestsBySaturdayWeek(requests: TimeOffRequest[]) {
  return groupAlreadySplitRequestsBySaturdayWeek(
    requests.flatMap(getTimeOffRequestDisplaySegments),
  );
}

export function groupAlreadySplitRequestsBySaturdayWeek(requests: TimeOffRequest[]) {
  const groups = new Map<
    string,
    { weekLabel: string; weekStart: string; requests: TimeOffRequest[] }
  >();

  const sorted = [...requests].sort((a, b) =>
    getRequestWeekAnchor(b).localeCompare(getRequestWeekAnchor(a)),
  );

  sorted.forEach((request) => {
    const start = startOfSaturdayWeek(getRequestWeekAnchor(request));
    const weekStart = start.toISOString().slice(0, 10);

    if (!groups.has(weekStart)) {
      groups.set(weekStart, {
        weekLabel: formatWeekLabel(start),
        weekStart,
        requests: [],
      });
    }

    groups.get(weekStart)?.requests.push(request);
  });

  return [...groups.values()];
}

export function groupRequestsByMonthAndWeek(requests: TimeOffRequest[]) {
  return groupAlreadySplitRequestsByMonthAndWeek(
    requests.flatMap(getTimeOffRequestDisplaySegments),
  );
}

export function groupAlreadySplitRequestsByMonthAndWeek(requests: TimeOffRequest[]) {
  const weekGroups = groupAlreadySplitRequestsBySaturdayWeek(requests);
  const months = new Map<
    string,
    {
      monthKey: string;
      monthLabel: string;
      weeks: ReturnType<typeof groupRequestsBySaturdayWeek>;
    }
  >();

  weekGroups.forEach((weekGroup) => {
    const anchor = new Date(`${weekGroup.weekStart}T12:00:00`);
    const monthKey = `${anchor.getFullYear()}-${String(anchor.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = anchor.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });

    if (!months.has(monthKey)) {
      months.set(monthKey, {
        monthKey,
        monthLabel,
        weeks: [],
      });
    }

    months.get(monthKey)?.weeks.push(weekGroup);
  });

  return [...months.values()].sort((a, b) => b.monthKey.localeCompare(a.monthKey));
}

export function getAllTimeOffRequests(storedRequests: TimeOffRequest[] = []) {
  const mergedById = new Map<string, TimeOffRequest>();

  MOCK_TIME_OFF_REQUESTS.forEach((request) => {
    mergedById.set(request.id, normalizeTimeOffRequest(request));
  });

  storedRequests.forEach((request) => {
    mergedById.set(request.id, normalizeTimeOffRequest(request));
  });

  return [...mergedById.values()];
}

export function getTimeOffRequestDisplaySegments(request: TimeOffRequest) {
  const normalized = normalizeTimeOffRequest(request);
  const displaySegments = splitRequestAcrossWeeks(normalized);

  return displaySegments.map((segment) => {
    const matchingReviewSegment = normalized.reviewSegments?.find(
      (reviewSegment) =>
        reviewSegment.absenceStartDate === segment.absenceStartDate &&
        reviewSegment.absenceEndDate === segment.absenceEndDate,
    );

    const fallbackReviewedStatus =
      normalized.reviewSegments?.length
        ? "pending"
        : normalized.status === "approved" || normalized.status === "not_approved"
          ? normalized.status
          : "pending";

    return {
      ...segment,
      status: matchingReviewSegment?.status ?? fallbackReviewedStatus,
      reviewedAt: matchingReviewSegment?.reviewedAt ?? normalized.reviewedAt,
      reviewedBy: matchingReviewSegment?.reviewedBy ?? normalized.reviewedBy,
    } satisfies TimeOffRequest;
  });
}

export function getReviewedDateBreakdown(request: TimeOffRequest) {
  const normalized = normalizeTimeOffRequest(request);
  const reviewSegments = normalized.reviewSegments ?? [];

  return {
    approved: reviewSegments
      .filter((segment) => segment.status === "approved")
      .map((segment) => segment.datesAbsent),
    notApproved: reviewSegments
      .filter((segment) => segment.status === "not_approved")
      .map((segment) => segment.datesAbsent),
  };
}

function getRequestWeekAnchor(request: TimeOffRequest) {
  const normalized = normalizeTimeOffRequest(request);
  return normalized.absenceStartDate || normalized.dateSubmitted;
}

function splitRequestAcrossWeeks(request: TimeOffRequest) {
  const normalized = normalizeTimeOffRequest(request);
  const startDate = toNoonDate(
    normalized.absenceStartDate || normalized.dateSubmitted,
  );
  const endDate = toNoonDate(
    normalized.absenceEndDate ||
      normalized.absenceStartDate ||
      normalized.dateSubmitted,
  );
  const segments: TimeOffRequest[] = [];

  let weekStart = startOfSaturdayWeek(
    normalized.absenceStartDate || normalized.dateSubmitted,
  );

  while (weekStart.getTime() <= endDate.getTime()) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const segmentStart =
      startDate.getTime() > weekStart.getTime() ? startDate : weekStart;
    const segmentEnd =
      endDate.getTime() < weekEnd.getTime() ? endDate : weekEnd;

    segments.push({
      ...normalized,
      id: `${normalized.id}-${weekStart.toISOString().slice(0, 10)}`,
      sourceRequestId: normalized.sourceRequestId ?? normalized.id,
      absenceStartDate: toIsoFromDate(segmentStart),
      absenceEndDate: toIsoFromDate(segmentEnd),
      datesAbsent: formatSegmentDateRange(segmentStart, segmentEnd),
    });

    weekStart = new Date(weekStart);
    weekStart.setDate(weekStart.getDate() + 7);
  }

  return segments;
}

export function normalizeTimeOffRequest(request: TimeOffRequest): TimeOffRequest {
  if (request.absenceStartDate) {
    return {
      ...request,
      sourceRequestId: request.sourceRequestId ?? request.id,
      status: deriveRequestStatus({
        ...request,
        sourceRequestId: request.sourceRequestId ?? request.id,
      }),
    };
  }

  const inferredDates = inferAbsenceDates(request);

  if (!inferredDates) {
    return {
      ...request,
      sourceRequestId: request.sourceRequestId ?? request.id,
      status: deriveRequestStatus({
        ...request,
        sourceRequestId: request.sourceRequestId ?? request.id,
      }),
    };
  }

  return {
    ...request,
    sourceRequestId: request.sourceRequestId ?? request.id,
    absenceStartDate: inferredDates.absenceStartDate,
    absenceEndDate: inferredDates.absenceEndDate,
    status: deriveRequestStatus({
      ...request,
      sourceRequestId: request.sourceRequestId ?? request.id,
      absenceStartDate: inferredDates.absenceStartDate,
      absenceEndDate: inferredDates.absenceEndDate,
    }),
  };
}

export function getCanonicalTimeOffRequestId(request: TimeOffRequest) {
  return request.sourceRequestId ?? request.id;
}

function deriveRequestStatus(request: TimeOffRequest): TimeOffStatus {
  const reviewSegments = request.reviewSegments ?? [];

  if (reviewSegments.length === 0) {
    return request.status;
  }

  const approvedCount = reviewSegments.filter(
    (segment) => segment.status === "approved",
  ).length;
  const deniedCount = reviewSegments.filter(
    (segment) => segment.status === "not_approved",
  ).length;

  if (approvedCount === reviewSegments.length) {
    return "approved";
  }

  if (deniedCount === reviewSegments.length) {
    return "not_approved";
  }

  return "partial_approved";
}

function inferAbsenceDates(request: TimeOffRequest) {
  const parsed = parseDatesAbsent(request.datesAbsent);

  if (!parsed) {
    return null;
  }

  const today = new Date();
  const currentYear = today.getFullYear();

  return {
    absenceStartDate: toIsoDate(currentYear, parsed.start.monthIndex, parsed.start.day),
    absenceEndDate: toIsoDate(
      currentYear,
      parsed.end.monthIndex,
      parsed.end.day,
    ),
  };
}

function parseDatesAbsent(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  const singleMonthRange = normalized.match(
    /^([A-Za-z]+)\s+(\d{1,2})\s*-\s*(\d{1,2})$/,
  );

  if (singleMonthRange) {
    const monthIndex = monthNameToIndex(singleMonthRange[1]);

    if (monthIndex === null) {
      return null;
    }

    return {
      start: { monthIndex, day: Number(singleMonthRange[2]) },
      end: { monthIndex, day: Number(singleMonthRange[3]) },
    };
  }

  const fullRange = normalized.match(
    /^([A-Za-z]+)\s+(\d{1,2})\s*-\s*([A-Za-z]+)\s+(\d{1,2})$/,
  );

  if (fullRange) {
    const startMonthIndex = monthNameToIndex(fullRange[1]);
    const endMonthIndex = monthNameToIndex(fullRange[3]);

    if (startMonthIndex === null || endMonthIndex === null) {
      return null;
    }

    return {
      start: { monthIndex: startMonthIndex, day: Number(fullRange[2]) },
      end: { monthIndex: endMonthIndex, day: Number(fullRange[4]) },
    };
  }

  const singleDate = normalized.match(/^([A-Za-z]+)\s+(\d{1,2})$/);

  if (singleDate) {
    const monthIndex = monthNameToIndex(singleDate[1]);

    if (monthIndex === null) {
      return null;
    }

    return {
      start: { monthIndex, day: Number(singleDate[2]) },
      end: { monthIndex, day: Number(singleDate[2]) },
    };
  }

  return null;
}

function monthNameToIndex(value: string) {
  const months = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];

  const index = months.indexOf(value.toLowerCase());
  return index === -1 ? null : index;
}

function toIsoDate(year: number, monthIndex: number, day: number) {
  const date = new Date(year, monthIndex, day, 12, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function toNoonDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function toIsoFromDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
    .toISOString()
    .slice(0, 10);
}

function formatSegmentDateRange(start: Date, end: Date) {
  const startMonth = start.toLocaleString("en-US", { month: "long" });
  const endMonth = end.toLocaleString("en-US", { month: "long" });

  if (start.getTime() === end.getTime()) {
    return `${startMonth} ${start.getDate()}`;
  }

  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} - ${end.getDate()}`;
  }

  return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}`;
}
