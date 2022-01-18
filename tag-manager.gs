const soracomAPIUrl = "https://api.soracom.io/v1/";
const soracomGlobalAPIUrl = "https://g.api.soracom.io/v1/";
const simsSheetName = "sims";
const configSheetName = "config";
const simsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(simsSheetName);
const configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(configSheetName);

function main() {
    var config = getConfig();

    updateSIMs(config);
}

function getConfig() {
    var config = {
        "authKeyId": configSheet.getRange('B1').getValue(),
        "authKey": configSheet.getRange('B2').getValue(),
        "coverage": configSheet.getRange('B3').getValue()
    };

    if (config.coverage == "g") {
        config.url = soracomGlobalAPIUrl;
    } else {
        config.url = soracomAPIUrl;
    }

    config = soracomAuth(config);

    return config;
}

function updateSIMs(config) {
    var sims = getSIMs();
    sims.forEach(sim => {
        updateTags(config, sim);
    });

}

function getTagKeys(values) {
    // After the second column of the first row
    var tagKeys = values[0].slice(1);
    return tagKeys;
}

function getSIMs() {
    var values = simsSheet.getDataRange().getValues();
    var tagsKeys = getTagKeys(values);

    // The second and subsequent rows are treated as a SIM list. Hidden rows are ignored.
    var cells = values.slice(1).filter(function(_, i) {return !simsSheet.isRowHiddenByFilter(i + 1)});

    var sims = [];

    cells.forEach(cell => {
        var tags = [];
        var tagValueStartIndex = 1;
        tagsKeys.forEach(tagKey => {
            tags.push({ tagName: tagKey, tagValue: cell[tagValueStartIndex] + "" }); // tag API support only string value
            tagValueStartIndex++;
        });
        sims.push({
            simId: cell[0],
            tags: tags
        }
        );
    });

    return sims;
}

function updateTags(config, sim) {
    var headers = {
        "X-Soracom-API-Key": config.apiKey,
        "X-Soracom-Token": config.token
    };
    var options = {
        'method': 'put',
        'contentType': 'application/json',
        'payload': JSON.stringify(sim.tags),
        'headers': headers
    };
    try {
        var putSimTagsUrl = config.url + "sims/" + sim.simId + "/tags"
        retryFetch(putSimTagsUrl, options)
    } catch (e) {
        throw e;
    };
}

function retryFetch(url, options) {
  var lastError = null;
  for(var i = 0; i < 3; i++) {
    try {
      var res = UrlFetchApp.fetch(url, options)
      if(res.getResponseCode() == 200) {
        return res.getContentText("UTF-8")
      } else {
        lastError = 'got unexpected status code: ' + res.getResponseCode() + ', ' + url;
      }
    } catch(e) {
      lastError = e;
    }
    var wait = 30000 + Math.floor( Math.random() * 30001 );
    Utilities.sleep(wait);
  }
  throw lastError + ', ' + url
}