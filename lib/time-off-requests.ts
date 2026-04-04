export type TimeOffReason =
  | "vacation"
  | "paid_sick_leave"
  | "bereavement"
  | "other";

export type TimeOffWindow = "request_in_advance" | "after_absence";

export type TimeOffStatus = "pending" | "approved" | "not_approved";

export type TimeOffRequest = {
  id: string;
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
};

export const MOCK_TIME_OFF_REQUESTS: TimeOffRequest[] = [
  {
    id: "tor-001",
    fullName: "Matthew Bayers",
    supervisor: "Brian",
    dateSubmitted: "2025-08-01",
    absenceStartDate: "2025-09-13",
    absenceEndDate: "2025-09-24",
    shift: "Grave",
    location: "580",
    hoursAbsent: "14",
    datesAbsent: "September 13 - 24",
    reason: "other",
    explanation: "Japan work trip",
    requestWindow: "request_in_advance",
    status: "pending",
  },
  {
    id: "tor-002",
    fullName: "Janelle Reyes",
    supervisor: "Brian",
    dateSubmitted: "2025-08-02",
    absenceStartDate: "2025-08-22",
    absenceEndDate: "2025-08-22",
    shift: "Swing",
    location: "580",
    hoursAbsent: "8",
    datesAbsent: "August 22",
    reason: "vacation",
    requestWindow: "request_in_advance",
    status: "approved",
  },
  {
    id: "tor-003",
    fullName: "Marcus Tran",
    supervisor: "Brian",
    dateSubmitted: "2025-08-08",
    absenceStartDate: "2025-08-09",
    absenceEndDate: "2025-08-09",
    shift: "Day",
    location: "580",
    hoursAbsent: "6",
    datesAbsent: "August 9",
    reason: "paid_sick_leave",
    explanation: "Flu symptoms",
    requestWindow: "after_absence",
    status: "pending",
  },
  {
    id: "tor-004",
    fullName: "Susan Kim",
    supervisor: "Brian",
    dateSubmitted: "2025-08-09",
    absenceStartDate: "2025-08-15",
    absenceEndDate: "2025-08-15",
    shift: "Swing",
    location: "580",
    hoursAbsent: "8",
    datesAbsent: "August 15",
    reason: "bereavement",
    requestWindow: "request_in_advance",
    status: "not_approved",
  },
];

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
  const groups = new Map<
    string,
    { weekLabel: string; weekStart: string; requests: TimeOffRequest[] }
  >();

  const expandedRequests = requests.flatMap(splitRequestAcrossWeeks);

  const sorted = [...expandedRequests].sort((a, b) =>
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

export function getAllTimeOffRequests(storedRequests: TimeOffRequest[] = []) {
  return [...storedRequests.map(normalizeTimeOffRequest), ...MOCK_TIME_OFF_REQUESTS];
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
    return request;
  }

  const inferredDates = inferAbsenceDates(request);

  if (!inferredDates) {
    return request;
  }

  return {
    ...request,
    absenceStartDate: inferredDates.absenceStartDate,
    absenceEndDate: inferredDates.absenceEndDate,
  };
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
