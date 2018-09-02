(function() {
  angular
    .module('wordpress', [])
    .service('wordpressService', wordpress);

  wordpress.$inject = ['$http', '$location', '$window'];

  function wordpress($http, $location, $window) {
    var routes = {
      all       : ['categories', 'comments', 'media', 'pages', 'posts', 'tags', 'users'],
      views     : ['taxonomies', 'types'],
      revisions : ['pages', 'posts']
    };
    var cache  = {};
    var base   = '';

    function ajax(method, url, data) {
      var headers = localStorage.__WORDPRESS__ ? { Authorization : 'Bearer ' + localStorage.__WORDPRESS__ } : {};

      return $http({
        method  : method,
        url     : url,
        data    : data,
        headers : headers
      }).then(function(response) {
        if (typeof response.data === 'object')
          return response.data;
        else
          throw 'Bad request';
      }).catch(function(e) {
        if (typeof e !== 'string')
          console.log(e);
        if (!e.data && e.status === -1 && localStorage.length) {
          localStorage.clear();
          return ajax(method, url, data);
        }
        else if (!e.data && e.status === -1 && !localStorage.length) {
          return e;
        }
        else if (e === 'Bad request' && localStorage.length) {
          localStorage.clear();
          return ajax(method, url, data);
        }
        else if (e === 'Bad request' && !localStorage.length) {
          return e;
        }
        else {
          localStorage.clear();
          $location.url('/');
        }
      });
    }

    return function(url, preffix) {
      base = 'https://' + _.replace(url, /(^https?:\/\/|\/$)/g, '') + '/' + _.replace(preffix, /^\/|\/$/g, '');

      if (cache[base])
        return cache[base];

      var api = {};

      function search(obj) {
        var keys   = _.keys(obj);
        var output = '';
        _.each(keys, function(v) { output += v + '=' + obj[v] + '&' });
        return _.replace(output, /&$/, '');
      }

      // all methods
      _.each(routes.all, function(v) {
        api[v] = {
          all    : function(body)     { return ajax('GET',    base + '/wp/v2/' + v + '?' + search(body)); },
          add    : function(body)     { return ajax('POST',   base + '/wp/v2/' + v, body); },
          modify : function(id, body) { return ajax('PUT',    base + '/wp/v2/' + v + '/' + id, body); },
          id     : function(id)       { return ajax('GET',    base + '/wp/v2/' + v + '/' + id); },
          delete : function(id)       { return ajax('DELETE', base + '/wp/v2/' + v + '/' + id); }
        };
      });

      api.customs = {
        all    : function(v, body)     { return ajax('GET',    base + '/wp/v2/' + v + '?' + search(body)); },
        add    : function(v, body)     { return ajax('POST',   base + '/wp/v2/' + v, body); },
        modify : function(v, id, body) { return ajax('PUT',    base + '/wp/v2/' + v + '/' + id, body); },
        id     : function(v, id)       { return ajax('GET',    base + '/wp/v2/' + v + '/' + id); },
        delete : function(v, id)       { return ajax('DELETE', base + '/wp/v2/' + v + '/' + id); }
      };

      // only views
      _.each(routes.views, function(v) {
        api[v] = {
          all : function()   { return ajax('GET', base + '/wp/v2/' + v); },
          id  : function(id) { return ajax('GET', base + '/wp/v2/' + v + '/' + id); }
        };
      });

      // revisions
      _.each(routes.revisions, function(v) {
        api[ _.replace(v, /s$/, '') + 'Revisions' ] = {
          all    : function()   { return ajax('GET',    base + '/wp/v2/' + v); },
          id     : function(id) { return ajax('GET',    base + '/wp/v2/' + v + '/' + id); },
          delete : function(id) { return ajax('DELETE', base + '/wp/v2/' + v + '/' + id); }
        };
      });

      api.user = {
        add    : function(body) { return ajax('POST',   base + '/wp/v2/users/me', body); },
        modify : function(body) { return ajax('PUT',    base + '/wp/v2/users/me', body); },
        delete : function()     { return ajax('DELETE', base + '/wp/v2/users/me'); },
        show   : function()     { return ajax('GET',    base + '/wp/v2/users/me'); }
      };

      api.settings = {
        add    : function(body) { return ajax('POST', base + '/wp/v2/settings', body); },
        modify : function(body) { return ajax('PUT',  base + '/wp/v2/settings', body); },
        show   : function()     { return ajax('GET',  base + '/wp/v2/settings'); }
      };

      api.headers = function headers(url) {
        var method  = 'HEAD';
        var headers = localStorage.__WORDPRESS__ ? { Authorization : 'Bearer ' + localStorage.__WORDPRESS__ } : {};

        return $http({
          method  : method,
          url     : url,
          headers : headers
        }).then(function(response) {
          console.log(response.headers('content-type'))
          return response.headers();
        }).catch(function(e) {
          console.log(e);
          throw e;
        });
      }

      //api.login = body ajax('POST', `${base}/koapp/login`, body);
      //api.login = function(body) { return ajax('POST', base + '/jwt-auth/v1/token', body); };
      api.login = function(body) { location.href = base + '/oauth2/authorize' + '?' + search(body); };

      api.link = function(url) { return ajax('GET', url); };

      // memoize api
      cache[base] = api;
      window.a=api.user
      return api;
    }
  }
}());
