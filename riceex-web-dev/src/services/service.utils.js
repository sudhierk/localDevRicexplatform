// var countries = require("i18n-iso-countries");
// countries.registerLocale(require("i18n-iso-countries/langs/en.json"));
import tz from 'timezonelist-js';

const countries = require('simple-iso-countries');
const ports = require('sea-ports');
const cities = {};

export const getPortCountryName = country => {
    switch (country) {
        case 'Vietnam':
            return 'Viet Nam';
        case 'Russia':
            return 'Russian Federation';
        default:
            return country;
    }
};

export const getPortsByCountry = country => {
    if (country !== '') {
        let arrayOfPorts = [];
        const seaPorts = EnumsService.ports.JSON;

        Object.keys(seaPorts).map(i => {
            arrayOfPorts.push({
                [i]: seaPorts[i]
            });
        });

        const countryName = getPortCountryName(EnumsService.countries()[country]);
        let filteredPorts = arrayOfPorts.filter(port => {
            return port[Object.keys(port)[0]].country === countryName;
        });

        let result = {};

        filteredPorts.map(i => {
            result[i[Object.keys(i)[0]].name] = i[Object.keys(i)[0]].name;
        });

        let orderedResult = {};

        Object.keys(result)
            .sort((a, b) => {
                if (a < b) {
                    return -1;
                }
                if (a > b) {
                    return 1;
                }
                return 0;
            })
            .forEach(key => {
                orderedResult[key] = result[key];
            });

        return orderedResult;
    } else {
        return {};
    }
};

export const EnumsService = {
    years: (min, max) => {
        let res = {};
        if (max > min) {
            let i = min;
            while (i < max) {
                i++;
                res[i] = i;
            }
        }
        return res;
    },
    yearsFrom: (from, count) => EnumsService.years(from, from + count),
    yearsTo: (to, count) => EnumsService.years(to - count, to),
    countries: () => {
        let arrayOfCountries = [];
        Object.keys(countries).map(i => {
            arrayOfCountries.push({
                [i]: countries[i]
            });
        });
        arrayOfCountries.sort(function (a, b) {
            if (a[Object.keys(a)[0]].toUpperCase() < b[Object.keys(b)[0]].toUpperCase()) {
                return -1;
            }
            if (a[Object.keys(a)[0]].toUpperCase() > b[Object.keys(b)[0]].toUpperCase()) {
                return 1;
            }
            // names must be equal
            return 0;
        });
        let result = {};

        arrayOfCountries.map(i => {
            result[Object.keys(i)[0]] = i[Object.keys(i)[0]];
        });

        return result;
    },
    cities: () => [
        {country: 'BY', name: 'Minsk'},
        {country: 'US', name: 'Washington'},
        {country: 'KH', name: 'Phnom Penh'},
        {country: 'TH', name: 'Bangkok'},
        {country: 'VN', name: 'Hanoi'},
        {country: 'MM', name: 'Naypyidaw'},
        {country: 'IN', name: 'New Delhi'},
        {country: 'PK', name: 'Islamabad'},
        {country: 'CN', name: 'Peking'},
        {country: 'ES', name: 'Madrid'},
        {country: 'FR', name: 'Paris'},
        {country: 'GR', name: 'Athens'},
        {country: 'IT', name: 'Rome'},
        {country: 'EG', name: 'Cairo'},
        {country: 'BR', name: 'Brasília'},
        {country: 'GY', name: 'Georgetown'},
        {country: 'UY', name: 'Montevideo'},
        {country: 'PY', name: 'Asunción'},
        {country: 'SR', name: 'Paramaribo'},
        {country: 'AR', name: 'Buenos Aires'}
    ],
    ports: ports,
    timezones: tz
};

export const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
};

export const getPropertyByPath = (propertyName, object) => {
    let parts = propertyName.split( "." ),
        length = parts.length,
        i,
        property = object || this;
    if (!parts) {
        return null;
    }

    for ( i = 0; i < length; i++ ) {
        if (!property) {
            return property;
        }
        property = property[parts[i]];
    }

    return property;
};
