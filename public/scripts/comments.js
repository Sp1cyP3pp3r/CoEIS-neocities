const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwppSLRMgpevtJXv0Dh19g6x4Mrl2Nk5c7e9-gsiVYKjgomy9scFHWAchsqvGSmh_Ns/exec";

let path = window.location.pathname;
if (path === "/" || path === "/index.html" || path === "") path = "index";
else path = path.replace(".html", "").replace(/^\//, "");
const page_url = path;

let sortNewestFirst = true;

// Available reactions
const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

// --- IN-MEMORY DATA STORE ---
// This holds the current state of all comments, including reaction counts.
// It's the single source of truth for the UI, synced with localStorage for user actions
// and with Google Sheets as the persistent backend.
let allCommentsData = [];

// --- LOCAL STORAGE FUNCTIONS FOR USER REACTIONS ---
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

function hasUserReacted(comment_id, reaction) {
  let userReactions = getUserReactions();
  return (
    userReactions[comment_id] && userReactions[comment_id].includes(reaction)
  );
}

// --- DATE FORMATTER ---
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

// --- AVATAR FUNCTION ---
function getAvatarHtml(item, sizeClass) {
  if (item.avatar_url) {
    return `<img src="${escapeHTML(item.avatar_url)}" class="avatar-img ${sizeClass}">`;
  }
  return "";
}

// --- PURE FUNCTION: BUILD REACTIONS SECTION HTML ---
// Takes a comment_id and returns the HTML for its reactions section based on current state
function buildReactionsSectionHtml(commentId) {
  // Find the comment in our in-memory store
  const comment = allCommentsData.find((c) => c.comment_id === commentId);
  if (!comment) return "";

  const reactions = comment.reactions || {};
  const userReactionList = getUserReactions()[commentId] || [];

  let html = '<div class="reactions-section">';

  // Display existing reactions (only those with count > 0)
  const hasAnyReactions = REACTIONS.some(
    (emoji) => (reactions[emoji] || 0) > 0,
  );

  if (hasAnyReactions) {
    html += '<div class="reactions-display">';
    REACTIONS.forEach((emoji) => {
      const count = reactions[emoji] || 0;
      if (count > 0) {
        const reacted = userReactionList.includes(emoji);
        const reactedClass = reacted ? "reacted" : "";
        html += `
                    <button class="reaction-btn ${reactedClass}" data-comment-id="${commentId}" data-reaction="${emoji}">
                        <span class="reaction-emoji">${emoji}</span>
                        <span class="reaction-count">${count}</span>
                    </button>
                `;
      }
    });
    html += "</div>";
  }

  // Add Reaction button
  html += `
        <button class="add-reaction-btn" data-comment-id="${commentId}">
            <span class="add-reaction-icon">+</span> React
        </button>
    `;

  // Hidden picker
  html += '<div class="reactions-picker">';
  REACTIONS.forEach((emoji) => {
    html += `<button class="picker-emoji-btn" data-comment-id="${commentId}" data-reaction="${emoji}">${emoji}</button>`;
  });
  html += "</div>";

  html += "</div>";

  return html;
}

// --- ATTACH ALL REACTION HANDLERS TO A CARD ---
function attachReactionHandlers(card) {
  // Existing reaction buttons (toggle)
  card.querySelectorAll(".reaction-btn").forEach((btn) => {
    btn.onclick = () => handleReactionClick(btn);
  });

  // Add Reaction button (opens picker)
  const addBtn = card.querySelector(".add-reaction-btn");
  if (addBtn) {
    addBtn.onclick = (e) => {
      e.stopPropagation();
      const commentId = addBtn.dataset.commentId;
      // Close any other open pickers
      document.querySelectorAll(".reactions-picker.open").forEach((p) => {
        const parentSection = p.closest(".reactions-section");
        const currentSection = addBtn.closest(".reactions-section");
        if (parentSection !== currentSection) {
          p.classList.remove("open");
        }
      });
      const picker = card.querySelector(".reactions-picker");
      if (picker) picker.classList.toggle("open");
    };
  }

  // Picker emoji buttons
  card.querySelectorAll(".picker-emoji-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      handlePickerReaction(btn);
    };
  });
}

// --- REFRESH A SINGLE COMMENT'S REACTIONS DISPLAY ---
function refreshCommentReactions(commentId) {
  // Find the card in the DOM
  const card = document.querySelector(
    `.comment-card[data-comment-id="${commentId}"], .reply-card[data-comment-id="${commentId}"]`,
  );
  if (!card) return;

  // Find the reactions section
  let reactionsSection = card.querySelector(".reactions-section");

  // Build new HTML
  const newHtml = buildReactionsSectionHtml(commentId);

  if (reactionsSection) {
    reactionsSection.outerHTML = newHtml;
  } else {
    // Insert before the reply button
    const replyBtn = card.querySelector(".reply-btn");
    if (replyBtn) {
      replyBtn.insertAdjacentHTML("beforebegin", newHtml);
    }
  }

  // Re-attach handlers to the newly inserted elements
  attachReactionHandlers(card);
}

// --- RECURSIVE TREE RENDERING ---
function renderCommentTree(comment, allComments, depth = 0) {
  const card = document.createElement("div");
  card.className = depth === 0 ? "comment-card" : "reply-card";
  card.setAttribute("data-comment-id", comment.comment_id); // Add data attribute for easy lookup

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

  // Build reactions section using the pure function
  const reactionsSectionHtml = buildReactionsSectionHtml(comment.comment_id);

  card.innerHTML = `
        ${avatarContainer}
        <div class="comment-body">
            <div class="comment-meta">${metaHtml}</div>
            <div class="comment-text">${escapeHTML(comment.comment_content)}</div>
            ${reactionsSectionHtml}
            <button class="reply-btn">Reply</button>
        </div>
    `;

  card.querySelector(".reply-btn").onclick = () =>
    startReply(comment.comment_id, comment.name);

  // Attach reaction handlers
  attachReactionHandlers(card);

  // Render children
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

// --- SEND REACTION TO BACKEND ---
function sendReactionToBackend(commentId, reaction, action) {
  const reactionUrl = `${GOOGLE_SCRIPT_URL}?action=react&comment_id=${commentId}&reaction=${encodeURIComponent(reaction)}&react_action=${action}&page_url=${page_url}`;

  const reactionScript = document.createElement("script");
  reactionScript.src = reactionUrl;
  document.body.appendChild(reactionScript);

  setTimeout(() => {
    if (reactionScript.parentNode) {
      reactionScript.parentNode.removeChild(reactionScript);
    }
  }, 5000);
}

// --- HANDLE PICKER REACTION (always adds) ---
function handlePickerReaction(btn) {
  const commentId = btn.dataset.commentId;
  const reaction = btn.dataset.reaction;

  // Close the picker
  const picker = btn.closest(".reactions-picker");
  if (picker) picker.classList.remove("open");

  // Find the comment in memory
  const comment = allCommentsData.find((c) => c.comment_id === commentId);
  if (!comment) return;

  // If user already reacted with this emoji, remove it (toggle behavior)
  if (hasUserReacted(commentId, reaction)) {
    removeUserReaction(commentId, reaction);
    if (!comment.reactions) comment.reactions = {};
    if (comment.reactions[reaction]) {
      comment.reactions[reaction]--;
      if (comment.reactions[reaction] <= 0) {
        delete comment.reactions[reaction];
      }
    }
    sendReactionToBackend(commentId, reaction, "remove");
  } else {
    // Add the reaction
    saveUserReaction(commentId, reaction);
    if (!comment.reactions) comment.reactions = {};
    if (!comment.reactions[reaction]) comment.reactions[reaction] = 0;
    comment.reactions[reaction]++;
    sendReactionToBackend(commentId, reaction, "add");
  }

  // Immediately refresh the display from the updated in-memory state
  refreshCommentReactions(commentId);
}

// --- HANDLE REACTION CLICK (toggle existing reaction) ---
function handleReactionClick(btn) {
  const commentId = btn.dataset.commentId;
  const reaction = btn.dataset.reaction;

  // If button is disabled (syncing), ignore the click
  if (btn.disabled) return;

  // Find the comment in memory
  const comment = allCommentsData.find((c) => c.comment_id === commentId);
  if (!comment) return;

  const alreadyReacted = hasUserReacted(commentId, reaction);

  if (alreadyReacted) {
    // Remove the reaction
    removeUserReaction(commentId, reaction);
    if (!comment.reactions) comment.reactions = {};
    if (comment.reactions[reaction]) {
      comment.reactions[reaction]--;
      if (comment.reactions[reaction] <= 0) {
        delete comment.reactions[reaction];
      }
    }
    sendReactionToBackend(commentId, reaction, "remove");
  } else {
    // Add the reaction
    saveUserReaction(commentId, reaction);
    if (!comment.reactions) comment.reactions = {};
    if (!comment.reactions[reaction]) comment.reactions[reaction] = 0;
    comment.reactions[reaction]++;
    sendReactionToBackend(commentId, reaction, "add");
  }

  // Immediately refresh the display from the updated in-memory state
  refreshCommentReactions(commentId);
}

// --- DISPLAY COMMENTS ---
function displayComments(comments) {
  const container = document.getElementById("commentsContainer");
  container.innerHTML = "";

  // Store comments in our in-memory data store
  allCommentsData = comments || [];

  if (allCommentsData.length === 0) {
    container.innerHTML = "<p>No comments yet. Be the first!</p>";
    return;
  }

  let topLevel = allCommentsData.filter(
    (c) => !c.parent_id || c.parent_id === "",
  );
  topLevel.forEach((item) => {
    const tree = renderCommentTree(item, allCommentsData, 0);
    container.appendChild(tree);
  });
}

// --- SORT TOGGLE ---
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

// --- CLOSE PICKERS WHEN CLICKING OUTSIDE ---
document.addEventListener("click", function (e) {
  if (!e.target.closest(".reactions-section")) {
    document.querySelectorAll(".reactions-picker.open").forEach((p) => {
      p.classList.remove("open");
    });
  }
});

// --- FORM LOGIC ---
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
