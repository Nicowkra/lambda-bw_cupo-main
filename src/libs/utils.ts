import moment from "moment";

export function isDeepEqual(
  object1: Record<string, any>,
  object2: Record<string, any>
) {
  const objKeys1 = Object.keys(object1);
  const objKeys2 = Object.keys(object2);

  if (objKeys1.length !== objKeys2.length) return false;

  for (var key of objKeys1) {
    const value1 = object1[key];
    const value2 = object2[key];

    const isObjects = isObject(value1) && isObject(value2);

    if (
      (isObjects && !isDeepEqual(value1, value2)) ||
      (!isObjects && value1 !== value2)
    ) {
      return false;
    }
  }
  return true;
}

export function isObject(object: Record<string, any>) {
  return object != null && typeof object === "object";
}

export function getDurationCycle({
  duration,
  durationUnit,
}: {
  duration: string;
  durationUnit: moment.unitOfTime.DurationConstructor;
}): { cycles: number[][]; currentCycle: number[] | null } {
  const cycles: number[][] = [];
  let currentCycle: number[] | null = null;
  const cycle = moment().set({
    date: 1,
    month: 0,
    hour: 0,
    minute: 0,
    s: 0,
    ms: 0,
  });

  for (let i = 1; i < 12; i++) {
      const today = moment();
      const startingMonth = cycle.month();
      const endingMonth = moment(cycle).add(duration, durationUnit).month();
      if (cycles.includes([startingMonth, endingMonth])) {
          i = i + 11;
          break;
    } else {
        if (today.isBetween(cycle, moment(cycle).add(duration, durationUnit)))
            currentCycle = [startingMonth + 1, (endingMonth === 0 ? 12 : endingMonth + 1)]
        if (startingMonth >= endingMonth) {
            if (!currentCycle) currentCycle = [startingMonth + 1, 12];
            cycles.push([startingMonth + 1, 12]);
            break;
        } else {
            cycles.push([startingMonth + 1, endingMonth + 1]);
        }
    }
    cycle.add(duration, durationUnit);
  }
  return {
    cycles,
    currentCycle,
  };
}
