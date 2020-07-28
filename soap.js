import fetch from "node-fetch";
import xmlbuilder2 from "xmlbuilder2";

const { convert, fragment } = xmlbuilder2;

export class SoapRequest {
  /**
   * @param {string} url
   * @param {object} init
   * @param {Record<string, unknown>} init.header
   * @param {Record<string, unknown>} init.body
   */
  constructor(url, init) {
    this.method = "POST";
    this.url = url;
    this.headers = {
      "Content-Type": "application/soap+xml; charset=utf-8",
    };
    this.body = convert({
      "soap:Envelope": {
        "@xmlns:soap": "http://www.w3.org/2003/05/soap-envelope",
        "soap:Header": init.header,
        "soap:Body": init.body,
      },
    });
  }

  async execute() {
    return new SoapResponse(await fetch(this.url, this));
  }
}

class SoapResponse {
  /**
   * @param {import('node-fetch').Response} response
   */
  constructor(response) {
    this.response = response;
  }

  async unwrap() {
    const simplifiedXML = (await this.response.text())
      // remove namespaces
      .replace(/ xmlns(?::\w+)?="[^"]+"/g, "")
      // remove prefixes
      .replace(/(<\/?)\w+:/g, "$1");

    const { Envelope } = /** @type {any} */ (convert(simplifiedXML, {
      format: "object",
      noDoubleEncoding: true,
    }));

    if (SoapFault.isSoapFaultBody(Envelope.Body)) {
      throw new SoapFault(Envelope.Body);
    } else {
      return Envelope.Body;
    }
  }
}

/**
 * @typedef {object} SoapFaultBody
 * @property {object} Fault
 * @property {Record<string, unknown>} Fault.Code
 * @property {Record<string, unknown>} Fault.Reason
 */
class SoapFault extends Error {
  /**
   * @param {unknown} body
   * @returns {body is SoapFaultBody}
   */
  static isSoapFaultBody(body) {
    return typeof Object(body).Fault === "object";
  }

  name = "SoapFault";

  /**
   * @param {SoapFaultBody} body
   */
  constructor(body) {
    super(fragment(body.Fault.Reason).node.textContent ?? undefined);
    this.code = fragment(body.Fault.Code).node.textContent;
  }
}
