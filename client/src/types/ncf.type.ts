/* eslint-disable camelcase */
export type IDimensionType = 'longitude' | 'latitude' | 'depth' | 'time'

export interface INCFDimesion {
    dimension_length: number;
    dimension_name: string;
    dimension_type: IDimensionType;
}

export interface INCFVariable {
    variable_dimensions: string[];
    variable_name: string;
    variable_units: string;
}
