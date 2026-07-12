const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwppSLRMgpevtJXv0Dh19g6x4Mrl2Nk5c7e9-gsiVYKjgomy9scFHWAchsqvGSmh_Ns/exec";

let path = window.location.pathname;
if (path === "/" || path === "/index.html" || path === "") path = "index";
else path = path.replace(".html", "").replace(/^\//, "");
const page_url = path;

let sortNewestFirst = true;

// Available reactions
const REACTIONS = ["👍", "❤️", "💀"];

// Track which reactions the user has given (stored in localStorage)
function getUserReactions() {
  try {
    return JSON.parse(localStorage.getItem("userReactions") || "{}");
  } catch (e) {
    return {};
  }
}

function saveUserReaction(comment_id, reaction) {
  let userReactions = getUserReactions();
  if (!userReactions[comment_id]) userReactions[comment_id] = [];
  if (!userReactions[comment_id].includes(reaction)) {
    userReactions[comment_id].push(reaction);
    localStorage.setItem("userReactions", JSON.stringify(userReactions));
  }
}

function hasUserReacted(comment_id, reaction) {
  let userReactions = getUserReactions();
  return (
    userReactions[comment_id] && userReactions[comment_id].includes(reaction)
  );
}

function formatDate(dateInput) {
  if (!dateInput) return "";
  let date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";
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
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

function getAvatarHtml(item, sizeClass) {
  if (item.avatar_url) {
    return `<img src="${escapeHTML(item.avatar_url)}" class="avatar-img ${sizeClass}">`;
  }
  return "";
}

function renderCommentTree(comment, allComments, depth = 0) {
  const card = document.createElement("div");
  card.className = depth === 0 ? "comment-card" : "reply-card";

  if (depth > 0) {
    const indent = Math.min(depth * 20, 60);
    card.style.setProperty("--indent", indent + "px");
  }

  const avatarSizeClass = depth === 0 ? "avatar-large" : "avatar-small";
  const avatarHtml = getAvatarHtml(comment, avatarSizeClass);
  const avatarContainer = avatarHtml
    ? `<div class="comment-avatar">${avatarHtml}</div>`
    : "";

  let metaHtml = `<strong>${escapeHTML(comment.name)}</strong>`;

  const formattedDate = formatDate(comment.timestamp);
  if (formattedDate) {
    metaHtml += ` <span class="comment-date">• ${formattedDate}</span>`;
  }

  if (comment.neocities) {
    let urlStr = comment.neocities.trim();
    if (!urlStr.startsWith("http")) urlStr = "https://" + urlStr;
    try {
      let domain = new URL(urlStr).hostname;
      let cleanDomain = domain.replace(/^www\./, "");
      let faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;

      metaHtml += ` | <a href="${escapeHTML(urlStr)}" target="_blank" rel="noopener" class="comment-link">
                            <img src="${faviconUrl}" class="comment-favicon">
                            ${escapeHTML(cleanDomain)}
                          </a>`;
    } catch (e) {
      metaHtml += ` | <a href="${escapeHTML(urlStr)}" target="_blank" rel="noopener" class="comment-link">🔗 Visit Site</a>`;
    }
  }

  if (comment.mood) {
    metaHtml += `<br><em class="comment-mood">🎧 ${escapeHTML(comment.mood)}</em>`;
  }
  if (depth > 0) {
    metaHtml += ` <em class="reply-tag">(reply)</em>`;
  }

  // Build reactions HTML
  let reactionsHtml = '<div class="reactions-container">';
  REACTIONS.forEach((emoji) => {
    const count = comment.reactions[emoji] || 0;
    const reacted = hasUserReacted(comment.comment_id, emoji);
    const reactedClass = reacted ? "reacted" : "";

    reactionsHtml += `
            <button class="reaction-btn ${reactedClass}" data-comment-id="${comment.comment_id}" data-reaction="${emoji}">
                <span class="reaction-emoji">${emoji}</span>
                <span class="reaction-count">${count}</span>
            </button>
        `;
  });
  reactionsHtml += "</div>";

  card.innerHTML = `
        ${avatarContainer}
        <div class="comment-body">
            <div class="comment-meta">${metaHtml}</div>
            <div class="comment-text">${escapeHTML(comment.comment_content)}</div>
            ${reactionsHtml}
            <button class="reply-btn">Reply</button>
        </div>
    `;

  card.querySelector(".reply-btn").onclick = () =>
    startReply(comment.comment_id, comment.name);

  // Attach reaction button handlers
  card.querySelectorAll(".reaction-btn").forEach((btn) => {
    btn.onclick = () => handleReactionClick(btn);
  });

  const children = allComments.filter(
    (c) => c.parent_id === comment.comment_id,
  );

  if (children.length > 0) {
    const repliesWrapper = document.createElement("div");
    repliesWrapper.className = "replies-wrapper";

    children.forEach((child) => {
      const childElement = renderCommentTree(child, allComments, depth + 1);
      repliesWrapper.appendChild(childElement);
    });

    card.querySelector(".comment-body").appendChild(repliesWrapper);
  }

  return card;
}

// --- UPDATED: HANDLE REACTION CLICK (TOGGLE) ---
function handleReactionClick(btn) {
  const commentId = btn.dataset.commentId;
  const reaction = btn.dataset.reaction;

  const alreadyReacted = hasUserReacted(commentId, reaction);
  const action = alreadyReacted ? "remove" : "add";

  // Send reaction to backend with action parameter
  const reactionUrl = `${GOOGLE_SCRIPT_URL}?action=react&comment_id=${commentId}&reaction=${encodeURIComponent(reaction)}&react_action=${action}&page_url=${page_url}&callback=handleReactionResponse`;

  const reactionScript = document.createElement("script");
  reactionScript.id = "tempReactionScript";
  reactionScript.src = reactionUrl;
  document.body.appendChild(reactionScript);

  // Store the button reference and action for the callback
  window.pendingReactionBtn = btn;
  window.pendingReactionAction = action;
}

// --- UPDATED: HANDLE REACTION RESPONSE ---
function handleReactionResponse(response) {
  const btn = window.pendingReactionBtn;
  const action = window.pendingReactionAction;
  if (!btn) return;

  if (response.status === "success") {
    const reaction = btn.dataset.reaction;
    const commentId = btn.dataset.commentId;

    // Update count
    const countSpan = btn.querySelector(".reaction-count");
    const newCount = response.reactions[reaction] || 0;
    countSpan.textContent = newCount;

    if (action === "add") {
      // Mark as reacted
      btn.classList.add("reacted");
      saveUserReaction(commentId, reaction);
    } else {
      // Remove reacted state
      btn.classList.remove("reacted");
      removeUserReaction(commentId, reaction);
    }
  } else {
    alert("Error: " + (response.message || "Could not update reaction"));
  }

  // Clean up
  const tempScript = document.getElementById("tempReactionScript");
  if (tempScript) tempScript.remove();
  window.pendingReactionBtn = null;
  window.pendingReactionAction = null;
}

function removeUserReaction(comment_id, reaction) {
  let userReactions = getUserReactions();
  if (userReactions[comment_id]) {
    userReactions[comment_id] = userReactions[comment_id].filter(
      (r) => r !== reaction,
    );
    if (userReactions[comment_id].length === 0) {
      delete userReactions[comment_id];
    }
    localStorage.setItem("userReactions", JSON.stringify(userReactions));
  }
}

function displayComments(comments) {
  const container = document.getElementById("commentsContainer");
  container.innerHTML = "";

  if (!comments || comments.length === 0) {
    container.innerHTML = "<p>No comments yet. Be the first!</p>";
    return;
  }

  let topLevel = comments.filter((c) => !c.parent_id || c.parent_id === "");
  topLevel.forEach((item) => {
    const tree = renderCommentTree(item, comments, 0);
    container.appendChild(tree);
  });
}

document.addEventListener("click", function (e) {
  if (e.target && e.target.id === "sortToggleBtn") {
    sortNewestFirst = !sortNewestFirst;
    e.target.innerText = sortNewestFirst
      ? "Sort: Newest First"
      : "Sort: Oldest First";

    const newDirection = sortNewestFirst ? "column-reverse" : "column";
    document
      .getElementById("commentsContainer")
      .style.setProperty("--flex-direction", newDirection);
  }
});

function startReply(parentId, parentName) {
  document.getElementById("parent_id").value = parentId;
  document.getElementById("comment_content").placeholder =
    `Replying to ${parentName}...`;
  document.getElementById("submitBtn").innerText = "Post Reply";
  document.getElementById("cancelReplyBtn").classList.add("visible");
  document
    .getElementById("guestbookForm")
    .scrollIntoView({ behavior: "smooth" });
}

function cancelReply() {
  document.getElementById("parent_id").value = "";
  document.getElementById("comment_content").placeholder = "Leave a comment...";
  document.getElementById("submitBtn").innerText = "Post Comment";
  document.getElementById("cancelReplyBtn").classList.remove("visible");
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
    statusText.classList.add("visible");
    statusText.classList.remove("success", "error");
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
    statusText.classList.add("success");
    statusText.innerText = response.message;
    document.getElementById("guestbookForm").reset();
    cancelReply();
    setTimeout(() => {
      location.reload();
    }, 1500);
  } else {
    statusText.classList.add("error");
    statusText.innerText = response.message || "An error occurred.";
  }
  submitBtn.disabled = false;
  const tempScript = document.getElementById("tempSubmitScript");
  if (tempScript) tempScript.remove();
}

const loadScript = document.createElement("script");
loadScript.src = `${GOOGLE_SCRIPT_URL}?callback=displayComments&page_url=${page_url}`;
document.body.appendChild(loadScript);

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
