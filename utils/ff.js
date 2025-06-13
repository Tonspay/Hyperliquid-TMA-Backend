const { createHmac } = require('crypto');
const { XMLParser } = require('fast-xml-parser');

const SLEEP_INTERVAL = 10000; //10 Second
const MAX_LOOP_TIMES = 180; //30 mins

class bridge {
  constructor(config) {
    this.config = config || {};
    this.router = {
      baseUrl: "https://ff.io",
      route: {
        price: "/rates/fixed.xml",
        bridge: "/api/v2/create",
        order: "/api/v2/order",
      },
    };
    if (this.config.baseUrl) {
      this.router.baseUrl = this.config.baseUrl;
    }
    this.price = null;
    this.bridge_info = null;
    this.origin_bridge_info = null;
    this.key = this.ran_key();
  }

  async get(url) {
    const requestOptions = {
      method: "GET",
      redirect: "follow",
    };
    const response = await fetch(url, requestOptions);
    return response.text();
  }

  async post(url, body = {}, headers = {}) {
    try {
      const requestOptions = {
        headers,
        method: "POST",
        redirect: "follow",
        body: JSON.stringify(body),
      };
      const response = await fetch(url, requestOptions);
      return response.json();
    } catch (e) {
      return false;
    }
  }

  ran_key() {
    const array = this.config.keys || [];
    const len = array.length;
    if (len === 0) {
      return undefined;
    }
    const idx = Math.floor(Math.random() * len);
    return array[idx];
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async init() {
    try {
      // Price init
      const xml = await this.get(this.router.baseUrl + this.router.route.price);
      // console.log(xml)
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
      });
      const parsed = parser.parse(xml);
      this.price = parsed.rates.item;
      return true;
    } catch (e) {
      // console.log(e)
      return false;
    }
  }

  sign(data, API_SECRET) {
    return createHmac("sha256", API_SECRET).update(data).digest("hex");
  }

  estimate(config = { from: "", to: "", amount: 0 }) {
    if (!this.price) {
      return 0;
    }
    for (const i in this.price) {
      const e = this.price[i];
      if (
        e.from === config.from.toUpperCase() &&
        e.to === config.to.toUpperCase()
      ) {
        return e;
        // If you need to return a fee calculation instead:
        // return e.tofee
        //   ? Number(config.amount) * e.out - Number(e.tofee.split(e.to)[0])
        //   : Number(config.amount) * e.out;
      }
    }
    return 0;
  }

  async bridge(config) {
    const {
      from,
      to,
      amount,
      toAddress,
      type = "float",
      refcode = "9jffbqvc",
      afftax = 0,
    } = config;

    try {
      const body = {
        type: type,
        fromCcy: from,
        toCcy: to,
        toAddress,
        direction: "from",
        amount: amount,
        refcode: refcode,
        afftax: afftax,
      };
      const k = this.key;
      const headers = new Headers();
      headers.append("Content-Type", "application/json");
      headers.append("X-API-KEY", k[0]);
      headers.append("X-API-SIGN", this.sign(JSON.stringify(body), k[1]));
      const response = await this.post(
        this.router.baseUrl + this.router.route.bridge,
        body,
        headers
      );
      this.bridge_info = response;
      this.origin_bridge_info = response;
      return response;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async bridge_status(_id, _token) {
    const id =
      _id ?? (this.bridge_info?.data ? this.bridge_info.data.id : false);
    const token =
      _token ?? (this.bridge_info?.data ? this.bridge_info.data.token : false);
    if (!id || !token) {
      return false;
    }
    const body = {
      id,
      token,
    };
    const k = this.key;
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("X-API-KEY", k[0]);
    headers.append("X-API-SIGN", this.sign(JSON.stringify(body), k[1]));
    const response = await this.post(
      this.router.baseUrl + this.router.route.order,
      body,
      headers
    );
    this.bridge_info = response;
    return response;
  }

  async bridge_confirm(_id, _token) {
    let loopTime = 0;
    while (true) {
      if (
        this.bridge_info &&
        this.bridge_info.data &&
        this.bridge_info.data.status === "DONE"
      ) {
        console.log(this.bridge_info)
        const ret = JSON.parse(
          JSON.stringify(this.bridge_info.data)
        )
        if(
          Number(this.origin_bridge_info.data.from.amount) <= Number(this.bridge_info.data.from.amount)
        )
        {
          ret["full_payment_make"] = true;
        }else{
          ret["full_payment_make"] = false;
        }
        return ret;
      }
      console.log(this.bridge_info)
      const id =
        _id ?? (this.bridge_info?.data ? this.bridge_info.data.id : false);
      const token =
        _token ??
        (this.bridge_info?.data ? this.bridge_info.data.token : false);
      if (!id || !token) {
        return false;
      }
      await this.bridge_status(id, token);
      await this.sleep(SLEEP_INTERVAL);
      if (loopTime >= MAX_LOOP_TIMES) {
        return false;
      }
      loopTime++;
    }
  }
}

module.exports = bridge;
