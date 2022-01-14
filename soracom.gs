function soracomAuth(config) {
  var reqBody = {
    authKey: config.authKey,
    authKeyId: config.authKeyId
  };
  var options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(reqBody)
  };
  try {
    var authUrl = config.url + "auth"
    var resp = UrlFetchApp.fetch(authUrl, options);
    if (resp.getResponseCode() != 200) {
      throw new Error("SORACOM authentication error, please check authKeyId or authKey");
    };
  } catch (e) {
    alert(e.message);
  };
  var respBody = JSON.parse(resp.getContentText());
  config.apiKey = respBody.apiKey;
  config.token = respBody.token;

  return config;
}