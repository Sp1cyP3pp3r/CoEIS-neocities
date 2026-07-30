// archive-list.js

// 1. Define the callback globally. Handles different response formats from various proxies.
window.handleArchiveList = function (response) {
  const container = document.getElementById("archive-list-container");
  if (!container) return;

  let listData;
  try {
    // Different proxies return data differently. Handle all cases:
    if (typeof response === "string") {
      listData = JSON.parse(response); // Raw string
    } else if (response.contents) {
      listData = JSON.parse(response.contents); // allorigins /get format
    } else {
      listData = response; // Direct JSON (afeld or custom worker)
    }

    if (!listData || !listData.success) {
      container.innerHTML = "<p>Failed to retrieve list data.</p>";
      return;
    }

    const members = listData.value.members;
    if (!members || members.length === 0) {
      container.innerHTML = "<p>No items found in this list.</p>";
      return;
    }

    let html = '<ul style="list-style-type: disc; padding-left: 20px;">';

    for (const member of members) {
      const formattedTitle = member.identifier
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      html += `<li style="margin-bottom: 8px;">
        <a href="https://archive.org/details/${member.identifier}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; color: #0066cc;">
          ${formattedTitle}
        </a>
      </li>`;
    }

    html += "</ul>";
    container.innerHTML = html;
  } catch (error) {
    console.error("Error parsing Archive.org list:", error);
    container.innerHTML =
      '<p style="color: #cc0000;">Failed to load the TTRPGs list. All proxies may be temporarily unavailable.</p>';
  }
};

// 2. Function to try multiple proxies automatically
function tryProxy(index) {
  const container = document.getElementById("archive-list-container");
  if (!container) return;

  const apiUrl = "https://archive.org/services/users/@user_38779/lists/1";

  // List of alternative JSONP proxies to try in order
  const proxies = [
    `https://api.allorigins.win/get?callback=handleArchiveList&url=${encodeURIComponent(apiUrl)}`,
    `https://api.allorigins.win/raw?callback=handleArchiveList&url=${encodeURIComponent(apiUrl)}`,
    `https://jsonp.afeld.me/?url=${encodeURIComponent(apiUrl)}&callback=handleArchiveList`,
    // If you set up the Cloudflare Worker (Option 2), add your URL here:
    // `https://YOUR-WORKER-NAME.workers.dev?url=${encodeURIComponent(apiUrl)}&callback=handleArchiveList`
  ];

  if (index >= proxies.length) {
    container.innerHTML =
      '<p style="color: #cc0000;">All proxy services failed. Please try again later.</p>';
    return;
  }

  const script = document.createElement("script");
  script.src = proxies[index];

  script.onerror = () => {
    script.remove();
    tryProxy(index + 1); // Automatically try the next proxy
  };

  document.head.appendChild(script);
}

// 3. Initialize
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => tryProxy(0));
} else {
  tryProxy(0);
}
