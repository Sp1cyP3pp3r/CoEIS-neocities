// archive-list.js
console.log("[Archive List] Script file loaded successfully!");

(function () {
  "use strict";

  var API_URL = "https://archive.org/services/users/@user_38779/lists/1";
  var CONTAINER_ID = "archive-list-container";
  var TIMEOUT_MS = 10000;

  // Two independent JSONP proxy services as fallbacks
  var proxies = [
    {
      name: "allorigins.win",
      getUrl: function (cb) {
        return (
          "https://api.allorigins.win/get?callback=" +
          cb +
          "&url=" +
          encodeURIComponent(API_URL)
        );
      },
      extract: function (res) {
        return JSON.parse(res.contents);
      },
    },
    {
      name: "jsonp.afeld.me",
      getUrl: function (cb) {
        return (
          "https://jsonp.afeld.me/?callback=" +
          cb +
          "&url=" +
          encodeURIComponent(API_URL)
        );
      },
      extract: function (res) {
        return res;
      },
    },
  ];

  var currentIndex = 0;

  function log(msg) {
    console.log("[Archive List] " + msg);
  }

  function showError(msg) {
    var c = document.getElementById(CONTAINER_ID);
    if (c) c.innerHTML = '<p style="color:#cc0000;">' + msg + "</p>";
    log("ERROR: " + msg);
  }

  function renderList(data) {
    var c = document.getElementById(CONTAINER_ID);
    if (!c) return;

    if (!data || !data.success || !data.value || !data.value.members) {
      showError("Invalid data structure received from Archive.org.");
      return;
    }

    var members = data.value.members;
    if (members.length === 0) {
      c.innerHTML = "<p>No items found in this list.</p>";
      return;
    }

    var html = '<ul style="list-style-type:disc;padding-left:20px;">';
    for (var i = 0; i < members.length; i++) {
      var id = members[i].identifier;
      var title = id
        .split("-")
        .map(function (w) {
          return w.charAt(0).toUpperCase() + w.slice(1);
        })
        .join(" ");

      html += '<li style="margin-bottom:8px;">';
      html +=
        '<a href="https://archive.org/details/' +
        id +
        '" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:#0066cc;">';
      html += title;
      html += "</a></li>";
    }
    html += "</ul>";
    c.innerHTML = html;
    log("Done! Rendered " + members.length + " items.");
  }

  function tryProxy() {
    if (currentIndex >= proxies.length) {
      showError(
        "All proxy services failed. Check the browser console for details.",
      );
      return;
    }

    var proxy = proxies[currentIndex];
    var cbName = "_archCb" + currentIndex + "_" + Date.now();

    log(
      "--- Attempting proxy #" +
        (currentIndex + 1) +
        ": " +
        proxy.name +
        " ---",
    );

    // Global callback for JSONP
    window[cbName] = function (response) {
      log("Callback fired from " + proxy.name);
      clearTimeout(timer);
      delete window[cbName];
      var s = document.getElementById("arch-jsonp-" + currentIndex);
      if (s) s.remove();

      try {
        var data = proxy.extract(response);
        log("Data extracted successfully.");
        renderList(data);
      } catch (e) {
        log("Parse error from " + proxy.name + ": " + e.message);
        currentIndex++;
        tryProxy();
      }
    };

    // Timeout fallback
    var timer = setTimeout(function () {
      log("Timeout after " + TIMEOUT_MS + "ms for " + proxy.name);
      delete window[cbName];
      var s = document.getElementById("arch-jsonp-" + currentIndex);
      if (s) s.remove();
      currentIndex++;
      tryProxy();
    }, TIMEOUT_MS);

    // Inject script tag
    var script = document.createElement("script");
    script.id = "arch-jsonp-" + currentIndex;
    script.src = proxy.getUrl(cbName);

    script.onerror = function () {
      log("Script onerror fired for " + proxy.name);
      clearTimeout(timer);
      delete window[cbName];
      script.remove();
      currentIndex++;
      tryProxy();
    };

    log('Injecting <script src="' + script.src + '">');
    document.head.appendChild(script);
  }

  function init() {
    log("init() called. DOM readyState: " + document.readyState);
    var c = document.getElementById(CONTAINER_ID);
    if (!c) {
      log(
        "Container #" + CONTAINER_ID + " not found yet, retrying in 500ms...",
      );
      setTimeout(init, 500);
      return;
    }
    log("Container found. Starting proxy requests.");
    tryProxy();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
