var lib = require('xtuple-server-lib'),
  exec = require('execSync').exec,
  rimraf = require('rimraf'),
  mkdirp = require('mkdirp'),
  path = require('path'),
  _ = require('lodash'),
  prefix = '/';

/**
 * Sets up system file and directory paths
 */
_.extend(exports, lib.task, /** @exports xtuple-server-sys-paths */ {

  etcXtuple: path.resolve(prefix, 'etc/xtuple'),
  usrLocal: path.resolve(prefix, 'usr/local'),
  usrLocalXtuple: path.resolve(prefix, 'usr/local/xtuple'),
  usrSbin: path.resolve(prefix, 'usr/sbin'),
  varLog: path.resolve(prefix, 'var/log'),
  varLibXtuple: path.resolve(prefix, 'var/lib/xtuple'),
  varRun: path.resolve(prefix, 'var/run'),

  /** @override */
  beforeInstall: function (options) {
    // node server/config stuff
    options.xt.id = lib.util.$(options);
    options.xt.configdir = path.resolve(exports.etcXtuple, options.xt.id);
    options.xt.configfile = path.resolve(options.xt.configdir, 'config.js');
    options.xt.ssldir = path.resolve(options.xt.configdir, 'ssl');
    options.xt.homedir = path.resolve(exports.usrLocalXtuple);

    // shared config (per account)
    options.xt.userhome = path.resolve(exports.usrLocal, options.xt.name);
    options.xt.userconfig = path.resolve(options.xt.userhome, '.xtuple');
    options.xt.usersrc = path.resolve(options.xt.userhome, options.xt.version, 'xtuple');
    options.xt.rand64file = path.resolve(options.xt.userconfig, 'rand64.txt');
    options.xt.key256file = path.resolve(options.xt.userconfig, 'key256.txt');

    // other system paths
    options.xt.logdir = path.resolve(exports.varLog, 'xtuple', options.xt.id);
    options.pg.logdir = path.resolve(exports.varLog, 'postgresql');
    options.xt.socketdir = path.resolve(exports.varRun, 'postgresql');
    options.xt.rundir = path.resolve(exports.varRun, 'xtuple', options.xt.id);
    options.xt.statedir = path.resolve(exports.varLibXtuple, options.xt.id);

    // repositories
    options.xt.srcdir = path.resolve(options.xt.homedir, options.xt.version);
    options.xt.coredir = path.resolve(options.xt.srcdir, 'xtuple');
    options.xt.extdir = path.resolve(options.xt.srcdir, 'xtuple-extensions');
    options.xt.privatedir = path.resolve(options.xt.srcdir, 'private-extensions');

    options.pg.snapshotdir = path.resolve(exports.varLibXtuple, options.xt.id, 'snapshots');
  },

  /** @override */
  executeTask: function (options) {
    mkdirp.sync(options.xt.userhome);
    mkdirp.sync(options.xt.userconfig);
    mkdirp.sync(options.pg.snapshotdir);

    mkdirp.sync(options.xt.configdir);
    mkdirp.sync(options.xt.ssldir);
    mkdirp.sync(options.xt.logdir);
    mkdirp.sync(options.xt.rundir);
    mkdirp.sync(options.xt.socketdir);
    mkdirp.sync(options.xt.statedir);
    mkdirp.sync(options.xt.srcdir);

    exec('chown -R xtadmin:xtuser '+ options.xt.srcdir);
    exec('chown -R xtadmin:xtuser '+ options.xt.coredir);
    exec('chown -R xtadmin:xtuser '+ options.xt.extdir);
    exec('chown -R xtadmin:xtadmin '+ options.xt.privatedir);
    
    exec('chmod u=rwx,g=rx '+ options.xt.coredir);
    exec('chmod u=rwx,g=rx '+ options.xt.extdir);
    exec('chmod u=rwx,g=rx,o-rwx '+ options.xt.privatedir);
  }
});
