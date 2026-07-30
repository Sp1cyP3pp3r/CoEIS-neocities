// scripts/archive.js
console.log("[Archive List] Script loaded.");

(function () {
  "use strict";

  // Your Cloudflare Worker URL
  const PROXY_URL = "https://fragrant-feather-c731.niktoktoto21.workers.dev/";

  function log(msg) {
    console.log("[Archive List] " + msg);
  }

  function showError(container, msg) {
    if (container)
      container.innerHTML = '<p style="color:#cc0000;">' + msg + "</p>";
    log("ERROR: " + msg);
  }

  function renderList(container, data) {
    if (!data || !data.success || !data.value || !data.value.members) {
      showError(container, "Invalid data received from Archive.org.");
      return;
    }

    const members = data.value.members;
    if (members.length === 0) {
      container.innerHTML = "<p>No items found in this list.</p>";
      return;
    }

    let html = '<ul style="list-style-type:disc;padding-left:20px;">';
    for (let i = 0; i < members.length; i++) {
      const id = members[i].identifier;
      // Format identifier into a readable title
      const title = id
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
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

    container.innerHTML = html;
    log("Done! Rendered " + members.length + " items.");
  }

  function init() {
    // 1. Find ALL containers with the specific class and data attribute
    const containers = document.querySelectorAll(
      ".archive-list-container[data-target-archive-list]",
    );

    if (containers.length === 0) {
      // Retry in case the script loads before the DOM is fully parsed
      setTimeout(init, 500);
      return;
    }

    // 2. Process each container independently
    containers.forEach((container) => {
      const relativePath = container.getAttribute("data-target-archive-list");
      const targetApi = "https://archive.org/services/" + relativePath;

      // Generate a globally unique callback name for this specific request
      const cbName =
        "archCb_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

      // Define the global callback.
      // Because of JavaScript closures, 'container' is safely remembered for this specific request.
      window[cbName] = function (response) {
        delete window[cbName]; // Clean up global scope
        const scriptTag = document.getElementById(cbName + "-script");
        if (scriptTag) scriptTag.remove(); // Clean up DOM
        renderList(container, response);
      };

      // Build the request to YOUR Cloudflare Worker
      const scriptUrl =
        PROXY_URL +
        "?callback=" +
        cbName +
        "&target=" +
        encodeURIComponent(targetApi);

      const script = document.createElement("script");
      script.id = cbName + "-script";
      script.src = scriptUrl;

      script.onerror = function () {
        showError(
          container,
          "Failed to load data. Check Worker URL or list path.",
        );
        script.remove();
        delete window[cbName];
      };

      log("Fetching: " + targetApi);
      document.head.appendChild(script);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
