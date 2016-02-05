// author arcseldon@icloud.com
'use strict';

/***************************************************
 * Create wt-cli command for given input csv mappings
 * Deploy automatically
 ***************************************************/

const fs = require('fs'),
  exec = require('child_process').exec,
  assert = require('assert'),
  ipUtils = require('ipaddr.js'),
  program = require('commander'),
  async = require('async'),
  R = require('ramda'),
  waterfall = async.waterfall,
  version = require('../../package.json').version;

program
  .version(version)
  .option('-n, --name [name]', 'The task name to register for webtask')
  .option('-d --deploy', 'Do deployment');

program.on('--help', function () {
  console.log('  Generates necessary wt-cli command line task for input mapping file');
  console.log('  Input file should be named mapping.csv in the current directory.');
  console.log('  Format, once per line:  cidr, connection_name');
  console.log('  Example line:  83.29.4.2/16, fabrikam-adfs');
  console.log('  See sample.csv for an example input file');
  console.log('');
});

program.parse(process.argv);

const name = program.name;
const deploy = program.deploy || false;
const inputfile = 'mapping.csv';

if (!name) {
  console.error('--name is required. Use --help for further info');
  process.exit(1);
}

//console.log(`name: ${name}`);
//console.log(`deploy: ${deploy}`);

const isNotEmpty = function (line) {
  return line.trim().length !== 0;
};

const readMappingsForFile = (cb) => {
  fs.readFile(`./${inputfile}`, 'utf8', function (err, data) {
    if (err) {
      return cb(err);
    }
    try {
      //TODO-arcs introduce CSV npm module?
      const lines = R.filter(isNotEmpty, data.split('\n'));
      const mapIndexed = R.addIndex(R.map);
      const mappings = mapIndexed((line, i) => {
        try {
          const parts = line.split(',');
          assert(parts.length === 2, 'Invalid line detected');
          const cidr = parts[0].trim();
          assert(!/\s/g.test(cidr), 'Illegal spacing in CIDR');
          const conn = parts[1].trim();
          assert(!/\s/g.test(conn), 'Illegal spacing in connection name');
          assert(ipUtils.isValid(cidr.split('/')[0]), 'Invalid IP');
          return `${cidr}$${conn}`;
        } catch (e) {
          cb(`File parse error at or near line ${i}: ${e.message}`);
        }
      }, lines);
      return cb(null, mappings.join('|'));
    } catch (e) {
      return cb(e.message);
    }
  });
};

const printCmd = (config, cb) => {
  const cmd = `wt create ../main/ipconn.js --name ${name} --secret \'CONFIG=${config}\' --json --prod`;
  console.log(cmd);
  cb(null, cmd);
};

const deployWebtask = (cmd, cb) => {
  if (!deploy) {
    return cb();
  }
  console.log('Deploying webtask... please wait..');
  exec(cmd, function (err, stdout, stderr) {
    if (stdout) {
      console.log('URL: ' + stdout);
    }
    if (stderr) {
      console.log('stderr: ' + stderr);
    }
    if (err) {
      console.error('exec error: ' + err);
      return cb(err);
    }
    return cb();
  });
};

waterfall([
  readMappingsForFile,
  printCmd,
  deployWebtask
], function (err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});
