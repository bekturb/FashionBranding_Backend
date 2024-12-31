export const fiveMinutesAgo = () => new Date(Date.now() - 5 * 60 * 1000);

export const fifteenMinutesFromNow = () =>
  new Date(Date.now() + 15 * 60 * 1000);

export const oneHourFromNow = () => new Date(Date.now() + 60 * 60 * 1000);

export const oneYearFromNow = () =>
  new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

export const thirtyDaysFromNow = () =>
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

export const sevenDaysFromNow = () =>
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function getTimeTwoMonthAgo() {
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  return twoMonthsAgo;
}

export function getWeekRange(startOfWeek = 1) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const dayIndex = (today.getDay() + 7 - startOfWeek) % 7;

  const startOfThisWeek = new Date(today);
  startOfThisWeek.setDate(today.getDate() - dayIndex);

  const endOfThisWeek = new Date(startOfThisWeek);
  endOfThisWeek.setDate(startOfThisWeek.getDate() + 6);

  const startOfPreviousWeek = new Date(startOfThisWeek);
  startOfPreviousWeek.setDate(startOfThisWeek.getDate() - 7);

  const endOfPreviousWeek = new Date(startOfPreviousWeek);
  endOfPreviousWeek.setDate(startOfPreviousWeek.getDate() + 6);

  return {
    thisWeek: {
      start: startOfThisWeek,
      end: endOfThisWeek,
    },
    previousWeek: {
      start: startOfPreviousWeek,
      end: endOfPreviousWeek,
    },
  };
}