const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbytYx-pHgJSpANyhvEBAcHcOM1wmYjISjXzAHueO3Aos-GpSG_0LZMey9jeDbF3T796/exec";
let path = window.location.pathname;
if (path === "/" || path === "/index.html" || path === "") path = "index";
else path = path.replace(".html", "").replace(/^\//, "");
const page_url = path;

// --- SMART AVATAR FUNCTION ---
// --- SMART AVATAR FUNCTION (FIXED) ---
function getAvatarHtml(item, size) {
  size = size || 60;

  // Separate the image styles from the fallback styles
  let imgStyle = `width:${size}px;height:${size}px;object-fit:cover;border-radius:4px;`;
  let fallbackStyle = `width:${size}px;height:${size}px;background:#eee;align-items:center;justify-content:center;border-radius:4px;`;

  // 1. Priority: Custom Avatar URL
  if (item.avatar_url) {
    // The fallback div is hidden by default. If the image fails to load, onerror hides the img and shows the fallback.
    return `<img src="${escapeHTML(item.avatar_url)}" style="${imgStyle}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                <div style="display:none;${fallbackStyle}">👤</div>`;
  }

  // 2. Priority: Scrape Favicon from Neocities Link
  if (item.neocities) {
    try {
      let urlStr = item.neocities;
      if (!urlStr.startsWith("http")) urlStr = "https://" + urlStr;
      let domain = new URL(urlStr).hostname;

      // Added onerror here too, just in case the favicon API fails!
      return `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=${size}" style="${imgStyle}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                    <div style="display:none;${fallbackStyle}">👤</div>`;
    } catch (e) {}
  }

  // 3. Fallback: Default Emoji
  return `<div style="display:flex;${fallbackStyle}">👤</div>`;
}

// --- RECURSIVE TREE RENDERING ---
function renderCommentTree(comment, allComments, depth = 0) {
  const card = document.createElement("div");

  // 1. Styling based on depth
  if (depth === 0) {
    card.className = "comment-card";
    card.style.border = "1px solid #ccc";
    card.style.padding = "15px";
    card.style.marginBottom = "15px";
    card.style.display = "flex";
    card.style.gap = "15px";
  } else {
    card.className = "reply-card";
    const indent = Math.min(depth * 20, 60); // Cap visual indent at 60px so it doesn't go off-screen
    card.style.marginLeft = indent + "px";
    card.style.marginTop = "10px";
    card.style.padding = "10px";
    card.style.backgroundColor = "#f9f9f9";
    card.style.borderLeft = "3px solid #ccc";
    card.style.display = "flex";
    card.style.gap = "10px";
  }

  // 2. Build Avatar and Meta Info
  const avatarSize = depth === 0 ? 60 : 40;
  const avatarHtml = getAvatarHtml(comment, avatarSize);

  let metaHtml = `<strong>${escapeHTML(comment.name)}</strong>`;
  if (comment.neocities) {
    let urlStr = comment.neocities;
    if (!urlStr.startsWith("http")) urlStr = "https://" + urlStr;
    metaHtml += ` | <a href="${escapeHTML(urlStr)}" target="_blank" rel="noopener">🔗 Visit Site</a>`;
  }
  if (comment.mood) {
    metaHtml += `<br><em style="font-size: 0.9em; color: #666;">${escapeHTML(comment.mood)}</em>`;
  }
  if (depth > 0) {
    metaHtml += ` <em style="font-size:0.8em; color:#888;">(reply)</em>`;
  }

  // 3. Assemble the HTML
  card.innerHTML = `
        <div class="comment-avatar">${avatarHtml}</div>
        <div class="comment-body" style="flex: 1;">
            <div class="comment-meta">${metaHtml}</div>
            <div class="comment-text" style="margin: 10px 0; white-space: pre-wrap;">${escapeHTML(comment.comment_content)}</div>
            <button class="reply-btn" style="font-size: 0.8em; cursor: pointer; background: none; border: none; color: #0066cc; text-decoration: underline;">Reply</button>
        </div>
    `;

  // 4. Attach Reply Button Logic
  // This works for ANY comment, no matter how deep it is!
  card.querySelector(".reply-btn").onclick = () =>
    startReply(comment.comment_id, comment.name);

  // 5. Find and render children (Replies to this specific comment)
  const children = allComments.filter(
    (c) => c.parent_id === comment.comment_id,
  );
  children.forEach((child) => {
    // Recursively call this function for the child, increasing the depth
    const childElement = renderCommentTree(child, allComments, depth + 1);
    // Append it inside the .comment-body so it aligns with the text, not the avatar
    card.querySelector(".comment-body").appendChild(childElement);
  });

  return card;
}

// --- MAIN DISPLAY FUNCTION ---
function displayComments(comments) {
  const container = document.getElementById("commentsContainer");
  if (!comments || comments.length === 0) {
    container.innerHTML = "<p>No comments yet. Be the first!</p>";
    return;
  }

  container.innerHTML = "<h3>What Visitors Said...</h3>";

  // Find only the top-level comments (those with no parent)
  let topLevel = comments.filter((c) => !c.parent_id || c.parent_id === "");

  // Render the tree for each top-level comment
  topLevel.forEach((item) => {
    const tree = renderCommentTree(item, comments, 0);
    container.appendChild(tree);
  });
}

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
