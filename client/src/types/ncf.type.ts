/* eslint-disable camelcase */
// `time` ?
export type IDimensionType = 'longitude' | 'latitude' | 'depth' | 'datetime' | 'time';

export interface INCFDimension {
    dimension_units: string;
    dimension_length: number;
    dimension_name: string;
    dimension_type: IDimensionType;
    dimension_values: any[];
}

export interface INCFVariable {
    variable_dimensions: string[];
    variable_name: string;
    variable_units: string;
    variable_longname: string;
}

export interface INCFContentFile {
    file_size: number;
    file_name: string;
    datetime: number | string;
    datetime_start: number| string;
    depth: number | string;
    longitude_start: number | string;
    latitude_start: number | string;
    latitude_end: number | string;
    label: string;
    min_value: number;
    max_value: number;
    file: string;
}
