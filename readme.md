# ldb-cli

Work-in-progress Live Departure Boards client.

## Installation

[Register for OpenLDBWS](https://realtime.nationalrail.co.uk/OpenLDBWSRegistration) and add the token to the environment as `LDB_TOKEN` (e.g., by putting it in a `.env` file in the current directory.) Then, install this package from GitHub using `npm`:

```shell
> npm i -g DavidJones418/ldb-cli
```

## Synopsis

```shell
> ldb-cli --help
Read the National Rail Live Departure Boards from the command line.

USAGE
  ldb-cli <operation> [parameters...]

OPERATIONS
  - arrivals
  - arrivals departures
  - arrivals departures details
  - arrivals details
  - departures
  - departures details
  - fastest departures
  - fastest departures details
  - next departures
  - next departures details
  - service

EXAMPLES
  # Show trains from Edinburgh to Glasgow departing between 30 and 60 minutes from now
  ldb-cli next departures --crs EDB --filter-list.crs GLQ --filter-list.crs GLC --time-offset 30 --time-window 30

  # Show one departure from London Euston to Edinburgh
  ldb-cli departures details --crs EUS --filter-crs EDB --filter-type to --num-rows 1

  # Show detailed information about a service ID obtained from a previous request
  ldb-cli service --serviceID L8rW0bMonHt3K4IengVPQw==

  # Show arrivals at Edinburgh and summarise with https://stedolan.github.io/jq/
  ldb-cli arrivals --crs EDB | jq '.GetStationBoardResult | {
    destination: .locationName,
    services: [.trainServices.service | .[] | {
      scheduled: .sta,
      expected: .eta,
      from: .origin.location.locationName
    }]
  }'

  # Use an alternative token obtained from https://realtime.nationalrail.co.uk/OpenLDBWSRegistration/
  LDB_TOKEN=0f7d3515-9429-4af4-accb-372ee8a80a40 ldb-cli arrivals --crs EDB

NOTES
  - Operations may be specified as either PascalCase or separate words.
  - Parameters may be specified as either camelCase or kebab-case.
  - Output is pretty printed to the console or printed as JSON when piped.

SEE ALSO
  - https://realtime.nationalrail.co.uk/OpenLDBWS/wsdl.aspx
  - https://realtime.nationalrail.co.uk/OpenLDBWS/rtti_2017-10-01_ldb.wsdl
```

## License

[MIT](license.md)
