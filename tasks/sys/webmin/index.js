(function () {
  'use strict';

  /**
   * Install and configure webmin
   */
  var webmin = exports;

  var lib = require('xtuple-server-lib'),
    format = require('string-format'),
    _ = require('lodash'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    rimraf = require('rimraf'),
    exec = require('execSync').exec,
    fs = require('fs');

  _.extend(webmin, lib.task, /** @exports webmin */ {

    options: {
      webminurl: {
        optional: '[url path]',
        description: 'Webmin url path'
      }
    },

    /** @override */
    beforeInstall: function (options) {
      mkdirp.sync('/srv/ssl');

      options.nginx.outkey = path.resolve('/srv/ssl/webmin.key');
      options.nginx.outcrt = path.resolve('/srv/ssl/webmin.crt');
      options.nginx.domain = 'localhost';

      options.sys.etcWebmin = path.resolve('/etc/webmin');
      options.sys.webminConfigFile = path.resolve(options.sys.etcWebmin, 'config');
      options.sys.webminMiniservConfigFile = path.resolve(options.sys.etcWebmin, 'miniserv.conf');
      options.sys.webminCustomPath = path.resolve(options.sys.etcWebmin, 'custom');
      options.sys.webminCustomConfigFile = path.resolve(options.sys.webminCustomPath, 'config');
      options.sys.webminXtuplePath = path.resolve(options.sys.etcWebmin, 'xtuple');
    },

    /** @override */
    beforeTask: function (options) {
      mkdirp.sync(options.sys.webminXtuplePath);
    },

    /** @override */
    executeTask: function (options) {
      var debFile = 'webmin_1.680_all.deb';
      // TODO if debian
      if (!fs.existsSync(path.resolve(debFile))) {
        exec('wget https://s3.amazonaws.com/com.xtuple.deploy-assets/'+ debFile);
      }
      exec('dpkg --install '+ debFile);
      exec('npm install ansi2html -g');

      webmin.deleteUnusedModules(options);
      webmin.writeConfiguration(options);
      webmin.installCustomCommands(options);
      webmin.installNginxSite(options);
    },

    /** @override */
    afterTask: function (options) {
      exec('service webmin restart');
      exec('service nginx reload');
    },

    /** @override */
    uninstall: function (options) {
      exec('service webmin stop');
      fs.unlinkSync(path.resolve(options.sys.webminXtuplePath, 'editions.menu'));
      rimraf.sync(options.sys.webminCustomPath);
      mkdirp.sync(options.sys.webminCustomPath);
    },

    writeConfiguration: function (options) {
      fs.appendFileSync(options.sys.webminConfigFile, [
        'referer=1',
        'webprefix=' + (options.sys.webminurl || ''),
        'webprefixnoredir=1'
      ].join('\n').trim());

      fs.appendFileSync(options.sys.webminMiniservConfigFile, [
        'bind=127.0.0.1',
        'sockets=127.0.0.1:10000',
        'ssl=0',
        'ssl_redirect=0'
      ].join('\n').trim());

      fs.writeFileSync(options.sys.webminCustomConfigFile, [
        'display_mode=1',
        'columns=1',
        'params_cmd=0',
        'params_file=0',
        'sort=desc',
        'height=',
        'width=',
        'wrap='
      ].join('\n').trim());
    },

    installCustomCommands: function (options) {
      exec('cp ' + path.resolve(__dirname) + '/*.cmd ' + options.sys.webminCustomPath);
      exec('cp ' + path.resolve(__dirname) + '/*.html ' + options.sys.webminCustomPath);
      exec('cp ' + path.resolve(__dirname, 'editions.menu') + ' ' + options.sys.webminXtuplePath + '/editions.menu');
    },

    installNginxSite: function (options) {
      if (!fs.existsSync(options.nginx.outcrt)) {
        require('../../nginx').ssl.generate(options);
      }

      // write site file
      options.nginx.availableSite = path.resolve('/etc/nginx/sites-available/webmin-site');
      options.nginx.enabledSite = path.resolve('/etc/nginx/sites-enabled/webmin-site');
      options.nginx.siteTemplateFile = path.resolve(__dirname, 'webmin-site');
      require('../../nginx').site.writeSiteConfig(options);
    },

    deleteUnusedModules: function (options) {
      var mod = '/usr/share/webmin';

      rimraf.sync(path.resolve(mod, 'bind8'));
      rimraf.sync(path.resolve(mod, 'burner'));
      rimraf.sync(path.resolve(mod, 'pserver'));
      rimraf.sync(path.resolve(mod, 'exim'));
      rimraf.sync(path.resolve(mod, 'fetchmail'));
      rimraf.sync(path.resolve(mod, 'file'));
      rimraf.sync(path.resolve(mod, 'grub'));
      rimraf.sync(path.resolve(mod, 'jabber'));
      rimraf.sync(path.resolve(mod, 'krb5'));
      rimraf.sync(path.resolve(mod, 'ldap-client'));
      rimraf.sync(path.resolve(mod, 'ldap-server'));
      rimraf.sync(path.resolve(mod, 'ldap-useradmin'));
      rimraf.sync(path.resolve(mod, 'mysql'));
      rimraf.sync(path.resolve(mod, 'postfix'));
      rimraf.sync(path.resolve(mod, 'qmailadmin'));
      rimraf.sync(path.resolve(mod, 'iscsi-client'));
      rimraf.sync(path.resolve(mod, 'iscsi-server'));
      rimraf.sync(path.resolve(mod, 'iscsi-target'));
      rimraf.sync(path.resolve(mod, 'ajaxterm'));
      rimraf.sync(path.resolve(mod, 'adsl-client'));
      rimraf.sync(path.resolve(mod, 'apache'));
      rimraf.sync(path.resolve(mod, 'htaccess-htpasswd'));
      rimraf.sync(path.resolve(mod, 'cpan'));
      rimraf.sync(path.resolve(mod, 'pap'));
      rimraf.sync(path.resolve(mod, 'ppp-client'));
    }
  });
})();

