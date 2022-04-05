export interface Mark {
    value: number;
    label?: React.ReactNode;
}

/**
 * Get date between given dates, by portion.
 * @param startDate
 * @param endDate
 * @param portion Portion = 0, returns startDate; Portion = 1, returns endDate; Portion = 0.5, returns the date in the middle of the two dates.
 */
export const getDateTimeByPortion = (startDate: Date, endDate: Date, portion: number): Date => {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const diff = end - start;
  const portionTime = diff * portion;
  const portionDate = new Date(start + portionTime);
  return portionDate;
};

export const getDateTimeMarks = (startDate: Date, endDate: Date, markerCount: number, valueCount: number): Mark[] => {
  const marks: Mark[] = [];
  const start = startDate.getTime();
  const end = endDate.getTime();
  for (let i = 0; i < markerCount; i++) {
    const portion = i / (markerCount - 1);
    const portionTime = getDateTimeByPortion(startDate, endDate, portion);
    const value = Math.floor(valueCount * portion);
    marks.push({
      value: value,
      label: portionTime.toISOString().slice(0, 16),
    });
  }
  return marks;
};

