# ip-conn-webtask

A [webtask](https://webtask.io/), powered by [wt-cli](https://www.npmjs.com/package/wt-cli) from [auth0](https://webtask.io).

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
  connection: <unknown>
}
```

![run cmd](run.gif)

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

 Fabrikam => 83.29.4.2/16 => Connection: fabrikam-adfs<br/>
 Contoso => 99.2.4.28/32 => Connection: contoso-ping<br/>
 Microsoft => 44.2.4.3/16 => Connection: ms-azuread<br/>

 Ultimately, the format you need to put this information into is:

 ```
cidr,connection_name|cidr,connection_name|cidr,connection_name|...
```

- We use a comma `,` to separate cidr and connection_name tuples (pairs)<br/>
- We use a pipe `|` character to separate cidr/connection_name pairing


This can be done manually, or you can use our automatic command builder and deployment tool.

Please see next section on deployment.


### Deploy

We will deploy using the wt-cli.

The format you need:

```
wt create ../build/main/ipconn.js --name ipconn --secret 'CONFIG=XXX' --json --prod
```

As you can see above, our code for the webtask is `ipconn.js`.<br/>
`XXX` above represents the mapping data (that we discussed in Setup above) that needs to be passed as part of the secret for deployment with the webtask

Here is the same instruction, this time with a a smaple secret fully populated:

```
wt create ../build/main/ipconn.js --name ipconn --secret 'CONFIG=83.29.4.2/16,fabrikam-adfs|99.2.4.28/32,contoso-ping|44.2.4.3/16,ms-azuread|200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40,fabrikam-adfs-6|60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6/40,contoso-ping-6|eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29/64,ms-azuread-6' --json --prod
```

The good news is that you can use our tool to fully automate creation of the required deployment command, and optionally
fully deploy the webtask on your behalf.

On the command line (using your favourite terminal), create a file called `config.csv` under `build/tools` directory.

You need to put each CIDR and Connection pair into a single comma separated file, one pair per line.<br/>
For example (adding a few more entries, and illustrating ipv4 and ipv6 support):

83.29.4.2/16, fabrikam-adfs<br/>
99.2.4.28/32, contoso-ping<br/>
44.2.4.3/16, ms-azuread<br/>
200b:af16:a83f:c7be:dd00:d9fb:ddc3:92aa/40, fabrikam-adfs-6<br/>
60b9:0fd3:7e62:e6fe:72e2:1407:5cfa:52f6/40, contoso-ping-6<br/>
eaf5:59b7:ee1f:e78a:d5bd:a5e6:251b:7d29/64, ms-azuread-6<br/>

Note, above no quoting is used around the values.

Next, from the base of the project run:

```
npm run loader -- --name ipconn
```

This will output the required command to deploy the webtask. Copy this command, and run it off the command line.
The result will be URL, something like:

```
URL: "https://webtask.it.auth0.com/api/run/wt-arcseldon-gmail_com-0/ipconn"
```

Copy this URL, as we use this to actually call our service.


Alternatively, you can additionally add the `--deploy` option when using the command deploy tool:

```
npm run loader -- --name ipconn --deploy
```

This will fully automate the deployment, you will receive the URL directly in one step.

You can optionally just run `loader.sh` provided in the base directory for a one step deployment.

```
$ ./loader.sh
```

You will see an output with URL prefix followed by a URL.

```
URL: "https://webtask.it.auth0.com/api/run/wt-arcseldon-gmail_com-0/ipconn"
```

Copy this URL.

To get help, just run:

```
npm run help:loader
```

You will get information such as:

```
 Usage: loader [options]

  Options:

    -h, --help                 output usage information
    -V, --version              output the version number
    -t, --taskname [taskname]  The task name to register for webtask
    -d --deploy                Do deployment

  Generates necessary wt-cli command line task for input mapping file
  Input file should be named mapping.csv, located at: /<your_project_path>/ip-conn-webtask/build/tools/config.csv.
  Format, once per line:  cidr, connection_name
  Example line:  83.29.4.2/16, fabrikam-adfs
  For an example input file, see: /<your_project_path>/ip-conn-webtask/build/tools/sample.csv
```


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

Please contact your Auth0 representative if you require any further assistance.

Also, please see our **ip-conn-webtask-firebase** webtask for a truly scaled version, with out of the box
configuration support via Firebase, and the ability to support 1000s of CIDRs with excellent performance characteristics

### Demo / Functional Testing

Copy the `env` file in base of the project, to `.env` in base of project.
Populate the values correctly, eg.

AUTH0_DOMAIN_URL=https://your_profile_name.auth0.com/user/ip<br/>
AUTH0_CONNECTION=twitter<br/>

Then run:

```
$ ./demo.sh
```

This should:

Retrieve your IP as known to Auth0 (this also works running over VPN etc)<br/>
Inject that IP into a sample config.csv<br/>
Create and deploy the webtask acording to sample config.csv<br/>
Create and execute a `curl` command to the webtask URL endpoint using your IP<br/>


Result should be the registered `connection name` you provided in `.env`

If you ensure that the `connection name` matches an actual Connection you are using,
then you can then automaticaly login using that Connection via your custom login page.


### Note on O/S support:

This application was built using Mac OS X El Capitan v10.11.3, npm v.3.6.0, and node v5.5.0

The application should largely work untouched on Windows OS. However, the `postcompile` step needs `cp` changed to `copy`.

### Dev Details:

There are several supporting package.json script commands to support working with this code base.

The code is written using ES6 constructs, but nothing that is not supported by Node 5.5 out of the box.
In other words, although we use Babel to compile the ES6 Javascript from src/ to build/ directories, it
is quite possible to code and run the code directly from the src/ directory using Node 5.5 without any
babel / polyfill support. For this reason, opted not to use destructuring, default params, or ES6 modules
for this project. Also, I found no need for sourcemaps, for the reason given above, I can just comfortably
work directly from src.

That said, you can switch on compile watch and test watch, lint watch by running:

```
npm run watch:compile
npm run watch:test
npm run watch:lint
```

Also, I use Webstorm 11 IDE, and have quite a few conveniences set up to automate alot of tasks, but there are no dependencies etc on any given Editor / IDE.

The webtask has good test coverage, you can run:

```
npm run cov:test
```

to get some coverage metrics. Will be written to `coverage` directory - see *coverage/Icov-report/index.html* for details.

For specfic development questions or discovered bugs, please contact *Richard Seldon* at *arcseldon@icloud.com*
and feel free to raise an issue on the Auth0 github repository for this project. All our code is freely available
as open source.


