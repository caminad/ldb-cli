import Ajv from "ajv";
import { resolve } from "url";
import * as operations from "./operations.js";
import { SoapRequest } from "./soap.js";

export default class Client {
  static origin = "https://realtime.nationalrail.co.uk";

  /**
   * @param {unknown} obj
   * @returns {obj is keyof typeof operations}
   */
  static isOperationName(obj) {
    return typeof obj === "string" && obj in operations;
  }

  static operationNames() {
    return Object.keys(operations);
  }

  endpoint = resolve(Client.origin, "/OpenLDBWS/ldb11.asmx");

  ajv = new Ajv({
    removeAdditional: true,
    useDefaults: true,
    strictDefaults: true,
  });

  /**
   * @param {object} options
   * @param {string} options.accessToken
   */
  constructor({ accessToken }) {
    this.accessToken = accessToken;
  }

  /**
   * @param {keyof typeof operations} operation
   * @param {Record<string, unknown>} params
   */
  async request(operation, params) {
    const { requestName, requestSchema, responseName } = operations[operation];

    const validateParams = this.ajv.compile(requestSchema);
    if (!validateParams(params)) {
      if (validateParams.errors) {
        const { dataPath, message } = validateParams.errors[0];
        throw new TypeError(`params${dataPath} ${message}`);
      } else {
        throw new TypeError(`params validation failed`);
      }
    }

    const response = await new SoapRequest(this.endpoint, {
      header: {
        AccessToken: { TokenValue: this.accessToken },
      },
      body: {
        "@xmlns": "http://thalesgroup.com/RTTI/2017-10-01/ldb/",
        [requestName]: params,
      },
    }).execute();
    const { [responseName]: data } = await response.unwrap();

    return data;
  }
}
