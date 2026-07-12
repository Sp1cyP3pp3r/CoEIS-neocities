const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbytYx-pHgJSpANyhvEBAcHcOM1wmYjISjXzAHueO3Aos-GpSG_0LZMey9jeDbF3T796/exec";

let path = window.location.pathname;
if (path === "/" || path === "/index.html" || path === "") path = "index";
else path = path.replace(".html", "").replace(/^\//, "");
const page_url = path;

// --- NEW: STATE VARIABLES ---
let allFetchedComments = []; // Stores comments in memory so we can re-sort them
let sortNewestFirst = true; // Tracks the current sort order

// --- NEW: DATE FORMATTER ---
function formatDate(dateInput) {
  if (!dateInput) return "";
  let date = new Date(dateInput);
  if (isNaN(date.getTime())) return ""; // Failsafe for invalid dates

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Returns format: "12 July 2026"
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

// --- AVATAR FUNCTION ---
function getAvatarHtml(item, size) {
  size = size || 60;
  if (item.avatar_url) {
    return `<img src="${escapeHTML(item.avatar_url)}" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:4px;">`;
  }
  return "";
}

// --- RECURSIVE TREE RENDERING ---
function renderCommentTree(comment, allComments, depth = 0) {
  const card = document.createElement("div");

  if (depth === 0) {
    card.className = "comment-card";
    card.style.border = "1px solid #ccc";
    card.style.padding = "15px";
    card.style.marginBottom = "15px";
    card.style.display = "flex";
    card.style.gap = "15px";
  } else {
    card.className = "reply-card";
    const indent = Math.min(depth * 20, 60);
    card.style.marginLeft = indent + "px";
    card.style.marginTop = "10px";
    card.style.padding = "10px";
    card.style.backgroundColor = "#f9f9f9";
    card.style.borderLeft = "3px solid #ccc";
    card.style.display = "flex";
    card.style.gap = "10px";
  }

  const avatarSize = depth === 0 ? 60 : 40;
  const avatarHtml = getAvatarHtml(comment, avatarSize);
  const avatarContainer = avatarHtml
    ? `<div class="comment-avatar">${avatarHtml}</div>`
    : "";

  // 1. Build Name
  let metaHtml = `<strong>${escapeHTML(comment.name)}</strong>`;

  // 2. NEW: Add Date
  const formattedDate = formatDate(comment.timestamp);
  if (formattedDate) {
    metaHtml += ` <span style="font-size: 0.8em; color: #888; font-weight: normal;">• ${formattedDate}</span>`;
  }

  // 3. Add Neocities Link
  if (comment.neocities) {
    let urlStr = comment.neocities.trim();
    if (!urlStr.startsWith("http")) urlStr = "https://" + urlStr;
    try {
      let domain = new URL(urlStr).hostname;
      let cleanDomain = domain.replace(/^www\./, "");
      let faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
      metaHtml += ` | <a href="${escapeHTML(urlStr)}" target="_blank" rel="noopener" style="text-decoration: none; color: #0066cc;">
                            <img src="${faviconUrl}" style="width:16px; height:16px; vertical-align:middle; margin-right:4px; border-radius:2px;">
                            ${escapeHTML(cleanDomain)}
                          </a>`;
    } catch (e) {
      metaHtml += ` | <a href="${escapeHTML(urlStr)}" target="_blank" rel="noopener">🔗 Visit Site</a>`;
    }
  }

  // 4. Mood & Reply Tag
  if (comment.mood) {
    metaHtml += `<br><em style="font-size: 0.9em; color: #666;">🎧 ${escapeHTML(comment.mood)}</em>`;
  }
  if (depth > 0) {
    metaHtml += ` <em style="font-size:0.8em; color:#888;">(reply)</em>`;
  }

  card.innerHTML = `
        ${avatarContainer}
        <div class="comment-body" style="flex: 1;">
            <div class="comment-meta">${metaHtml}</div>
            <div class="comment-text" style="margin: 10px 0; white-space: pre-wrap;">${escapeHTML(comment.comment_content)}</div>
            <button class="reply-btn" style="font-size: 0.8em; cursor: pointer; background: none; border: none; color: #0066cc; text-decoration: underline;">Reply</button>
        </div>
    `;

  card.querySelector(".reply-btn").onclick = () =>
    startReply(comment.comment_id, comment.name);

  // Find children (Replies). We use the SORTED allComments array so replies are sorted chronologically too!
  const children = allComments.filter(
    (c) => c.parent_id === comment.comment_id,
  );
  children.forEach((child) => {
    const childElement = renderCommentTree(child, allComments, depth + 1);
    card.querySelector(".comment-body").appendChild(childElement);
  });

  return card;
}

// --- NEW: MAIN RENDER & SORT FUNCTION ---
function renderComments() {
  const container = document.getElementById("commentsContainer");

  if (allFetchedComments.length === 0) {
    container.innerHTML =
      "<h3>What Visitors Said...</h3><p>No comments yet. Be the first!</p>";
    return;
  }

  // 1. Create a copy of the array and sort it based on the toggle state
  let sortedComments = [...allFetchedComments];
  sortedComments.sort((a, b) => {
    let dateA = new Date(a.timestamp);
    let dateB = new Date(b.timestamp);
    // If newest first, subtract A from B. If oldest first, subtract B from A.
    return sortNewestFirst ? dateB - dateA : dateA - dateB;
  });

  // 2. Clear the container and add the header
  container.innerHTML = "<h3>What Visitors Said...</h3>";

  // 3. Find top-level comments from the SORTED list
  let topLevel = sortedComments.filter(
    (c) => !c.parent_id || c.parent_id === "",
  );

  // 4. Render the tree
  topLevel.forEach((item) => {
    // We pass 'sortedComments' down so that replies are also in the correct order!
    const tree = renderCommentTree(item, sortedComments, 0);
    container.appendChild(tree);
  });
}

// --- UPDATED DISPLAY FUNCTION (Triggered by JSONP) ---
function displayComments(comments) {
  allFetchedComments = comments || []; // Save to memory
  renderComments(); // Initial render
}

// --- NEW: TOGGLE BUTTON LOGIC ---
// We listen for clicks on the whole document, but only act if the button was clicked
document.addEventListener("click", function (e) {
  if (e.target && e.target.id === "sortToggleBtn") {
    // Flip the boolean
    sortNewestFirst = !sortNewestFirst;

    // Update button text
    e.target.innerText = sortNewestFirst
      ? "Sort: Newest First"
      : "Sort: Oldest First";

    // Re-render the comments instantly
    renderComments();
  }
});

// --- FORM LOGIC ---
function startReply(parentId, parentName) {
  document.getElementById("parent_id").value = parentId;
  document.getElementById("comment_content").placeholder =
    `Replying to ${parentName}...`;
  document.getElementById("submitBtn").innerText = "Post Reply";
  document.getElementById("cancelReplyBtn").style.display = "inline-block";
  document
    .getElementById("guestbookForm")
    .scrollIntoView({ behavior: "smooth" });
}

function cancelReply() {
  document.getElementById("parent_id").value = "";
  document.getElementById("comment_content").placeholder = "Leave a comment...";
  document.getElementById("submitBtn").innerText = "Post Comment";
  document.getElementById("cancelReplyBtn").style.display = "none";
}

document
  .getElementById("cancelReplyBtn")
  .addEventListener("click", cancelReply);

// --- BULLETPROOF SUBMISSION ---
document
  .getElementById("guestbookForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const submitBtn = document.getElementById("submitBtn");
    const statusText = document.getElementById("formStatus");

    submitBtn.disabled = true;
    statusText.style.display = "block";
    statusText.innerText = "Saving...";

    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value : "";
    };

    const neocities = encodeURIComponent(getVal("neocities"));
    const name = encodeURIComponent(getVal("name"));
    const email = encodeURIComponent(getVal("email"));

    let comment_content = getVal("comment_content");
    if (!comment_content) comment_content = getVal("comment");
    comment_content = encodeURIComponent(comment_content);

    const parent_id = getVal("parent_id");
    const avatar_url = encodeURIComponent(getVal("avatar_url"));
    const mood = encodeURIComponent(getVal("mood"));

    const submissionUrl = `${GOOGLE_SCRIPT_URL}?neocities=${neocities}&name=${name}&email=${email}&comment_content=${comment_content}&parent_id=${parent_id}&avatar_url=${avatar_url}&mood=${mood}&page_url=${page_url}&callback=handleSubmissionResponse`;

    const submitScript = document.createElement("script");
    submitScript.id = "tempSubmitScript";
    submitScript.src = submissionUrl;
    document.body.appendChild(submitScript);
  });

function handleSubmissionResponse(response) {
  const statusText = document.getElementById("formStatus");
  const submitBtn = document.getElementById("submitBtn");

  if (response.status === "success") {
    statusText.style.color = "green";
    statusText.innerText = response.message;
    document.getElementById("guestbookForm").reset();
    cancelReply();
    setTimeout(() => {
      location.reload();
    }, 1500);
  } else {
    statusText.style.color = "red";
    statusText.innerText = response.message || "An error occurred.";
  }
  submitBtn.disabled = false;
  const tempScript = document.getElementById("tempSubmitScript");
  if (tempScript) tempScript.remove();
}

// Load initial comments
const loadScript = document.createElement("script");
loadScript.src = `${GOOGLE_SCRIPT_URL}?callback=displayComments&page_url=${page_url}`;
document.body.appendChild(loadScript);

// XSS Protection
function escapeHTML(str) {
  if (!str) return "";
  return str.toString().replace(
    /[&<>'"]/g,
    (tag) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[tag] || tag,
  );
}
