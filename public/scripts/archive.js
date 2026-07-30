console.log("[Archive List] Script loaded.");

(function () {
  "use strict";

  const PROXY_URL = "https://fragrant-feather-c731.niktoktoto21.workers.dev/";
  const THUMBNAIL_WIDTH = 120; // Adjust thumbnail width as needed

  function log(msg) {
    console.log("[Archive List] " + msg);
  }

  function showError(container, msg) {
    if (container)
      container.innerHTML = '<p style="color:#cc0000;">' + msg + "</p>";
    log("ERROR: " + msg);
  }

  // Helper to get thumbnail URL from metadata
  function getThumbnailUrl(identifier, metaData) {
    // Method 1: Try to find image files in the metadata
    if (metaData.files && Array.isArray(metaData.files)) {
      // Look for common image file patterns
      const imageFiles = metaData.files.filter(function (file) {
        return (
          file.name &&
          ((file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/i) &&
            file.name.toLowerCase().indexOf("cover") !== -1) ||
            file.name.toLowerCase().indexOf("image") !== -1 ||
            file.name.toLowerCase().indexOf("front") !== -1)
        );
      });

      if (imageFiles.length > 0) {
        // Prefer files with 'cover' in the name
        const coverFile =
          imageFiles.find(function (f) {
            return f.name.toLowerCase().indexOf("cover") !== -1;
          }) || imageFiles[0];

        return (
          "https://archive.org/download/" +
          identifier +
          "/" +
          encodeURIComponent(coverFile.name)
        );
      }
    }

    // Method 2: Use Archive.org's image service (fallback)
    // This redirects to the primary image for the item
    return "https://archive.org/services/img/" + identifier;
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

    // Create a flexbox or grid container for items with thumbnails
    let html =
      '<div style="display: flex; flex-direction: column; gap: 15px;">';

    for (let i = 0; i < members.length; i++) {
      const id = members[i].identifier;
      const title = id
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      html +=
        '<div style="display: flex; gap: 15px; align-items: flex-start;">';

      // Thumbnail image
      html += '<div style="flex-shrink: 0;">';
      html +=
        '<a href="https://archive.org/details/' +
        id +
        '" target="_blank" rel="noopener noreferrer">';
      html += '<img src="https://archive.org/services/img/' + id + '" ';
      html += 'alt="' + title + '" ';
      html +=
        'style="width: ' +
        THUMBNAIL_WIDTH +
        'px; height: auto; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" ';
      html +=
        "onerror=\"this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%22160%22%3E%3Crect fill=%22%23ddd%22 width=%22120%22 height=%22160%22/%3E%3Ctext fill=%22%23999%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3ENo Image%3C/text%3E%3C/svg%3E';\" ";
      html += "/>";
      html += "</a>";
      html += "</div>";

      // Text content
      html += '<div style="flex: 1;">';
      html +=
        '<a href="https://archive.org/details/' +
        id +
        '" target="_blank" rel="noopener noreferrer" style="text-decoration:none;color:#0066cc;font-weight:bold;font-size:1.1em;">';
      html += title;
      html += "</a>";
      html += "</div>";

      html += "</div>"; // Close flex item
    }

    html += "</div>"; // Close flex container
    container.innerHTML = html;
    log("Done! Rendered " + members.length + " items with thumbnails.");
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
