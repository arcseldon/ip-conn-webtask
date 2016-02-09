// author arcseldon@icloud.com
'use strict';

/***************************************************
 * Create wt-cli command for given input csv mappings
 * Deploy automatically
 ***************************************************/

const exec = require('child_process').exec,
  program = require('commander'),
  async = require('async'),
  waterfall = async.waterfall,
  configMapReader = require('../utils/configMapReader'),
  fileExists = require('../utils/fileExists'),
  version = require('../../package.json').version;

const INPUT_FILE = `${__dirname}/config.csv`;
const SAMPLE_FILE = `${__dirname}/sample.csv`;

program
  .version(version)
  .option('-t, --taskname [taskname]', 'The task name to register for webtask')
  .option('-d --deploy', 'Do deployment');

program.on('--help', function () {
  console.log('  Generates necessary wt-cli command line task for input mapping file');
  console.log(`  Input file should be named mapping.csv, located at: ${INPUT_FILE}.`);
  console.log('  Format, once per line:  cidr, connection_name');
  console.log('  Example line:  83.29.4.2/16, fabrikam-adfs');
  console.log(`  For an example input file, see: ${SAMPLE_FILE}`);
  console.log('');
});

program.parse(process.argv);

const name = program.taskname;
const deploy = program.deploy || false;

const handleViolation = (msg) => {
  console.error(msg);
  process.exit(1);
};

if (!fileExists(INPUT_FILE)) {
  handleViolation(`Configuration file containing mappings must be provided at: ${INPUT_FILE}`);
}

if (!name) {
  handleViolation('--taskname is required. Use --help for further info');
}

const printCmd = (config, cb) => {
  const appPath = __dirname.substring(0, __dirname.lastIndexOf('/')) + '/main/ipconn.js';
  const cmd = `wt create ${appPath} --name ${name} --secret \'CONFIG=${config}\' --json --prod`;
  console.log(cmd);
  cb(null, cmd);
};

const deployWebtask = (cmd, cb) => {
  if (!deploy) {
    return cb();
  }
  console.log('\nDeploying webtask... please wait..\n');

/*eslint-disable*/
  exec(cmd, function (err, stdout, stderr) {
    if (stdout) {
      console.log('Webtask successfully deployed');
      console.log('URL: ' + stdout);
    }
    //if (stderr) {
    //  console.log('stderr: ' + stderr);
    //}
    if (err) {
      console.error('exec error: ' + err);
      return cb(err);
    }
    return cb();
  });
/*eslint-enable*/

};

const completed = function (err) {
  if (err) {
    console.error(err);
    process.exit(1);
  }
};

waterfall([
  configMapReader(INPUT_FILE),
  printCmd,
  deployWebtask
], completed);
