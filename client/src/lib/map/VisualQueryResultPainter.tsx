/**
 * Reference: DDLVis by Chenhui Li.
 */

import * as d3 from 'd3';

export interface IVQResultPainterOptions {
  domainBoundLow?: number;
  domainBoundHigh?: number;
  threshAmplitude?: number;
  threshFluctuation?: number;
}

export class VisualQueryResultPainter {
  private data: any;
  private nDays = 0;
  private gBottomCircleSize = 8;
  private dateData: any[];
  private dataStream: number[][];
  private widthContainer: number;
  private heightContainer: number;
  private container_d3: any;
  private container_jq: HTMLElement;
  private colorGradientAmpFluc: any[];
  private d3containerName: string;
  private options: IVQResultPainterOptions;

  constructor(d3container: string, dataStream: number[][], dateData: any[], options: IVQResultPainterOptions) {
    this.container_d3 = d3.select('#' + d3container);
    this.d3containerName = d3container;
    this.widthContainer = document.getElementById(d3container).clientWidth;
    this.heightContainer = document.getElementById(d3container).clientHeight;
    this.container_jq = document.getElementById(d3container);
    this.options = options;
    this.dateData = dateData.map((d) => {
      return {date: new Date(d)};
    });
    this.dataStream = dataStream;
    this.data = [];
    this.dataStream.forEach((d) => {
      d.forEach((dd) => {
        this.data.push({value: dd});
      });
    });
    this.nDays = dateData.length;
    this.colorGradientAmpFluc = [
      d3.interpolateGreens, d3.interpolateOranges, d3.interpolateBlues,
    ];
  }

  public remove() {
    this.container_d3.selectAll('*').remove();
  }

  // 幅值 <- 最大值或平均值
  // 返回pointArray.length长度的数组
  // 记录每条流图中元素大于阈值的次数作为其分数
  public getDataAmplitude(thresh: number) {
    const ret = [];
    const pointLen = this.dataStream.length; // 多少个采样点,多少条流
    for (let i = 0; i < pointLen; i++) {
      let score = 0;
      for (let j = 0; j < this.dataStream[i].length; j++) {
        if (this.dataStream[i][j] > thresh) {
          score += 1;
        }
      }
      ret.push(score);
    }
    return ret;
  }

  // 变化程度 <- 波峰与波谷的差值
  // 返回pointArray.length长度的数组
  // 记录每条流图中相邻波峰波谷差值大于阈值的次数作为其分数
  public getDataFluctuation(thresh: number) {
    const ret = [];
    const pointLen = this.dataStream.length; // 多少个采样点,多少条流
    for (let i = 0; i < pointLen; i++) {
      let mmin = this.dataStream[i][0];
      let mmax = mmin;
      let score = 0;
      for (let j = 1; j < this.dataStream[i].length - 1; j++) {
        const e = this.dataStream[i][j];
        const e2 = this.dataStream[i][j - 1];
        const e3 = this.dataStream[i][j + 1];
        if (e < e2 && e < e3) {
          mmin = e;
          if (Math.abs(mmax - mmin) > thresh) {
            score++;
          }
        } else if (e > e2 && e > e3) {
          mmax = e;
          if (Math.abs(mmax - mmin) > thresh) {
            score++;
          }
        }
      }
      ret.push(score);
      // const start = i * this.nDays;
      // const end = (i + 1) * this.nDays;
      // let score = 0;
      // let mmin = this.data[start];
      // let mmax = mmin;
      // let e; let e2; let e3;
      // for (let j = start + 1; j < end - 1; j++) {
      //   e = this.data[j].value;
      //   e2 = this.data[j - 1].value;
      //   e3 = this.data[j + 1].value;
      //   if (e < e2 && e < e3) {
      //     mmin = e;
      //     if (Math.abs(mmax - mmin) > thresh) {
      //       score++;
      //     }
      //   } else if (e > e2 && e > e3) {
      //     mmax = e;
      //     if (Math.abs(mmax - mmin) > thresh) {
      //       score++;
      //     }
      //   }
      // }
    }
    return ret;
  }

  /**
     * 决定每条flow的类别:low amp, high amp, high fluc. 返回对应的颜色
     *
     * @param {number} threshAmplitude   判断幅值是否累加分数的阈值
     * @param {number} threshFluctuation 判断峰谷差是否累加分数的阈值
     * @param {number} threshAmpScore    决定幅值分数划分为高还是低
     */
  public getColorsOfFlows(threshAmplitude?: number, threshFluctuation?: number) {
    let meanAmp = 0;
    let maxAmp = -1;

    threshAmplitude = threshAmplitude || this.options.threshAmplitude || 0.11; // 分数计数阈值
    threshFluctuation = threshFluctuation || this.options.threshFluctuation || 0.25; // 峰谷差相差超过此值定义为变化较大

    const amplitude = this.getDataAmplitude(threshAmplitude);
    const fluctuation = this.getDataFluctuation(threshFluctuation);

    if (amplitude.length !== fluctuation.length || !amplitude || !fluctuation) {
      throw new Error();
    }
    const len = amplitude.length;

    amplitude.forEach((amp: any) => {
      if (amp > maxAmp) maxAmp = amp;
      meanAmp += amp;
    });
    meanAmp /= len;
    // console.log("meanAmp, maxAmp", meanAmp, maxAmp);
    // 以score均值代表幅值大小的分界阈值,再将均值到最值(最小0,最大max)映射红绿颜色的强弱, 或者自定义的阈值, 分类强度
    // 偏离均值越多, 在该分类上的强度越强
    // |score - mean|/|mean - min| 或 |score - mean|/|mean - max|
    // 即在amp上的显著度

    // =========================
    let meanFluc = 0;
    let maxFluc = -1;

    fluctuation.forEach((fluc: any) => {
      if (fluc > maxFluc) maxFluc = fluc;
      meanFluc += fluc;
    });
    meanFluc /= len;
    // console.log("meanFluc,maxFluc", meanFluc, maxFluc);

    // 在fluc上的显著度 <- score/max
    // ===========================

    const colorsOfFlows = [];

    // 防止可能的0值使得图形取白色隐形
    const scaleFinalSalient = d3.scaleLinear().domain([0, 1]).range([0.1, 0.55]);
    for (let i = 0; i < len; i++) {
      const amp = amplitude[i];
      const fluc = fluctuation[i];

      let saliAmp; // salience of amplitude
      let typeAmp; // 0: 低于均值,绿; 1: 高于均值,红
      if (amp < meanAmp) {
        typeAmp = 0;
        saliAmp = (meanAmp - amp) / meanAmp; // (mean - 0)
      } else {
        typeAmp = 1;
        saliAmp = (amp - meanAmp) / (maxAmp - meanAmp);
      }

      // 决定是幅值大小还是变化大小
      const saliFluc = fluc / maxFluc;

      let typeFinal; let saliFinal;
      // console.log("saliFluc,saliAmp", saliFluc, saliAmp);

      if (saliFluc > saliAmp) {
        typeFinal = 2;
        saliFinal = saliFluc;
      } else {
        typeFinal = typeAmp;
        saliFinal = saliAmp;
      }
      // console.log(saliFinal);
      saliFinal = scaleFinalSalient(saliFinal);
      colorsOfFlows.push(this.colorGradientAmpFluc[typeFinal](saliFinal));
    }
    return colorsOfFlows;
  }


  public renderDataStream() {
    // Some namespaces of the code has been updated to newer version of d3.js:
    // https://github.com/d3/d3/blob/main/CHANGES.md#time-formats-d3-time-format
    const margin = {
      top: 16,
      right: 24,
      bottom: 16,
      left: 36,
    };

    const widthContent = this.widthContainer - margin.left - margin.right;
    const heightContent = this.heightContainer - margin.top - margin.bottom;
    const heightAllGraphs = heightContent - 25;

    const leftTextPosX = 12;

    const graphHeight = heightAllGraphs / this.dataStream.length; // 每行 line chart 的高度
    const middle = graphHeight / 2;

    const x = d3.scaleLinear()
        .domain([0, this.dataStream[0].length - 1])
        .range([0, widthContent]);

    const y = d3.scaleLinear()
        // .domain([255, 0])
        .domain([this.options.domainBoundLow || 0, this.options.domainBoundHigh || 10])
        .range([graphHeight, 0]);

    const xDate = d3.scaleTime()
        .range([0, widthContent]);

    const xDateAxis = d3.axisBottom(xDate);

    console.log(this.dateData);
    if (this.dateData.length <= 12) {
      xDateAxis.ticks(d3.timeHours);
    } else if (this.dateData.length > 12 && this.dateData.length < 305) {
      xDateAxis.tickFormat(d3.timeFormat('%y-%m-%d'));
    } else {
      xDateAxis.ticks(d3.timeWeeks);
    }

    xDate.domain(d3.extent(this.dateData, (d) => d.date));

    const colors = this.getColorsOfFlows();

    // 在宽度上和right_content一致,在高度上使用margin
    const svg = this.container_d3.append('svg')
        .attr('width', this.widthContainer)
        .attr('height', heightContent)
        .attr('transform', `translate(0,${margin.top})`)
        .style('position', 'absolute');

    const gCharts = svg.append('g')
        .attr('width', this.widthContainer - margin.left)
        .attr('height', heightAllGraphs)
        .attr('transform', `translate(${margin.left},0)`);

    gCharts.selectAll('g').data(this.dataStream)
        .enter().append('g')
        .attr('width', widthContent)
        .attr('height', graphHeight)
        .attr('transform', (d: any, i: any) => `translate(0,${graphHeight * i})`)
        .each(function(d: any, i: any) {
          d3.select(this).selectAll('path.area')
              .data([d]).enter().append('path')
              .attr('class', 'path')
              .attr('opacity', 0.8)
              .style('fill', colors[i])
              .attr('d', d3.area()
              // Original: .interpolate('bundle')
                  .curve(d3.curveBasis)
                  .x((e, j) => x(j))
                  .y0((e: any ) => middle + y(e))
                  .y1((e: any) => middle - y(e)),
              );
        });

    // Date Axis
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(${margin.left}, ${heightContent - margin.bottom - 5})`)
        .call(xDateAxis);

    // Left Text and Circle, index of data points
    const gLeftCircles = svg.append('g');
    const leftCircles = gLeftCircles.selectAll('.circle')
        .data(this.dataStream)
        .enter()
        .append('circle')
        .attr('class', 'circle')
        .attr('transform', function(d: any, i: number) {
          const deltaX = leftTextPosX;
          const deltaY = i * graphHeight + graphHeight / 2 + 2;
          return 'translate(' + deltaX + ',' + deltaY + ')';
        })
        .attr('r', this.gBottomCircleSize)
        .style('fill', 'grey')
        .style('fill-opacity', '1');

    const gLeftTexts = svg.append('g');
    const leftTexts = gLeftTexts.selectAll('.text')
        .data(this.dataStream)
        .enter()
        .append('text')
        .attr('transform', function(d: any, i: number) {
          let deltaX = leftTextPosX - 3;

          if ((i + 1) > 9 && (i + 1) < 20) {
            deltaX = deltaX - 3;
          } else if ((i + 1) >= 20) {
            deltaX = deltaX - 4;
          }

          const deltaY = i * graphHeight + graphHeight / 2 + 6;
          return 'translate(' + deltaX + ',' + deltaY + ')';
        })
        .text(function(d: any, i: number) {
          return i + 1;
        })
        .attr('fill', 'white')
        .attr('font-size', '12px')
        .attr('font-family', 'Roboto');

    const hoverLine = gCharts.append('line')
        .attr('class', 'hoverLine')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 0)
        .attr('y2', heightContent);

    const tooltip = this.container_d3.append('div')
        .attr('class', 'tooltip')
        .style('visibility', 'hidden');

    // 先 生成并添加一次以获得tooltip需要的高度
    // TODO: 相对父元素计算tooltip的偏移; 直接计算tooltip高度; 改进tooltip样式
    let tooltipText = '<div class="tooltipID">1</div>' + this.dataStream[0][0].toString();
    for (let i = 1; i < this.dataStream.length; i++) {
      tooltipText += (`</br><div class="tooltipID">${i + 1}</div>` + this.dataStream[i][0].toString());
    }
    tooltip.html(tooltipText);

    const svgMinX = this.container_jq.offsetLeft;
    const svgMinY = this.container_jq.offsetTop + margin.top;
    const svgMaxX = svgMinX + parseInt(svg.attr('width'));
    const svgMaxY = svgMinY + parseInt(svg.attr('height'));
    const limitMaxTooltipTarX = svgMaxX - 140;
    const limitMaxTooltipTarY = svgMaxY - tooltip.node().clientHeight;
    const limitOffsetTooltipX = tooltip.node().clientWidth + 150;
    const limitOffsetTooltipY = tooltip.node().clientHeight + 300;

    let mouseX; let chartX; let tooltipTarX; let tooltipTarY;
    const ds = this.dataStream;
    svg
        .on('mousemove', (event: any) => {
          mouseX = d3.pointer(event)[0];
          if (mouseX < 0 || mouseX > widthContent) {
            return false;
          }
          chartX = parseInt(String(x.invert(mouseX)));
          tooltipText = '<div class="tooltipID">1</div>' + ds[0][chartX].toString();
          for (let i = 1; i < this.dataStream.length; i++) {
            tooltipText += (`</br><div class="tooltipID">${i + 1}</div>` + ds[i][chartX].toString());
          }

          hoverLine.attr('x1', mouseX + 'px')
              .attr('x2', mouseX + 'px');
          tooltipTarX = event.pageX;
          tooltipTarY = event.pageY;
          if (tooltipTarX > limitMaxTooltipTarX) {
            tooltipTarX = event.pageX - limitOffsetTooltipX;
          }
          if (tooltipTarY > limitMaxTooltipTarY) {
            tooltipTarY = event.pageY - limitOffsetTooltipY;
          }

          tooltip.transition()
              .duration(50)
              .style('left', tooltipTarX + 'px')
              .style('top', tooltipTarY + 'px');
          // tooltip.style('left', d3.event.pageX + 'px')
          // tooltip.style('top', d3.event.pageY + 'px')
          tooltip.html(tooltipText);
        })
        .on('mouseover', () => {
          hoverLine.style('stroke-width', '1px');
          tooltip.style('visibility', 'visible');
        })
        .on('mouseleave', () => {
          hoverLine.style('stroke-width', '0');
          tooltip.style('visibility', 'hidden');
        });
  }
}
