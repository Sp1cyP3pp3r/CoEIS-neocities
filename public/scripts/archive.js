(function () {
  "use strict";

  const PROXY_URL = "https://fragrant-feather-c731.niktoktoto21.workers.dev/";

  function renderList(container, data) {
    if (!data || !data.success || !data.value || !data.value.members) {
      container.innerHTML = '<p class="archive-error">Error loading list.</p>';
      return;
    }

    const members = data.value.members;
    if (members.length === 0) {
      container.innerHTML = "<p>No items found.</p>";
      return;
    }

    let html = '<ul class="archive-list">';

    for (let i = 0; i < members.length; i++) {
      const item = members[i];
      const identifier = item.identifier || "unknown";
      const meta = item.metadata || {};

      let title = meta.title;
      if (Array.isArray(title)) title = title.join(" ");
      if (!title) title = identifier;

      let creator = meta.creator;
      if (Array.isArray(creator)) creator = creator.join(", ");

      const thumb = "https://archive.org/services/img/" + identifier;
      const link = "https://archive.org/details/" + identifier;

      html += '<li class="archive-item">';
      html +=
        '<a href="' + link + '" target="_blank" rel="noopener noreferrer">';
      html +=
        '<img src="' +
        thumb +
        '" alt="' +
        title +
        '" class="archive-thumb" width="120" />';
      html += "</a>";
      html += '<div class="archive-info">';
      html +=
        '<a href="' +
        link +
        '" target="_blank" rel="noopener noreferrer" class="archive-title">' +
        title +
        "</a>";
      if (creator) {
        html += '<div class="archive-creator">by ' + creator + "</div>";
      }
      html += "</div>";
      html += "</li>";
    }

    html += "</ul>";
    container.innerHTML = html;
  }

  function init() {
    const containers = document.querySelectorAll(
      ".archive-list-container[data-target-archive-list]",
    );
    if (containers.length === 0) {
      setTimeout(init, 500);
      return;
    }

    containers.forEach(function (container) {
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
        container.innerHTML =
          '<p class="archive-error">Error loading data.</p>';
        script.remove();
        delete window[cbName];
      };

      document.head.appendChild(script);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
