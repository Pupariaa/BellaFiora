const axios = require('axios');
const conf = require('./priv/credentials');
const system = require('./System');
const Gv2 = require('./priv/Gv2');

/**
 * Base class providing network communication setup.
 */
class NetAnchor {
    constructor(isTest = true) {
        this.isTest = isTest
        this.bellafiora_ns1 = "http://176.129.52.85:25588/";
        this.bellafiora_ns2 = "http://176.129.52.85:25589/";
        this.osu_api_v1_ns1 = "https://osu.ppy.sh/api/";
        this.osu_api_v1_ns2 = "http://176.129.52.85:65784/api/";
        this.maxAttempts = 7;
        !isTest ? this.conf = new conf() : null
        this.Gv2 = new Gv2();
        this.System = new system();
        this.header = {
            'X-Device-Info': JSON.stringify(this.System.SystemInfo()),
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': `BellaFioraDesktop/${this.isTest ? 'FG48N4Z' : this.conf.getConf('client_version')} (compatible; MSIE 6.0; Windows NT 5.1)`,
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Content-Security-Policy': "default-src 'self'"
        };
    }

    /**
     * Generic request function to perform HTTP GET requests.
     * @param {string} url - The URL to which the request is sent.
     * @param {Object} options - The configuration options for the request including headers and parameters.
     * @returns {Promise<Object>} The response from the server.
     */
    async request(url, options) {
        try {
            const response = await axios.get(url, options);
            return response;
        } catch (error) {
            throw error;
        }
    }
}

/**
 * Login class for handling login procedures.
 */
class Login extends NetAnchor {
    constructor(isTest) {
        super(isTest);
        this.route = "/client/private/login";
    }

    /**
     * Tries to log in by sending requests to predefined server URLs.
     * @returns {Promise<Object>} Result object indicating success or failure.
     */
    async try() {
        const servers = [`${this.bellafiora_ns1}${this.route}`, `${this.bellafiora_ns2}${this.route}`];
        const params = {
            FGsystem: this.System.SystemInfo(),
            client_id: this.isTest ? 'FG48N4Z' : this.conf.getConf("client_id"),
            ip_address: this.isTest ? '192.168.1.20' : this.conf.getConf('client_ip'),
            client_version: this.isTest ? '0.1.992' : this.conf.getConf('client_version'),
            user_id: this.isTest ? '123456789' : this.conf.getConf('user_id'),
            osu_token: this.isTest ? 'eYA1B2C3' : this.conf.getConf('osu_token'),
            register_timestamp: this.isTest ? '1716434309' : this.conf.getConf('ts_register'),
        };
        this.header['Authorization'] = `Bearer ${this.Gv2.SysCallerToken()}`;
        this.header['X-Signature'] = this.Gv2.Signature(params);
        this.header['X-Correlation-ID'] = this.Gv2.RequestUUID();
        this.header['X-Timestamp'] = new Date().toISOString();
        this.header['Client_ID'] = this.isTest ? 'FG48N4Z' : this.conf.getConf("client_id");
        const options = {
            params: params,
            headers: this.header
        };

        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            let serverIndex = (attempt - 1) % 2;
            try {
                const response = await this.request(servers[serverIndex], options);
                if (response.data === "done") {
                    return { stat: true };
                }
                return { stat: false, err: response.data };
            } catch (error) {
                if (attempt === this.maxAttempts) {
                    throw new Error("Max retry attempts reached, last error: " + error.message);
                }
            }
        }
    }
}

/**
 * Register class for handling registration procedures.
 */
class Register extends NetAnchor {
    constructor(isTest) {
        super(isTest);
        this.route = "/client/private/register";
    }

    /**
     * Tries to register by sending requests to predefined server URLs with enhanced security headers.
     * @returns {Promise<Object>} Result object indicating success or failure.
     */
    async try() {
        const servers = [`${this.bellafiora_ns1}${this.route}`, `${this.bellafiora_ns2}${this.route}`];
        const params = {
            system: this.System.SystemInfo(),
            client_id: this.isTest ? 'FG48N4Z' : this.conf.getConf("client_id"),
            ip_address: this.isTest ? '192.168.1.20' : this.conf.getConf('client_ip'),
            client_version:  this.isTest ? '0.1.992' : this.conf.getConf('client_version'),
            user_id: this.isTest ? '4787712' : this.conf.getConf('user_id'),
            osu_token: this.isTest ? 'eYA1B2C3' : this.conf.getConf('osu_token'),
            register_timestamp: this.isTest ? '1716434309' : this.conf.getConf('ts_register'),
        };
        this.header['Authorization'] = `Bearer ${this.Gv2.SysCallerToken()}`;
        this.header['X-Signature'] = this.Gv2.Signature(params);
        this.header['X-Correlation-ID'] = this.Gv2.RequestUUID();
        this.header['X-Timestamp'] = new Date().toISOString();
        this.header['Client_ID'] = this.isTest ? 'FG48N4Z' : this.conf.getConf("client_id");
        const options = {
            params: params,
            headers: this.header
        };

        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            let serverIndex = (attempt - 1) % 2;
            try {
                const response = await this.request(servers[serverIndex], options);
                if (response.data === "done") {
                    
                    return { stat: true };
                }
                
                return { stat: false, err: response.data };
            } catch (error) {
               
                if (attempt === this.maxAttempts) {
                    
                }
            }
        }
    }
}

/**
 * Log class for handling system log submissions.
 */
class Log extends NetAnchor {
    constructor(isTest) {
        super(isTest);
        this.route = "/client/private/logs";
    }

    /**
     * Sends a log entry to the server.
     * @param {Object} log - The log data to send.
     */
    async send(log) {
        this.header['Authorization'] = `Bearer ${this.Gv2.SysCallerToken()}`;
        this.header['X-Signature'] = this.Gv2.Signature(log);
        this.header['X-Correlation-ID'] = this.Gv2.RequestUUID();
        this.header['X-Timestamp'] = new Date().toISOString();
        this.header['Client_ID'] = this.isTest ? 'FG48N4Z' : this.conf.getConf("client_id");
        const options = {
            logs: log,
            headers: this.header
        };

        try {
            const response = await this.request(`${this.bellafiora_ns1}${this.route}`, options);
            
        } catch (error) {
            console.error('Error sending log data:', error);
        }cle
    }
}

module.exports = { Login, Register, Log, NetAnchor };