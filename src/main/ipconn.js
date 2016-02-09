// author arcseldon@icloud.com
'use strict';

/***************************************************
 * Webtask expects to receive requests containing IP
 * address request param. Does a lookup for a matching
 * connection based on IP against self-contained IP
 * to Connection mapping.
 ***************************************************/

const R = require('ramda'),
  ipUtils = require('ipaddr.js'),

  unknownConn = {connection: 'unknown'},

  extractTuples = R.compose(R.map(R.split(',')), R.split('|')),

  getConfig = R.map((item) => {
    return {cidr: ipUtils.parseCIDR(item[0]), conn: {connection: item[1]}};
  }),

  ipv4CidrFilter = (item) => {
    return !R.contains(':', item.cidr.toString());
  },

  buildTree = (pair) => {
    return {ipv4: pair[0], ipv6: pair[1]};
  },

  configByIpType = R.compose(buildTree, R.partition(ipv4CidrFilter), getConfig, extractTuples),

  getConn = R.curry(function (config, ip) {
    const result = R.find((ipConn) => ip.match(ipConn.cidr))(config);
    return result && result.conn || unknownConn;
  }),

  ipv4Type = (ip) => ip.kind() === 'ipv4';

module.exports = function (ctx, done) {
  try {

    // validate and parse IP param
    const ipParam = ctx.data.ip;
    console.log('ip param: ', ipParam);
    if (!ipUtils.isValid(ipParam)) {
      console.error(`Invalid ip parameter: ${ipParam}`);
      return done(`Error: invalid ip: ${ipParam}`);
    }
    const ip = ipUtils.parse(ipParam);
    console.log(`IP Address: ${ip}\n`);

    // create our lookup function to test if we have a matching connection
    const config = configByIpType(ctx.data.CONFIG);
    const lookup = R.ifElse(ipv4Type, getConn(config.ipv4), getConn(config.ipv6));

    // return result of lookup - matching connection name or unknown
    return done(null, lookup(ip));

  } catch (e) {
    return done(`Error: check logs, and try again: ${e}`);
  }

};
