const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbytYx-pHgJSpANyhvEBAcHcOM1wmYjISjXzAHueO3Aos-GpSG_0LZMey9jeDbF3T796/exec";

let path = window.location.pathname;
if (path === "/" || path === "/index.html" || path === "") path = "index";
else path = path.replace(".html", "").replace(/^\//, "");
const page_url = path;

// --- SMART AVATAR FUNCTION ---
function getAvatarHtml(item, size) {
  size = size || 60;
  let defaultStyle = `width:${size}px;height:${size}px;background:#eee;display:flex;align-items:center;justify-content:center;border-radius:4px;`;

  // 1. Priority: Custom Avatar URL
  if (item.avatar_url) {
    return `<img src="${escapeHTML(item.avatar_url)}" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:4px;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                <div style="display:none;${defaultStyle}">👤</div>`;
  }

  // 2. Priority: Scrape Favicon from Neocities Link
  if (item.neocities) {
    try {
      let urlStr = item.neocities;
      // Auto-add https:// if the user forgot it
      if (!urlStr.startsWith("http")) urlStr = "https://" + urlStr;
      let domain = new URL(urlStr).hostname;

      // Google's free, instant favicon API
      return `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=${size}" style="width:${size}px;height:${size}px;object-fit:cover;border-radius:4px;">`;
    } catch (e) {
      // If URL parsing fails, fallback to default
    }
  }

  // 3. Fallback: Default Emoji
  return `<div style="${defaultStyle}">👤</div>`;
}

function displayComments(comments) {
  const container = document.getElementById("commentsContainer");
  if (!comments || comments.length === 0) {
    container.innerHTML = "<p>No comments yet. Be the first!</p>";
    return;
  }

  container.innerHTML = "<h3>What Visitors Said...</h3>";

  let topLevel = comments.filter((c) => !c.parent_id || c.parent_id === "");
  let replies = comments.filter((c) => c.parent_id && c.parent_id !== "");

  topLevel.forEach((item) => {
    const card = document.createElement("div");
    card.className = "comment-card";
    card.style.display = "flex";
    card.style.gap = "15px";
    card.style.border = "1px solid #ccc";
    card.style.padding = "15px";
    card.style.marginBottom = "15px";

    // Get Avatar (Favicon or Custom)
    let avatarHtml = getAvatarHtml(item, 60);

    // Build Meta Info
    let metaHtml = `<strong>${escapeHTML(item.name)}</strong>`;

    if (item.neocities) {
      let urlStr = item.neocities;
      if (!urlStr.startsWith("http")) urlStr = "https://" + urlStr;
      metaHtml += ` | <a href="${escapeHTML(urlStr)}" target="_blank" rel="noopener">🔗 Visit Site</a>`;
    }

    if (item.mood) {
      metaHtml += `<br><em style="font-size: 0.9em; color: #666;">🎧 ${escapeHTML(item.mood)}</em>`;
    }

    // Assemble Card
    card.innerHTML = `
            <div class="comment-avatar">${avatarHtml}</div>
            <div class="comment-body" style="flex: 1;">
                <div class="comment-meta">${metaHtml}</div>
                <div class="comment-text" style="margin: 10px 0; white-space: pre-wrap;">${escapeHTML(item.comment_content)}</div>
                <button class="reply-btn" style="font-size: 0.8em; cursor: pointer; background: none; border: none; color: #0066cc; text-decoration: underline;">Reply</button>
            </div>
        `;

    card.querySelector(".reply-btn").onclick = () =>
      startReply(item.comment_id, item.name);

    // Render Replies
    let itemReplies = replies.filter((r) => r.parent_id === item.comment_id);
    itemReplies.forEach((reply) => {
      const replyCard = document.createElement("div");
      replyCard.className = "reply-card";
      replyCard.style.marginTop = "10px";
      replyCard.style.padding = "10px";
      replyCard.style.backgroundColor = "#f9f9f9";
      replyCard.style.borderLeft = "3px solid #ccc";
      replyCard.style.display = "flex";
      replyCard.style.gap = "10px";

      let replyAvatar = getAvatarHtml(reply, 40); // Smaller avatar for replies

      replyCard.innerHTML = `
                <div>${replyAvatar}</div>
                <div style="flex:1;">
                    <strong>${escapeHTML(reply.name)}</strong> <em style="font-size:0.8em;">(reply)</em>
                    <div style="margin-top: 5px; white-space: pre-wrap;">${escapeHTML(reply.comment_content)}</div>
                </div>
            `;
      card.querySelector(".comment-body").appendChild(replyCard);
    });

    container.appendChild(card);
  });
}

// --- Form Logic ---
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

document
  .getElementById("guestbookForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();
    const submitBtn = document.getElementById("submitBtn");
    const statusText = document.getElementById("formStatus");

    submitBtn.disabled = true;
    statusText.style.display = "block";
    statusText.innerText = "Saving...";

    // --- BULLETPROOF FIELD GRABBING ---
    // This helper function safely checks if an element exists.
    // If it doesn't, it returns an empty string instead of crashing!
    const getVal = (id) => {
      const el = document.getElementById(id);
      return el ? el.value : "";
    };

    const neocities = encodeURIComponent(getVal("neocities"));
    const name = encodeURIComponent(getVal("name"));
    const email = encodeURIComponent(getVal("email"));

    // Fallback: If your HTML still uses id="comment", this will catch it!
    let comment_content = getVal("comment_content");
    if (!comment_content) comment_content = getVal("comment");
    comment_content = encodeURIComponent(comment_content);

    const parent_id = getVal("parent_id");
    const avatar_url = encodeURIComponent(getVal("avatar_url"));
    const mood = encodeURIComponent(getVal("mood"));

    // Build the URL to send to Google
    const submissionUrl = `${GOOGLE_SCRIPT_URL}?neocities=${neocities}&name=${name}&email=${email}&comment_content=${comment_content}&parent_id=${parent_id}&avatar_url=${avatar_url}&mood=${mood}&page_url=${page_url}&callback=handleSubmissionResponse`;

    // Send the data via JSONP
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
