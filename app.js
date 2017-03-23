'use strict'
const mapquestGeocodeURL = 'https://www.mapquestapi.com/geocoding/v1/address'
const mapquestReverseGeocodeURL = 'https://www.mapquestapi.com/geocoding/v1/reverse'

const reekoh = require('reekoh')
const _plugin = new reekoh.plugins.Service()

const domain = require('domain')
const request = require('request')
const _get = require('lodash.get')
const _isNaN = require('lodash.isnan')
const inRange = require('lodash.inrange')
const isNumber = require('lodash.isnumber')
const isString = require('lodash.isstring')

let apiKey = null
let geocodingType = null

_plugin.on('data', (data) => {
  if (geocodingType === 'Forward') {
    if (!isString(data.address)) { return _plugin.logException(new Error('Invalid address.')) }

    request.get({
      url: mapquestGeocodeURL,
      qs: {
        key: apiKey,
        location: data.address
      }
    }, (reqError, response, body) => {
      if (reqError) {
        _plugin.logException(reqError)
      } else if (response.statusCode !== 200) {
        _plugin.logException(new Error(response.statusMessage))
      } else {
        let d = domain.create()

        d.once('error', () => {
          console.error(reqError)
          _plugin.logException(new Error('Invalid response from Mapquest Service. Response: ' + body))
          d.exit()
        })

        d.run(() => {
          let result = JSON.parse(body)
          result = JSON.stringify(_get(result, 'results[0].locations[0].latLng'))

          _plugin.pipe(data, result)
            .then(() => {
              _plugin.log(JSON.stringify({
                title: 'Mapquest Geocoding Service Result',
                data: {
                  data: data
                },
                result: result
              }))
            })
            .catch((error) => {
              _plugin.logException(error)
            })
          console.log(data, result)
          d.exit()
        })
      }
    })
  } else {
    if (_isNaN(data.lat) || !isNumber(data.lat) || !inRange(data.lat, -90, 90) ||
      _isNaN(data.lng) || !isNumber(data.lng) || !inRange(data.lng, -180, 180)) {
      _plugin.logException(new Error('Latitude (lat) and Longitude (lng) are not valid. lat: ' + data.lat + ' lng:' + data.lng))
    } else {
      request.get({
        url: mapquestReverseGeocodeURL,
        qs: {
          key: apiKey,
          location: data.lat + ',' + data.lng
        }
      }, (reqError, response, body) => {
        if (reqError) {
          _plugin.logException(reqError)
        } else if (response.statusCode !== 200) {
          _plugin.logException(new Error(response.statusMessage))
        } else {
          let d = domain.create()

          d.once('error', () => {
            console.error(reqError)
            _plugin.logException(new Error('Invalid response from Mapquest Service. Response: ' + body))
            d.exit()
          })

          d.run(() => {
            console.log(body)
            let result = _get(JSON.parse(body), 'results[0].locations[0]')

            console.log(result)

            delete result.latLng
            delete result.displayLatLng
            delete result.unknownInput
            delete result.mapUrl

            _plugin.pipe(data, result)
              .then(() => {
                _plugin.log(JSON.stringify({
                  title: 'Mapquest Geocoding Service Result',
                  data: {
                    lat: data.lat,
                    lng: data.lng
                  },
                  result: result
                }))
              })
              .catch((error) => {
                _plugin.logException(error)
              })
          })
        }
      })
    }
  }
})

/**
 * Emitted when the platform bootstraps the plugin. The plugin should listen once and execute its init process.
 */
_plugin.once('ready', () => {
  apiKey = _plugin.config.apiKey
  geocodingType = _plugin.config.geocodingType || _plugin.config.geocodingType.default

  _plugin.log('MapQuest Geocoding Service Initialized.')
  _plugin.emit('init')
})

module.exports = _plugin
