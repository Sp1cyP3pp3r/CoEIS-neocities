// Internet Archive org
// 1. Define the callback globally so the JSONP proxy can execute it
window.handleArchiveList = function (response) {
  const container = document.getElementById("archive-list-container");
  if (!container) return;

  try {
    // The proxy returns the actual API response as a stringified JSON in the 'contents' property
    const listData = JSON.parse(response.contents);

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
      // Format the identifier to look like a readable title (e.g., "mage-20th..." -> "Mage 20th...")
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
      '<p style="color: #cc0000;">Failed to load the TTRPGs list. The proxy service may be temporarily unavailable.</p>';
  }
};

// 2. Function to initiate the JSONP request
function loadArchiveList() {
  const container = document.getElementById("archive-list-container");
  if (!container) return;

  // Prevent duplicate script tags if the function is called multiple times
  if (document.getElementById("archive-jsonp-script")) return;

  const apiUrl = "https://archive.org/services/users/@user_38779/lists/1";
  // Use allorigins.win to wrap the JSON response in our callback function
  const proxyUrl = `https://api.allorigins.win/get?callback=handleArchiveList&url=${encodeURIComponent(apiUrl)}`;

  const script = document.createElement("script");
  script.id = "archive-jsonp-script";
  script.src = proxyUrl;

  // Handle network errors (e.g., proxy is temporarily down)
  script.onerror = function () {
    container.innerHTML =
      '<p style="color: #cc0000;">Failed to load the TTRPGs list. Network error.</p>';
  };

  document.head.appendChild(script);
}

// 3. Run the function as soon as the DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadArchiveList);
} else {
  loadArchiveList();
}
