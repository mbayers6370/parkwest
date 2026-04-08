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

export type TimeOffReviewDay = {
  isoDate: string;
  label: string;
  status: "pending" | "approved" | "not_approved";
  reviewedAt?: string;
  reviewedBy?: string;
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
    const segmentStatus = deriveSegmentStatus(
      normalized,
      segment.absenceStartDate ?? normalized.absenceStartDate ?? normalized.dateSubmitted,
      segment.absenceEndDate ??
        normalized.absenceEndDate ??
        normalized.absenceStartDate ??
        normalized.dateSubmitted,
    );
    const matchingReviewDay = getRequestReviewDays(normalized, {
      startDate: segment.absenceStartDate,
      endDate: segment.absenceEndDate,
    }).find((reviewDay) => reviewDay.reviewedAt);

    return {
      ...segment,
      status: segmentStatus,
      reviewedAt: matchingReviewDay?.reviewedAt ?? normalized.reviewedAt,
      reviewedBy: matchingReviewDay?.reviewedBy ?? normalized.reviewedBy,
    } satisfies TimeOffRequest;
  });
}

export function getAdminTimeOffRequestDisplaySegments(request: TimeOffRequest) {
  const normalized = normalizeTimeOffRequest(request);
  const reviewDays = getRequestReviewDays(normalized);

  if (reviewDays.length === 0) {
    return [normalized];
  }

  const segments: Array<{
    startDate: string;
    endDate: string;
    status: TimeOffReviewDay["status"];
    reviewedAt?: string;
    reviewedBy?: string;
  }> = [];

  reviewDays.forEach((reviewDay) => {
    const lastSegment = segments.at(-1);

    if (!lastSegment) {
      segments.push({
        startDate: reviewDay.isoDate,
        endDate: reviewDay.isoDate,
        status: reviewDay.status,
        reviewedAt: reviewDay.reviewedAt,
        reviewedBy: reviewDay.reviewedBy,
      });
      return;
    }

    const nextDate = toNoonDate(lastSegment.endDate);
    nextDate.setDate(nextDate.getDate() + 1);
    const isConsecutive = toIsoFromDate(nextDate) === reviewDay.isoDate;
    const sameWeek =
      startOfSaturdayWeek(lastSegment.startDate).toISOString().slice(0, 10) ===
      startOfSaturdayWeek(reviewDay.isoDate).toISOString().slice(0, 10);

    if (lastSegment.status === reviewDay.status && isConsecutive && sameWeek) {
      lastSegment.endDate = reviewDay.isoDate;
      lastSegment.reviewedAt = reviewDay.reviewedAt ?? lastSegment.reviewedAt;
      lastSegment.reviewedBy = reviewDay.reviewedBy ?? lastSegment.reviewedBy;
      return;
    }

    segments.push({
      startDate: reviewDay.isoDate,
      endDate: reviewDay.isoDate,
      status: reviewDay.status,
      reviewedAt: reviewDay.reviewedAt,
      reviewedBy: reviewDay.reviewedBy,
    });
  });

  return segments.map((segment) => ({
    ...normalized,
    id: `${normalized.id}-${segment.status}-${segment.startDate}`,
    sourceRequestId: normalized.sourceRequestId ?? normalized.id,
    absenceStartDate: segment.startDate,
    absenceEndDate: segment.endDate,
    datesAbsent: formatSegmentDateRange(
      toNoonDate(segment.startDate),
      toNoonDate(segment.endDate),
    ),
    status: segment.status,
    reviewedAt: segment.reviewedAt,
    reviewedBy: segment.reviewedBy,
  }));
}

export function getReviewedDateBreakdown(request: TimeOffRequest) {
  const reviewedDays = getRequestReviewDays(request);

  return {
    approved: collapseReviewedDateRanges(
      reviewedDays.filter((reviewDay) => reviewDay.status === "approved"),
    ),
    notApproved: collapseReviewedDateRanges(
      reviewedDays.filter((reviewDay) => reviewDay.status === "not_approved"),
    ),
  };
}

export function getRequestReviewDays(
  request: TimeOffRequest,
  options?: { startDate?: string; endDate?: string },
): TimeOffReviewDay[] {
  const normalized = withResolvedAbsenceDates(request);
  const requestDates = getRequestDates(normalized);
  const startBound = options?.startDate;
  const endBound = options?.endDate;

  return requestDates
    .filter((isoDate) => (!startBound || isoDate >= startBound) && (!endBound || isoDate <= endBound))
    .map((isoDate) => {
      const matchingReviewSegment = getReviewSegmentForDate(normalized, isoDate);

      return {
        isoDate,
        label: formatIsoDateLabel(isoDate),
        status: matchingReviewSegment?.status ?? "pending",
        reviewedAt: matchingReviewSegment?.reviewedAt,
        reviewedBy: matchingReviewSegment?.reviewedBy,
      };
    });
}

function getRequestWeekAnchor(request: TimeOffRequest) {
  const normalized = withResolvedAbsenceDates(request);
  return normalized.absenceStartDate || normalized.dateSubmitted;
}

function splitRequestAcrossWeeks(request: TimeOffRequest) {
  const normalized = withResolvedAbsenceDates(request);
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
  const normalized = withResolvedAbsenceDates(request);

  return {
    ...normalized,
    status: deriveRequestStatus(normalized),
  };
}

export function getCanonicalTimeOffRequestId(request: TimeOffRequest) {
  return request.sourceRequestId ?? request.id;
}

function deriveRequestStatus(request: TimeOffRequest): TimeOffStatus {
  const normalized = withResolvedAbsenceDates(request);
  const requestDates = getRequestDates(normalized);

  if (requestDates.length === 0) {
    return normalized.status;
  }

  const dayStatuses = requestDates.map(
    (isoDate) => getReviewSegmentForDate(normalized, isoDate)?.status ?? "pending",
  );

  if (dayStatuses.every((status) => status === "pending")) {
    return "pending";
  }

  if (dayStatuses.some((status) => status === "pending")) {
    return "pending";
  }

  if (dayStatuses.every((status) => status === "approved")) {
    return "approved";
  }

  if (dayStatuses.every((status) => status === "not_approved")) {
    return "not_approved";
  }

  return "partial_approved";
}

function deriveSegmentStatus(
  request: TimeOffRequest,
  startDate: string,
  endDate: string,
): TimeOffStatus {
  const normalized = withResolvedAbsenceDates(request);
  const dayStatuses = getRequestReviewDays(normalized, { startDate, endDate }).map(
    (reviewDay) => reviewDay.status,
  );

  if (dayStatuses.length === 0) {
    return normalized.status;
  }

  if (dayStatuses.every((status) => status === "pending")) {
    return "pending";
  }

  if (dayStatuses.some((status) => status === "pending")) {
    return "pending";
  }

  if (dayStatuses.every((status) => status === "approved")) {
    return "approved";
  }

  if (dayStatuses.every((status) => status === "not_approved")) {
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

function getRequestDates(request: TimeOffRequest) {
  const normalized = withResolvedAbsenceDates(request);
  const startValue = normalized.absenceStartDate || normalized.dateSubmitted;
  const endValue =
    normalized.absenceEndDate ||
    normalized.absenceStartDate ||
    normalized.dateSubmitted;

  if (!startValue || !endValue) {
    return [];
  }

  const start = toNoonDate(startValue);
  const end = toNoonDate(endValue);
  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor.getTime() <= end.getTime()) {
    dates.push(toIsoFromDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function withResolvedAbsenceDates(request: TimeOffRequest): TimeOffRequest {
  const sourceRequestId = request.sourceRequestId ?? request.id;

  if (request.absenceStartDate) {
    return {
      ...request,
      sourceRequestId,
    };
  }

  const inferredDates = inferAbsenceDates(request);

  if (!inferredDates) {
    return {
      ...request,
      sourceRequestId,
    };
  }

  return {
    ...request,
    sourceRequestId,
    absenceStartDate: inferredDates.absenceStartDate,
    absenceEndDate: inferredDates.absenceEndDate,
  };
}

function getReviewSegmentForDate(request: TimeOffRequest, isoDate: string) {
  const reviewSegments = [...(request.reviewSegments ?? [])].sort((a, b) =>
    a.reviewedAt.localeCompare(b.reviewedAt),
  );

  for (let index = reviewSegments.length - 1; index >= 0; index -= 1) {
    const segment = reviewSegments[index];

    if (segment.absenceStartDate <= isoDate && segment.absenceEndDate >= isoDate) {
      return segment;
    }
  }

  return undefined;
}

function formatIsoDateLabel(isoDate: string) {
  const date = toNoonDate(isoDate);
  return formatSegmentDateRange(date, date);
}

function collapseReviewedDateRanges(reviewDays: TimeOffReviewDay[]) {
  if (reviewDays.length === 0) {
    return [];
  }

  const sortedDays = [...reviewDays].sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  const ranges: Array<{ start: string; end: string }> = [];

  sortedDays.forEach((reviewDay) => {
    const lastRange = ranges.at(-1);

    if (!lastRange) {
      ranges.push({ start: reviewDay.isoDate, end: reviewDay.isoDate });
      return;
    }

    const previousDate = toNoonDate(lastRange.end);
    previousDate.setDate(previousDate.getDate() + 1);

    if (toIsoFromDate(previousDate) === reviewDay.isoDate) {
      lastRange.end = reviewDay.isoDate;
      return;
    }

    ranges.push({ start: reviewDay.isoDate, end: reviewDay.isoDate });
  });

  return ranges.map((range) =>
    formatSegmentDateRange(toNoonDate(range.start), toNoonDate(range.end)),
  );
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
