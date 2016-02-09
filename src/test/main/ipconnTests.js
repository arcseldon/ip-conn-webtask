// author arcseldon@icloud.com
'use strict';
/*eslint no-unused-expressions:0*/

const chai = require('chai'),
  expect = chai.expect,
  ipUtils = require('ipaddr.js'),
  testFixtures = require('../fixtures/testFixtures'),
  ipv4TestData = testFixtures.ipv4,
  ipv6TestData = testFixtures.ipv6,
  webtask = require('../../main/ipconn');

describe('ipconn', () => {

  describe('ipaddr.js third party module - usage patterns for validate, parse, and match', () => {

    // light smoke test to understand api and gain confidence

    it('should validate, parse and match', () => {

      const invalidIp = '192.168.1.257';
      expect(ipUtils.isValid(invalidIp)).to.be.false;

      const validIp = '192.168.1.1';
      expect(ipUtils.isValid(validIp)).to.be.true;

      const addr1 = ipUtils.parse('83.29.4.6');
      expect(addr1.match(ipUtils.parseCIDR('83.29.4.2/16'))).to.be.true;

      const addr2 = ipUtils.parse('83.29.16.6');
      expect(addr2.match(ipUtils.parseCIDR('83.29.4.2/16'))).to.be.true;

      const addr3 = ipUtils.parse('83.30.4.6');
      expect(addr3.match(ipUtils.parseCIDR('83.29.4.2/16'))).to.be.false;

      // try matching ipv5 address against an ipv6 CIDR.. throws Exception !!!
      const addr4 = ipUtils.parse('83.30.4.6');
      expect(function () {
        addr4.match(ipUtils.parseCIDR('200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40'));
      }).to.throw;
    });

  });


  describe('invalid ip input', () => {

    let ctx;

    beforeEach(function () {
      ctx = {data: {ip: ''}};
      ctx.data.CONFIG = '200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40,fabrikam-adfs-6|' +
        '60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6/40,contoso-ping-6|' +
        'eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29/64,ms-azuread-6';
    });

    it('should reject missing ip', () => {
      delete ctx.data.ip;
      webtask(ctx, function (err, data) {
        expect(err).to.exist;
        expect(data).to.not.exist;
      });
    });

    it('should reject any ip not adhering to IPv4 or IPv6 format', () => {
      // bear in mind we don't wish to retest third party lib so light test
      let invalid = [];
      /* eslint-disable */
      invalid.push('1111.222.333.444');  // incorrect format
      invalid.push('');  // empty
      invalid.push('adlskfjadkfj');  // incorrect text
      /* eslint-enable */
      invalid.forEach(function (ip) {
        ctx.data.ip = ip;
        webtask(ctx, function (err, data) {
          expect(err).to.exist;
          expect(data).to.not.exist;
        });
      });
    });

  });

  describe('no matching connections', () => {

    let ctx;

    beforeEach(function () {
      ctx = {data: {ip: ''}};
      ctx.data.CONFIG = '200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40,fabrikam-adfs-6|' +
        '60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6/40,contoso-ping-6|' +
        'eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29/64,ms-azuread-6';
    });

    const callbackWith = () => {
      return (err, data) => {
        if (err) {
          console.error(err);
        }
        expect(err).to.not.exist;
        expect(data.connection).to.equal('unknown');
      };
    };

    const callbackWithError = () => {
      return (err) => {
        expect(err).to.exist;
      };
    };

    it('should treat non-existent ipv6 as unknown connection', () => {
      ctx.data.ip = '2001:cdba::3257:9652';
      webtask(ctx, callbackWith());
    });

    it('should treat non-existent ipv4 as unknown connection', () => {
      ctx.data.ip = '83.35.4.6';
      webtask(ctx, callbackWithError());
    });
  });

  describe('matching connections with ipv4 addresses', function () {

    //this.timeout(4000);

    let ctx;

    beforeEach(function () {
      ctx = {data: {ip: ''}};
      ctx.data.CONFIG = '83.29.4.2/16,fabrikam-adfs|99.2.4.28/32,contoso-ping|44.2.4.3/16,ms-azuread';
    });

    const successCallbackWith = (name) => {
      return (err, data) => {
        if (err) {
          console.error(err);
        }
        expect(data).to.exist;
        console.log('Have data connection: ', data.connection);
        expect(data.connection).to.equal(name);
      };
    };

    // Fabrikam => 83.29.4.2/16 => Connection: fabrikam-adfs
    it('should match connection1', () => {
      ctx.data.ip = '83.29.4.6';
      webtask(ctx, successCallbackWith(ipv4TestData[0].connection));
    });

    // Contoso => 99.2.4.28/32 => Connection: contoso-ping
    it('should match connection2', () => {
      ctx.data.ip = '99.2.4.28';
      webtask(ctx, successCallbackWith(ipv4TestData[1].connection));
    });

    // Microsoft => 44.2.4.3/16 => Connection: ms-azuread
    it('should match connection3', () => {
      ctx.data.ip = '44.2.4.3';
      webtask(ctx, successCallbackWith(ipv4TestData[2].connection));
    });

  });


  describe('matching connections with ipv6 addresses', function () {

    //this.timeout(4000);

    let ctx;

    beforeEach(function () {
      ctx = {data: {ip: ''}};
      ctx.data.CONFIG = '200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40,fabrikam-adfs-6|' +
        '60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6/40,contoso-ping-6|' +
        'eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29/64,ms-azuread-6';
    });

    const successCallbackWith = (name) => {
      return (err, data) => {
        if (err) {
          console.error(err);
        }
        expect(data).to.exist;
        console.log('Have data connection: ', data.connection);
        expect(data.connection).to.equal(name);
      };
    };

    // Fabrikam => 200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40 => Connection: fabrikam-adfs-6
    it('should match connection1', () => {
      ctx.data.ip = '200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa';
      webtask(ctx, successCallbackWith(ipv6TestData[0].connection));
    });

    // Contoso => 60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6/40 => Connection: contoso-ping-6
    it('should match connection2', () => {
      ctx.data.ip = '60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6';
      webtask(ctx, successCallbackWith(ipv6TestData[1].connection));
    });

    // Microsoft => eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29/64 => Connection: ms-azuread-6
    it('should match connection3', () => {
      ctx.data.ip = 'eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29';
      webtask(ctx, successCallbackWith(ipv6TestData[2].connection));
    });

  });


  describe('matching connections with mixture of ipv4 and ipv6 addresses', function () {

    let ctx;

    beforeEach(function () {
      ctx = {data: {ip: ''}};
      ctx.data.CONFIG = '83.29.4.2/16,fabrikam-adfs|' +
        '60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6/40,contoso-ping-6|' +
        '99.2.4.28/32,contoso-ping|' +
        'eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29/64,ms-azuread-6';
    });

    const successCallbackWith = (name) => {
      return (err, data) => {
        if (err) {
          console.error(err);
        }
        expect(data).to.exist;
        console.log('Have data connection: ', data.connection);
        expect(data.connection).to.equal(name);
      };
    };

    // Fabrikam => 83.29.4.2/16 => Connection: fabrikam-adfs
    it('should match connection1', () => {
      ctx.data.ip = '83.29.4.6';
      webtask(ctx, successCallbackWith(ipv4TestData[0].connection));
    });

    // Contoso => 99.2.4.28/32 => Connection: contoso-ping
    it('should match connection2', () => {
      ctx.data.ip = '99.2.4.28';
      webtask(ctx, successCallbackWith(ipv4TestData[1].connection));
    });

    // Contoso => 60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6/40 => Connection: contoso-ping-6
    it('should match connection3', () => {
      ctx.data.ip = '60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6';
      webtask(ctx, successCallbackWith(ipv6TestData[1].connection));
    });

    // Microsoft => eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29/64 => Connection: ms-azuread-6
    it('should match connection4', () => {
      ctx.data.ip = 'eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29';
      webtask(ctx, successCallbackWith(ipv6TestData[2].connection));
    });

  });


});
