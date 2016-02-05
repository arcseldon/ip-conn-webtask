// author arcseldon@icloud.com
'use strict';

/***************************************************
 * Test Data used in our Unit Tests - offers a chance
 * to seed mock data with values that should be retrieved
 *
 * >> Yes, bit of hack..
 ***************************************************/


const ipv4TestData = [
  {
    cidr: '83.29.4.2/16',
    connection: 'fabrikam-adfs'
  },
  {
    cidr: '99.2.4.28/32',
    connection: 'contoso-ping'
  },
  {
    cidr: '44.2.4.3/16',
    connection: 'ms-azuread'
  }
];

const ipv6TestData = [
  {
    "cidr": "200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40",
    "connection": "fabrikam-adfs-6"
  },
  {
    "cidr": "60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6/40",
    "connection": "contoso-ping-6"
  },
  {
    "cidr": "eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29/64",
    "connection": "ms-azuread-6"
  }
];

module.exports = {
  ipv4TestData,
  ipv6TestData
};
