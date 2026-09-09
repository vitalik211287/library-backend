export const getSafeTimeZone = (timeZone?: string) => {
  if (!timeZone) {
    return "UTC";
  }

  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone,
    }).format();

    return timeZone;
  } catch {
    return "UTC";
  }
};

export const getDateKey = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to format date");
  }

  return `${year}-${month}-${day}`;
};

const getTimeZoneOffset = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );

  return asUtc - date.getTime();
};

export const zonedDateTimeToUtc = (
  year: number,
  month: number,
  day: number,
  timeZone: string,
) => {
  const utcGuess = Date.UTC(year, month - 1, day);

  let result = new Date(
    utcGuess - getTimeZoneOffset(new Date(utcGuess), timeZone),
  );

  result = new Date(
    utcGuess - getTimeZoneOffset(result, timeZone),
  );

  return result;
};
