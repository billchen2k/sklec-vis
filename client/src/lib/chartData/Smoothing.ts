import savitzkyGolay, {Options as SGOptions} from 'ml-savitzky-golay';

/**
 * ma: Moving Average
 * ema: Exponential Moving Average
 * sg: Savitzky-Golay
 */
export type SmoothingType = 'none' | 'ma' | 'ema' | 'sg';
export interface SmoothingOptions {
  factor?: number;
  windowSize?: number;
  polynomialOrder?: number;
}


export class Smoothing {
  private _data: number[];
  private _smoothedData: number[];
  private _smoothingFactor: number;
  private _smoothingType: SmoothingType;
  private _smoothingWindow: number;
  private _polynomialOrder: number;

  constructor(data: number[], smoothingType: SmoothingType, options: SmoothingOptions = {}) {
    this._data = data;
    this.smoothingType = smoothingType;
    this.smoothingFactor = options.factor || 0.5;
    this.smoothingWindow = options.windowSize || 3;
    this.polynomialOrder = options.polynomialOrder || 3;
    this._smoothedData = [];
  }

  public get polynomialOrder(): number {
    return this._polynomialOrder;
  }

  public set polynomialOrder(value: number) {
    this._polynomialOrder = value;
  }

  public get smoothedData(): number[] {
    return this._smoothedData;
  }

  public get smoothingFactor(): number {
    return this._smoothingFactor;
  }

  public get smoothingType(): SmoothingType {
    return this._smoothingType;
  }

  public get smoothingWindow(): number {
    return this._smoothingWindow;
  }

  public get data(): number[] {
    return this._data;
  }

  public set smoothingFactor(value: number) {
    this._smoothingFactor = value;
  }

  public set smoothingType(value: SmoothingType) {
    this._smoothingType = value;
  }

  public set smoothingWindow(value: number) {
    if (value < 1) {
      throw new Error('Smoothing window size must be greater than 1');
    }
    if (value % 2 === 0) {
      console.warn('Smoothing window size must be odd number.');
      value += 1;
    }
    if (value > this._data.length) {
      throw new Error('Smoothing window size must be less than data length');
    }
    this._smoothingWindow = value;
  }

  public set data(value: number[]) {
    this._data = value;
  }

  public smooth(): number[] {
    if (this._smoothingType === 'ma') {
      this._smoothedData = this._movingAverage();
    } else if (this._smoothingType === 'ema') {
      this._smoothedData = this._exponentialSmoothing();
    } else if (this._smoothingType === 'sg') {
      this._smoothedData = this._savitzkyGolay();
    } else {
      this._smoothedData = this._data;
    }
    return this._smoothedData;
  }

  private _movingAverage(): number[] {
    const smoothedData: number[] = [];
    for (let i = 0; i < this._data.length; i++) {
      let sum = 0;
      for (let j = 0; j < this._smoothingWindow; j++) {
        const index = i - j;
        if (index >= 0) {
          sum += this._data[index];
        } else {
          // Padding with initial data.
          sum += this._data[0];
        }
      }
      smoothedData.push(sum / this._smoothingWindow);
    }
    return smoothedData;
  }

  private _exponentialSmoothing(): number[] {
    const smoothedData: number[] = [];
    const alpha = this._smoothingFactor;
    const beta = 1 - alpha;
    const initialValue = this._data[0];
    smoothedData.push(initialValue);
    for (let i = 1; i < this._data.length; i++) {
      const currentValue = this._data[i];
      const smoothedValue = alpha * currentValue + beta * smoothedData[i - 1];
      smoothedData.push(smoothedValue);
    }
    return smoothedData;
  }

  /**
   * Reference https://github.com/mljs/savitzky-golay/blob/6d9c4ca/src/index.ts
   * @private
   */
  private _savitzkyGolay(): number[] {
    const sgOptions: SGOptions = {
      derivative: 0,
      pad: 'pre',
      padValue: 'replicate',
      polynomial: this._polynomialOrder,
      windowSize: this._smoothingWindow,
    };
    const smoothedData: number[] = savitzkyGolay(this._data, 1, sgOptions);
    return smoothedData;
  }
}
