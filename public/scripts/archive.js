// archive-list.js
console.log("[Archive List] Script loaded.");

(function () {
  "use strict";

  // REPLACE THIS with your actual Cloudflare Worker URL from Step 1
  var PROXY_URL = "https://fragrant-feather-c731.niktoktoto21.workers.dev/";
  var TARGET_API = "https://archive.org/services/users/@user_38779/lists/1";
  var CONTAINER_ID = "archive-list-container";

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
      showError("Invalid data received from Archive.org.");
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

  function init() {
    var c = document.getElementById(CONTAINER_ID);
    if (!c) {
      setTimeout(init, 500);
      return;
    }

    var cbName = "_archCb_" + Date.now();

    // Define the global callback function
    window[cbName] = function (response) {
      delete window[cbName];
      var s = document.getElementById("arch-jsonp-script");
      if (s) s.remove();
      renderList(response);
    };

    // Build the JSONP URL pointing to YOUR Cloudflare Worker
    var scriptUrl =
      PROXY_URL +
      "?callback=" +
      cbName +
      "&url=" +
      encodeURIComponent(TARGET_API);

    var script = document.createElement("script");
    script.id = "arch-jsonp-script";
    script.src = scriptUrl;

    script.onerror = function () {
      showError("Failed to load data. Check your Worker URL.");
      script.remove();
      delete window[cbName];
    };

    log("Fetching from custom proxy...");
    document.head.appendChild(script);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
