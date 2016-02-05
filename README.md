# ip-conn-webtask

Powered by [wt-cli](https://www.npmjs.com/package/wt-cli) from [auth0](https://webtask.io).

### Purpose

This webtask receives an IP address as http request parameter, and attempts to find a matching
 connection name according to its own internal mapping of known IP CIDR address ranges to connections.

Must receive a valid IPv4 or IPv6 IP address with a request.

If the IP address is successfully matched, the connection name is passed back in http response,
 otherwise the connection name passed back is "unknown". In either case, constitutes a 200 response code.

Success response:

```
{
  connection: <connection name>
}
```

No match found:

```
{
  connection: <connection name>
}
```

### Installation

Pre-requisites:

A working copy of node and npm installed. See [Node website](https://nodejs.org/en/) for instructions.
Install the latest version you can - this webtask was written using Node v5+ and NPM 3+ but should
work on earlier versions..

Install [wt-cli](https://www.npmjs.com/package/wt-cli):

Run:

```
wt init
```

Check the instructions at [webtask.io](https://webtask.io/) for further details if required on getting started with
the wt command line tooling.

Clone the repo:

```
git clone ip-conn-webtask
```

Next install NPM modules:

```
npm install
```

Build the project

```
npm run build
```

Ok, all ready for setup to get your webtask deployed..

### Set up

Suppose you have information similar to below:

 - Fabrikam => 83.29.4.2/16 => Connection: fabrikam-adfs
 - Contoso => 99.2.4.28/32 => Connection: contoso-ping
 - Microsoft => 44.2.4.3/16 => Connection: ms-azuread

You need to put each CIDR and Connection pair into a single comma separated file, one pair per line.

For example (adding a few more entries, and illustrating ipv4 and ipv6 support):

83.29.4.2/16, fabrikam-adfs
99.2.4.28/32, contoso-ping
44.2.4.3/16, ms-azuread
200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40, fabrikam-adfs-6
60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6/40, contoso-ping-6
eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29/64, ms-azuread-6

Note, above no quoting is used around the values.

Once you have this format, you are ready to deploy your webtask

### Deploy

We will deploy using the wt-cli.

The format you need:

```
wt create ../build/main/ipconn.js --name ipconn --secret 'CONFIG=XXX' --json --prod
```

As you can see above, our code for the webtask is `ipconn.js`.
`XXX` above represents the mapping data that needs to be passed as part of the secret for deployment with the webtask

Here is the same instruction, this time with the secret fully populated (using the csv information above):

```
wt create ../build/main/ipconn.js --name ipconn --secret 'CONFIG=83.29.4.2/16$fabrikam-adfs|99.2.4.28/32$contoso-ping|44.2.4.3/16$ms-azuread|200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40$fabrikam-adfs-6|60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6/40$contoso-ping-6|eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29/64$ms-azuread-6' --json --prod
```

The format for the `secret` is:

```
CONFIG=cidr$connection_name|cidr$connection_name|cidr$connection_name|...
```

We use a pipe `|` character to separate cidr/connection_name pairs, and we use a dollar `$` to separate cidr and connection_name


The good news is that you can use our tool to fully automate creation of the required deployment command, and optionally
fully deploy the webtask on your behalf.

On the command line (using your favourite terminal), change directories to `build/tools`

Put your csv data inside a file called `mapping.csv`, and then do either:

```
node wt-helper.js --name ipconn
```

This will print out the required command line to deploy the webtask.
Copy this, and then run it directly off the command line.

You will see a URL given back by wt-cli. Copy this URL.

or, adding the `--deploy` option:

```
node wt-helper.js --name ipconn --deploy
```

will fully automate the deployment.

For the latter command, just run the `deploy.sh` shell script provided.

```
$ ./deploy.sh
```

You will see an output with URL prefix followed by a URL.

```
URL: "https://webtask.it.auth0.com/api/run/wt-arcseldon-gmail_com-0/ipconn"
```

Copy this URL.


# Run

To test, run this URL with an IP address query parameter.
You can use a command line tool like `curl` for this purpose.

For example:

```
curl https://webtask.it.auth0.com/api/run/wt-arcseldon-gmail_com-0/ipconn?ip=83.29.4.6
```

Using an IP that will match one of your CIDR / Connection name mappings, you should receive a response like:

```
{"connection":"fabrikam-adfs"}
```

For an unknown IP address you will see:

```
{"connection":"unknown"}
```

True errors will be reported as such.

Please contact your Auth0 represetative if you require any further assistance.

Also, please see our **ip-conn-webtask-scaled-firebase** webtask for a truly scaled version, with out of the box
configuration support via Firebase, and the ability to support 1000s of CIDRs with excellent performance characteristics


### Note on O/S support:

This application was built using Mac OS X El Capitan v10.11.3, npm v.3.6.0, and node v5.5.0

The application should largely work untouched on Windows OS. However, the `postcompile` step needs `cp` changed to `copy`.

### Dev Details:

There are several supporting package.json script commands to support working with this code base.

The code is written using ES6 constructs, but nothing that is not supported by Node 5.5 out of the box.
In other words, although we use Babel to compile the ES6 Javascript from src/ to build/ directories, it
is quite possible to code and run the code directly from the src/ directory using Node 5.5 with babel polyfill support.
For this reason, opted not to use destructuring, default params, or ES6 modules for this project. Also,
I found no need for sourcemaps, for the reason given above, I can just comfortably work directly from src.

That said, you can switch on compile watch and test watch, lint watch by running:

```
watch: compile
watch: test
watch: lint
```

Also, I use Webstorm 11 IDE, and have quite a few conveniences set up to automate alot of tasks, but there are no dependencies etc on any given Editor / IDE.

The webtask has good test coverage, you can run:

```
npm run cov:test
```

to get some coverage metrics. Will be written to `coverage` directory - see *coverage/Icov-report/index.html* for details.

For specfic development questions or discovered bugs, please contact *Richard Seldon* at *arcseldon@icloud.com*
and feel free to raise an issue on the Auth0 github repository for this project. All our code is freely available as
open source.

