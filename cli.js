#!/usr/bin/env node

import camelcase from "camelcase";
import {
  blue,
  bold,
  cyan,
  dim,
  green,
  italic,
  options as colors,
  red,
  reset,
} from "colorette";
import decamelize from "decamelize";
import "dotenv/config.js";
import { basename } from "path";
import { resolve } from "url";
import { inspect } from "util";
import yargsParser from "yargs-parser";
import Client from "./client.js";

main().catch((reason) => {
  process.exitCode = 1;
  console.error(formatError(reason));
  process.exit();
});

async function main() {
  const { _, ...params } = yargsParser(process.argv.slice(2));
  if (_.length === 0 || _.includes("help") || params.h || params.help) {
    return console.error(formatHelp());
  }

  const operation = camelcase(_.join("-"), { pascalCase: true });
  if (!Client.isOperationName(operation)) {
    throw new TypeError(`Unknown operation ${bold(operation)}`);
  }

  const accessToken = process.env.LDB_TOKEN;
  if (!accessToken) {
    throw new TypeError(
      `LDB_TOKEN required. Register at ${resolve(
        Client.origin,
        "/OpenLDBWSRegistration/",
      )}`,
    );
  }

  const client = new Client({ accessToken });
  const data = await client.request(operation, params);

  console.log(formatData(data));
}

/** @type {typeof String.raw} */
function command(...args) {
  return `${blue(basename(process.argv[1]))} ${cyan(String.raw(...args))}`;
}

/** @type {typeof String.raw} */
function comment(...args) {
  return dim(italic(`# ${String.raw(...args)}`));
}

/** @type {typeof String.raw} */
function item(...args) {
  return `${dim("-")} ${String.raw(...args)}`;
}

function formatHelp() {
  return `Read the National Rail Live Departure Boards from the command line.

${bold("USAGE")}
  ${command`${italic("<operation>")} ${italic("[parameters...]")}`}

${bold("OPERATIONS")}
  ${Client.operationNames()
    .map((operation) => item`${cyan(decamelize(operation, " "))}`)
    .join("\n  ")}

${bold("EXAMPLES")}
  ${comment`Show trains from Edinburgh to Glasgow departing between 30 and 60 minutes from now`}
  ${command`next departures --crs EDB --filter-list.crs GLQ --filter-list.crs GLC --time-offset 30 --time-window 30`}

  ${comment`Show one departure from London Euston to Edinburgh`}
  ${command`departures details --crs EUS --filter-crs EDB --filter-type to --num-rows 1`}

  ${comment`Show detailed information about a service ID obtained from a previous request`}
  ${command`service --serviceID ${italic("L8rW0bMonHt3K4IengVPQw==")}`}

  ${comment`Show arrivals at Edinburgh and summarise with https://stedolan.github.io/jq/`}
  ${command`arrivals --crs EDB ${reset("|")} ${blue(
    "jq",
  )} ${green(`'.GetStationBoardResult | {
    destination: .locationName,
    services: [.trainServices.service | .[] | {
      scheduled: .sta,
      expected: .eta,
      from: .origin.location.locationName
    }]
  }'`)}`}

  ${comment`Use an alternative token obtained from https://realtime.nationalrail.co.uk/OpenLDBWSRegistration/`}
  ${cyan(
    `LDB_TOKEN=${italic("0f7d3515-9429-4af4-accb-372ee8a80a40")}`,
  )} ${command`arrivals --crs EDB`}

${bold("NOTES")}
  ${item`Operations may be specified as either ${italic(
    "PascalCase",
  )} or separate words.`}
  ${item`Parameters may be specified as either ${italic(
    "camelCase",
  )} or ${italic("kebab-case")}.`}
  ${item`Output is pretty printed to the console or printed as JSON when piped.`}

${bold("SEE ALSO")}
  ${item`${resolve(Client.origin, "/OpenLDBWS/wsdl.aspx")}`}
  ${item`${resolve(Client.origin, "/OpenLDBWS/rtti_2017-10-01_ldb.wsdl")}`}
`;
}

/**
 * @param {unknown} error
 */
function formatError(error) {
  const { name, message, stack } = Object(error);
  return `${red(`${bold(`${name}:`)} ${message}`)}${dim(
    italic(stack?.replace(/^.*/, "") || ""),
  )}
${bold("Hint:")} Try ${command`--help`}.`;
}

/**
 * @param {unknown} data
 */
function formatData(data) {
  if (process.stdout.isTTY) {
    return inspect(data, {
      colors: colors.enabled,
      compact: true,
      depth: null,
    });
  } else {
    return JSON.stringify(data);
  }
}
