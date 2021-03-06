const { assert } = require('chai');
const url = require('url');
const server = require('./fixture/server');
const { auth } = require('./..');

const request = require('request-promise-native').defaults({
  simple: false,
  resolveWithFullResponse: true
});

describe('logout route', function() {
  describe('application only logout', function() {
    let baseUrl;
    let currentSession;
    let logoutResponse;
    const jar = request.jar();

    before(async function() {
      const middleware = auth({
        idpLogout: false,
        clientID: '123',
        baseURL: 'https://myapp.com',
        issuerBaseURL: 'https://flosser.auth0.com',
        required: false
      });
      baseUrl = await server.create(middleware);
      await request.post({
        uri: '/session',
        json: {
          openidTokens: {
            id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
          }
        },
        baseUrl, jar
      });
      logoutResponse = await request.get({uri: '/logout', baseUrl, jar, followRedirect: false});
      currentSession = (await request.get({uri: '/session', baseUrl, jar})).body;
    });

    it('should clear the session', function() {
      assert.notOk(currentSession.openidTokens);
    });

    it('should redirect to the base url', function() {
      assert.equal(logoutResponse.statusCode, 302);
      assert.equal(logoutResponse.headers.location, 'https://myapp.com');
    });
  });

  describe('identity provider logout (auth0)', function() {
    let baseUrl;
    let currentSession;
    let logoutResponse;
    const jar = request.jar();

    before(async function() {
      const middleware = auth({
        idpLogout: true,
        clientID: '123',
        baseURL: 'https://myapp.com',
        issuerBaseURL: 'https://flosser.auth0.com',
        required: false
      });
      baseUrl = await server.create(middleware);
      await request.post({
        uri: '/session',
        json: {
          openidTokens: {
            id_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
          }
        },
        baseUrl, jar
      });
      logoutResponse = await request.get({uri: '/logout', baseUrl, jar, followRedirect: false});
      currentSession = (await request.get({uri: '/session', baseUrl, jar})).body;
    });

    it('should clear the session', function() {
      assert.notOk(currentSession.openidTokens);
    });

    it('should redirect to the base url', function() {
      assert.equal(logoutResponse.statusCode, 302);
      const parsedUrl = url.parse(logoutResponse.headers.location, true);
      assert.deepInclude(parsedUrl, {
        protocol: 'https:',
        hostname: 'flosser.auth0.com',
        query: { returnTo: 'https://myapp.com', client_id: '123' },
        pathname: '/v2/logout',
      });
    });
  });


});
