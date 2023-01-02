#!/usr/bin/env node

import fs from 'fs';
import split from 'split2';
import through from 'through2';
import Pbf from 'pbf';

const fields = [
    'geonameId',
    'name',
    'asciiName',
    'alternateNames',
    'latitude',
    'longitude',
    'featureClass',
    'featureCode',
    'countryCode',
    'cc2',
    'admin1Code',
    'admin2Code',
    'admin3Code',
    'admin4Code',
    'population',
    'elevation',
    'dem',
    'timezone',
    'modificationDate'
] as const;

type fieldValues = {
    [K in typeof fields[any]]: any
}

let pbf = new Pbf()

let lastLat = 0
let lastLon = 0
let rowStream = through(function (line, enc, next) {
    let row = line.toString().split('\t').reduce(function (acc: any, x: any, ix: number) {
        let key = fields[ix]


        if (key === 'alternateNames') x = x.split(',')
        if (key === 'latitude' || key === 'longitude') x = parseFloat(x)
        if (key === 'longitude') x = x ? parseInt(x, 10) : undefined
        if (key === 'population') x = x ? parseInt(x, 10) : undefined

        acc[key] = x
        return acc
    }, {})
    if (!row.geonameId) return

    pbf.writeRawMessage(writeCity, row)
    next()
})



function writeCity(city: fieldValues, pbf: any) {
    pbf.writeSVarintField(1, city.geonameId)
    pbf.writeStringField(2, city.name)
    pbf.writeStringField(3, city.countryCode)

    if (city.alternateNames && city.alternateNames !== city.countryCode)
        pbf.writeStringField(4, city.alternateNames)

    if (city.admin3Code)
        pbf.writeStringField(5, city.admin3Code)

    if (city.admin4Code)
        pbf.writeStringField(6, city.admin4Code)

    pbf.writeStringField(7, city.featureCode)
    pbf.writeStringField(8, city.admin1Code)

    if (city.population)
        pbf.writeVarintField(9, city.population)

    const lat = Math.round(1e5 * city.latitude)
    const lon = Math.round(1e5 * city.longitude)
    pbf.writeSVarintField(10, lon - lastLon)
    pbf.writeSVarintField(11, lat - lastLat)

    lastLat = lat
    lastLon = lon
}

fs.createReadStream("cities1000.txt")
    .pipe(split())
    .pipe(rowStream)

rowStream.on('finish', function () {
    process.stdout.write(Buffer.from(pbf.finish()))
})
