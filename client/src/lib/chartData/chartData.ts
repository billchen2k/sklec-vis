import savitzkyGolay, {Options as SGOptions} from 'ml-savitzky-golay';

/**
 * Downsample an array of data.
 */
import {IGroupingResult, IYLableGroupingItem} from '@/types';

export function downsampleValue(src: number[] | string[], n: number): number[] {
  const dst: number[] = [];
  for (let i = 0; i < src.length; i += n) {
    dst.push(parseFloat(src[i] as string));
  }
  console.log(src);
  console.log(dst);
  return dst;
}

/**
 * Downsample the x axis of the input data. n should be the same as `downsampleValue`.
 */
export function downsampleAxis(src: any[], n: number): any[] {
  const dst: any[] = [];
  for (let i = 0; i < src.length; i += n) {
    dst.push(src[i]);
  }
  return dst;
}


export function genYLablesGrouping(labels: string[]): | IGroupingResult {
  const groupingResult: IGroupingResult = {
    grouped: [],
    ungrouped: [],
  };
  // Grouping strategy 1: With depth.
  // Example: If y labels contains Speed#1(0.9m) and Dir#1(0.9m) (Matched with regex expression),
  //    then we will group these ylabels by depth.
  const isDepthGroupable = labels.some((label, i) => {
    // Will match Speed#1(0.9m)
    const match = label.match(/#\d+\(.*m\)/);
    return match && match.length > 0;
  });
  if (isDepthGroupable) {
    const depthToParameterTable: {[key: string]: { label: string; variable: string }[]} = {};
    // Feed depthToParameterTable like {'0.9m': {label: 'Speed#1(0.9m)', variable: Speed}}
    labels.forEach((label, i) => {
      const res = label.match(/(.*)#\d+\((.*m)\)/);
      if (!res || res.length < 3) {
        groupingResult.ungrouped.push(label);
        return;
      }
      const variable = res[1];
      const depth = res[2];
      if (!depthToParameterTable[depth]) {
        depthToParameterTable[depth] = [];
      }
      depthToParameterTable[depth].push({
        label: label,
        variable: variable,
      });
    });
    // Generate grouping
    for (let i = 0; i < Object.keys(depthToParameterTable).length; i++) {
      const key = Object.keys(depthToParameterTable)[i];
      const grouping: IYLableGroupingItem = {
        name: depthToParameterTable[key].map((item) => item.variable).join(', ') + ` (${key})`,
        labels: depthToParameterTable[key].map((item) => item.label),
        order: i,
      };
      groupingResult.grouped.push(grouping);
    }

    return groupingResult;
  }
  return null;
}


