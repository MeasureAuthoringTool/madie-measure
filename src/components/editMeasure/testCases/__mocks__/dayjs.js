const mock = jest.genMockFromModule("dayjs");
const utc = jest.requireActual("dayjs/plugin/utc");
const timezone = jest.requireActual("dayjs/plugin/timezone");
const dayjs = jest.requireActual("dayjs");
const advancedFormat = jest.requireActual("dayjs/plugin/advancedFormat");

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

module.exports = dayjs;
