const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwppSLRMgpevtJXv0Dh19g6x4Mrl2Nk5c7e9-gsiVYKjgomy9scFHWAchsqvGSmh_Ns/exec";

let path = window.location.pathname;
if (path === "/" || path === "/index.html" || path === "") path = "index";
else path = path.replace(".html", "").replace(/^\//, "");
const page_url = path;

let sortNewestFirst = true;

// Available reactions
const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

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

// --- RECURSIVE TREE RENDERING ---
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

  // --- NEW: Build reactions section with picker ---
  let reactionsSectionHtml = '<div class="reactions-section">';

  // 1. Display existing reactions (only if there are any)
  const hasAnyReactions = REACTIONS.some(
    (emoji) => (comment.reactions[emoji] || 0) > 0,
  );

  if (hasAnyReactions) {
    reactionsSectionHtml += '<div class="reactions-display">';
    REACTIONS.forEach((emoji) => {
      const count = comment.reactions[emoji] || 0;
      if (count > 0) {
        const reacted = hasUserReacted(comment.comment_id, emoji);
        const reactedClass = reacted ? "reacted" : "";
        reactionsSectionHtml += `
                    <button class="reaction-btn ${reactedClass}" data-comment-id="${comment.comment_id}" data-reaction="${emoji}">
                        <span class="reaction-emoji">${emoji}</span>
                        <span class="reaction-count">${count}</span>
                    </button>
                `;
      }
    });
    reactionsSectionHtml += "</div>";
  }

  // 2. Add Reaction button (always visible)
  reactionsSectionHtml += `
        <button class="add-reaction-btn" data-comment-id="${comment.comment_id}">
            <span class="add-reaction-icon">+</span> React
        </button>
    `;

  // 3. Hidden reactions picker menu
  reactionsSectionHtml += '<div class="reactions-picker">';
  REACTIONS.forEach((emoji) => {
    reactionsSectionHtml += `<button class="picker-emoji-btn" data-comment-id="${comment.comment_id}" data-reaction="${emoji}">${emoji}</button>`;
  });
  reactionsSectionHtml += "</div>";

  reactionsSectionHtml += "</div>";

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

  // Attach handlers for existing reaction buttons (toggle)
  card.querySelectorAll(".reaction-btn").forEach((btn) => {
    btn.onclick = () => handleReactionClick(btn);
  });

  // Attach handler for "Add Reaction" button (opens picker)
  const addBtn = card.querySelector(".add-reaction-btn");
  addBtn.onclick = (e) => {
    e.stopPropagation();
    // Close any other open pickers first
    document.querySelectorAll(".reactions-picker.open").forEach((p) => {
      if (p !== card.querySelector(".reactions-picker")) {
        p.classList.remove("open");
      }
    });
    card.querySelector(".reactions-picker").classList.toggle("open");
  };

  // Attach handlers for picker emoji buttons
  card.querySelectorAll(".picker-emoji-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      handlePickerReaction(btn);
    };
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

// --- UPDATED: HANDLE PICKER REACTION ---
function handlePickerReaction(btn) {
  const commentId = btn.dataset.commentId;
  const reaction = btn.dataset.reaction;

  const picker = btn.closest(".reactions-picker");
  if (picker) picker.classList.remove("open");

  if (hasUserReacted(commentId, reaction)) {
    removeUserReaction(commentId, reaction);
    sendReactionToBackend(commentId, reaction, "remove");
    refreshCommentReactions(commentId, reaction, "remove");
  } else {
    saveUserReaction(commentId, reaction);
    sendReactionToBackend(commentId, reaction, "add");
    refreshCommentReactions(commentId, reaction, "add");
  }
}

// --- UPDATED: REFRESH A SINGLE COMMENT'S REACTIONS DISPLAY ---
function refreshCommentReactions(commentId, changedReaction, action) {
  const addBtn = document.querySelector(
    `.add-reaction-btn[data-comment-id="${commentId}"]`,
  );
  if (!addBtn) return;

  const card = addBtn.closest(".comment-card, .reply-card");
  if (!card) return;

  const userReactions = getUserReactions();
  const userReactionList = userReactions[commentId] || [];

  // Get current counts from existing buttons in the DOM
  const reactions = {};
  card.querySelectorAll(".reaction-btn").forEach((btn) => {
    const emoji = btn.dataset.reaction;
    const count =
      parseInt(btn.querySelector(".reaction-count").textContent) || 0;
    if (count > 0) reactions[emoji] = count;
  });

  // Apply the action to adjust the count
  if (changedReaction && action) {
    if (action === "add") {
      if (!reactions[changedReaction]) reactions[changedReaction] = 0;
      reactions[changedReaction]++;
    } else if (action === "remove") {
      if (reactions[changedReaction]) {
        reactions[changedReaction]--;
        if (reactions[changedReaction] <= 0) {
          delete reactions[changedReaction];
        }
      }
    }
  }

  // Ensure all user reactions are represented
  userReactionList.forEach((emoji) => {
    if (!reactions[emoji]) {
      reactions[emoji] = 1;
    }
  });

  // Rebuild the reactions section
  const reactionsSection = card.querySelector(".reactions-section");
  if (!reactionsSection) return;

  let newHtml = "";

  const hasAnyReactions = Object.keys(reactions).length > 0;
  if (hasAnyReactions) {
    newHtml += '<div class="reactions-display">';
    REACTIONS.forEach((emoji) => {
      const count = reactions[emoji] || 0;
      if (count > 0) {
        const reacted = userReactionList.includes(emoji);
        const reactedClass = reacted ? "reacted" : "";
        newHtml += `
                    <button class="reaction-btn ${reactedClass}" data-comment-id="${commentId}" data-reaction="${emoji}">
                        <span class="reaction-emoji">${emoji}</span>
                        <span class="reaction-count">${count}</span>
                    </button>
                `;
      }
    });
    newHtml += "</div>";
  }

  newHtml += `
        <button class="add-reaction-btn" data-comment-id="${commentId}">
            <span class="add-reaction-icon">+</span> React
        </button>
    `;

  newHtml += '<div class="reactions-picker">';
  REACTIONS.forEach((emoji) => {
    newHtml += `<button class="picker-emoji-btn" data-comment-id="${commentId}" data-reaction="${emoji}">${emoji}</button>`;
  });
  newHtml += "</div>";

  reactionsSection.innerHTML = newHtml;

  // Re-attach handlers
  reactionsSection.querySelectorAll(".reaction-btn").forEach((btn) => {
    btn.onclick = () => handleReactionClick(btn);
  });

  const newAddBtn = reactionsSection.querySelector(".add-reaction-btn");
  newAddBtn.onclick = (e) => {
    e.stopPropagation();
    document.querySelectorAll(".reactions-picker.open").forEach((p) => {
      if (p !== reactionsSection.querySelector(".reactions-picker")) {
        p.classList.remove("open");
      }
    });
    reactionsSection
      .querySelector(".reactions-picker")
      .classList.toggle("open");
  };

  reactionsSection.querySelectorAll(".picker-emoji-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      handlePickerReaction(btn);
    };
  });
}

// --- UPDATED: OPTIMISTIC REACTION HANDLER ---
function handleReactionClick(btn) {
  const commentId = btn.dataset.commentId;
  const reaction = btn.dataset.reaction;

  if (btn.disabled) return;

  const alreadyReacted = hasUserReacted(commentId, reaction);
  const action = alreadyReacted ? "remove" : "add";

  if (action === "add") {
    saveUserReaction(commentId, reaction);
  } else {
    removeUserReaction(commentId, reaction);
  }

  sendReactionToBackend(commentId, reaction, action);
  refreshCommentReactions(commentId, reaction, action);
}

// --- DISPLAY COMMENTS ---
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
