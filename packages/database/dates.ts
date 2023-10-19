import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

export function getCurrentDateInUTC() {
  return dayjs.utc().format();
}

export function isBefore(date1: string, date2: string) {
  return dayjs.utc(date1).isBefore(dayjs.utc(date2));
}
