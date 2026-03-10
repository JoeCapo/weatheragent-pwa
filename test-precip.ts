import { extractPrecipType } from './src/services/api/nwsGridUtils';

console.log('Chance Light Rain', extractPrecipType('Chance Light Rain'));
console.log('Partly Cloudy', extractPrecipType('Partly Cloudy'));
console.log('Slight Chance Light Rain', extractPrecipType('Slight Chance Light Rain'));
console.log('Mostly Sunny', extractPrecipType('Mostly Sunny'));
