const mock = jest.genMockFromModule("dayjs");
const utc = jest.requireActual("dayjs/plugin/utc");
const timezone = jest.requireActual("dayjs/plugin/timezone");
const dayjs = jest.requireActual("dayjs");

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("America/Los_Angeles");

module.exports = dayjs;
