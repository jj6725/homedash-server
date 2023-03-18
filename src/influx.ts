import { InfluxDB } from '@influxdata/influxdb-client'

type RawDataRow = {
  result: string
  table: number
  _start: string
  _stop: string
  _time: string
  _value: number
  _field: string
  _measurement: string
  url: string
}

export enum Measurement {
  Temperature = 'temp',
  Humidity = 'humidity',
  Gas = 'gas',
  Lux = 'lux',
  Pressure = 'pressure',
  VOC = 'voc_index',
  AQ_pm03 = 'air_quality_pm03',
  AQ_pm05 = 'air_quality_pm05',
  AQ_pm10 = 'air_quality_pm10',
  AQ_pm25 = 'air_quality_pm100',
  AQ_pm50 = 'air_quality_pm25',
  AQ_pm100 = 'air_quality_pm50',
  Unknown = ' default',
}

type SingleValue = {
  server: string
  value: number
}

type MeasurementMap = {
  [index: string]: SingleValue[]
}

// index is date
type ParsedResult = {
  [index: string]: MeasurementMap
}

const token = ''
const queryApi = new InfluxDB({ url: 'http://pihome:8086', token }).getQueryApi('pihome')
const fluxQueryBase =
  'from(bucket: "homedata") |> range(start: -48h) |> filter(fn: (r) => r["_measurement"] == "pi-sensors")'
const fluxQueryAggregate = ' |> aggregateWindow(every: 1h, fn: mean, createEmpty: false) |> yield(name: "mean")'

function generateQuery(measurements: Measurement[]): string {
  const fields = measurements.map((m) => `r["_field"] == "${m}"`)
  const fluxQueryFields = `|> filter(fn: (r) => ${fields.join(' or ')} )`
  return fluxQueryBase + fluxQueryFields + fluxQueryAggregate
}

export async function getData(measurements: Measurement[]): Promise<ParsedResult> {
  const query = generateQuery(measurements)
  console.log('Running query: ' + query)
  const data = await queryApi.collectRows<RawDataRow>(query)

  const dates = data.map((row) => row._time)
  const uniqueDates = [...new Set(dates)]

  const result: ParsedResult = {}
  uniqueDates.forEach((date) => {
    const mMap: MeasurementMap = {}
    measurements.forEach((field) => {
      mMap[field] = data
        .filter((r) => r._time === date)
        .filter((r) => r._field === field)
        .map((r) => {
          return {
            server: new URL(r.url).hostname,
            value: r._value,
          }
        })
    })
    result[date] = mMap
  })

  return result
}
