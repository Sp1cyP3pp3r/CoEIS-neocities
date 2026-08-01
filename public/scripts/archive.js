// scripts/archive.js
console.log("[Archive List] Script loaded.");

(function () {
  "use strict";

  const PROXY_URL = "https://fragrant-feather-c731.niktoktoto21.workers.dev/";
  const THUMBNAIL_WIDTH = 120;

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

    let html =
      '<div style="display: flex; flex-direction: column; gap: 20px;">';

    for (let i = 0; i < members.length; i++) {
      const item = members[i];
      const meta = item.metadata; // <--- HERE IS YOUR DICTIONARY

      // 1. Extract Title (Archive.org sometimes returns arrays instead of strings)
      let title = meta.title;
      if (Array.isArray(title)) title = title.join(" ");
      if (!title) title = item.identifier;

      // 2. Extract Creator
      let creator = meta.creator;
      if (Array.isArray(creator)) creator = creator.join(", ");

      // 3. Extract Thumbnail (Using the reliable Archive.org image service)
      const thumb = `https://archive.org/services/img/${item.identifier}`;
      const link = `https://archive.org/details/${item.identifier}`;

      /*
       * NOW YOU CAN EASILY ADD ANYTHING ELSE FROM THE DICTIONARY!
       * Example:
       * const description = meta.description || '';
       * const subjects = Array.isArray(meta.subject) ? meta.subject.join(', ') : (meta.subject || '');
       */

      html +=
        '<div style="display: flex; gap: 15px; align-items: flex-start;">';

      // Thumbnail image
      html += '<div style="flex-shrink: 0;">';
      html +=
        '<a href="' + link + '" target="_blank" rel="noopener noreferrer">';
      html += '<img src="' + thumb + '" alt="' + title + '" ';
      html +=
        'style="width: ' +
        THUMBNAIL_WIDTH +
        'px; height: auto; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.2);" ';
      html +=
        "onerror=\"this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22160%22%3E%3Crect fill=%22%23eee%22 width=%22120%22 height=%22160%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Cover%3C/text%3E%3C/svg%3E';\" ";
      html += "/>";
      html += "</a>";
      html += "</div>";

      // Text content
      html += '<div style="flex: 1; padding-top: 4px;">';
      html +=
        '<a href="' +
        link +
        '" target="_blank" rel="noopener noreferrer" style="text-decoration:none; color:#0066cc; font-weight:bold; font-size:1.15em; display:block; margin-bottom: 4px;">';
      html += title;
      html += "</a>";

      if (creator) {
        html +=
          '<div style="color: #555; font-size: 0.95em;">by ' +
          creator +
          "</div>";
      }

      html += "</div>";
      html += "</div>";
    }

    html += "</div>";
    container.innerHTML = html;
    log(
      "Done! Rendered " +
        members.length +
        " items using raw metadata dictionary.",
    );
  }

  function init() {
    const containers = document.querySelectorAll(
      ".archive-list-container[data-target-archive-list]",
    );

    if (containers.length === 0) {
      setTimeout(init, 500);
      return;
    }

    containers.forEach((container) => {
      const relativePath = container.getAttribute("data-target-archive-list");
      const targetApi = "https://archive.org/services/" + relativePath;

      const cbName =
        "archCb_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

      window[cbName] = function (response) {
        delete window[cbName];
        const scriptTag = document.getElementById(cbName + "-script");
        if (scriptTag) scriptTag.remove();
        renderList(container, response);
      };

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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
