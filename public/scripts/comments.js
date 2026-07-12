const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwppSLRMgpevtJXv0Dh19g6x4Mrl2Nk5c7e9-gsiVYKjgomy9scFHWAchsqvGSmh_Ns/exec";

let path = window.location.pathname;
if (path === "/" || path === "/index.html" || path === "") path = "index";
else path = path.replace(".html", "").replace(/^\//, "");
const page_url = path;

let sortNewestFirst = true;

const REACTIONS = [
  {
    id: "heart",
    url: "https://sp1cyp3pp3r.neocities.org/assets/reactions/heart.gif",
    alt: "Hearts",
  },
  {
    id: "like",
    url: "https://sp1cyp3pp3r.neocities.org/assets/reactions/like.gif",
    alt: "Thumbs up",
  },
  {
    id: "skull",
    url: "https://sp1cyp3pp3r.neocities.org/assets/reactions/skull.gif",
    alt: "Skull",
  },
];

let allCommentsData = [];

// --- LOCAL STORAGE ---
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
    if (userReactions[comment_id].length === 0)
      delete userReactions[comment_id];
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

// --- REACTIONS HTML BUILDER ---
function buildReactionsHtml(commentId) {
  const comment = allCommentsData.find((c) => c.comment_id === commentId);
  if (!comment) return "";

  const reactions = comment.reactions || {};
  const userReactionList = getUserReactions()[commentId] || [];

  let html = '<div class="reactions" role="group" aria-label="Reactions">';

  REACTIONS.forEach((reaction) => {
    const count = reactions[reaction.id] || 0;
    if (count > 0) {
      const reacted = userReactionList.includes(reaction.id);
      html += `<button class="reaction-btn ${reacted ? "reacted" : ""}" data-comment-id="${commentId}" data-reaction="${reaction.id}" aria-label="${reaction.alt}: ${count}" aria-pressed="${reacted}">
                <img src="${reaction.url}" alt="${reaction.alt}" class="reaction-img">
                <span class="reaction-count">${count}</span>
            </button>`;
    }
  });

  html += `<button class="add-reaction-btn" data-comment-id="${commentId}" aria-label="Add reaction" aria-expanded="false">
        <span class="add-reaction-icon">+</span>
    </button>`;

  html +=
    '<div class="reactions-picker" role="listbox" aria-label="Choose a reaction">';
  REACTIONS.forEach((reaction) => {
    html += `<button class="picker-btn" data-comment-id="${commentId}" data-reaction="${reaction.id}" role="option" aria-label="${reaction.alt}">
            <img src="${reaction.url}" alt="${reaction.alt}" class="picker-img">
        </button>`;
  });
  html += "</div></div>";

  return html;
}

// --- ATTACH HANDLERS ---
function attachReactionHandlers(card) {
  card.querySelectorAll(".reaction-btn").forEach((btn) => {
    btn.onclick = () => handleReactionClick(btn);
  });

  const addBtn = card.querySelector(".add-reaction-btn");
  if (addBtn) {
    addBtn.onclick = (e) => {
      e.stopPropagation();
      document.querySelectorAll(".reactions-picker.open").forEach((p) => {
        if (p !== card.querySelector(".reactions-picker")) {
          p.classList.remove("open");
          p.previousElementSibling?.setAttribute("aria-expanded", "false");
        }
      });
      const picker = card.querySelector(".reactions-picker");
      const isOpen = picker.classList.toggle("open");
      addBtn.setAttribute("aria-expanded", isOpen);
    };
  }

  card.querySelectorAll(".picker-btn").forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      handlePickerReaction(btn);
    };
  });
}

// --- REFRESH REACTIONS ---
function refreshCommentReactions(commentId) {
  const card = document.querySelector(`[data-comment-id="${commentId}"]`);
  if (!card) return;

  const oldSection = card.querySelector(".reactions");
  const newHtml = buildReactionsHtml(commentId);

  if (oldSection) {
    oldSection.outerHTML = newHtml;
  }

  attachReactionHandlers(card.closest(".comment-card") || card);
}

// --- SEND TO BACKEND ---
function sendReactionToBackend(commentId, reaction, action) {
  const script = document.createElement("script");
  script.src = `${GOOGLE_SCRIPT_URL}?action=react&comment_id=${commentId}&reaction=${encodeURIComponent(reaction)}&react_action=${action}&page_url=${page_url}`;
  document.body.appendChild(script);
  setTimeout(() => {
    if (script.parentNode) script.parentNode.removeChild(script);
  }, 5000);
}

// --- HANDLE REACTION CLICK ---
function handleReactionClick(btn) {
  if (btn.disabled) return;
  const commentId = btn.dataset.commentId;
  const reaction = btn.dataset.reaction;
  const comment = allCommentsData.find((c) => c.comment_id === commentId);
  if (!comment) return;

  const alreadyReacted = hasUserReacted(commentId, reaction);

  if (alreadyReacted) {
    removeUserReaction(commentId, reaction);
    if (comment.reactions?.[reaction]) {
      comment.reactions[reaction]--;
      if (comment.reactions[reaction] <= 0) delete comment.reactions[reaction];
    }
    sendReactionToBackend(commentId, reaction, "remove");
  } else {
    saveUserReaction(commentId, reaction);
    if (!comment.reactions) comment.reactions = {};
    if (!comment.reactions[reaction]) comment.reactions[reaction] = 0;
    comment.reactions[reaction]++;
    sendReactionToBackend(commentId, reaction, "add");
  }

  refreshCommentReactions(commentId);
}

// --- HANDLE PICKER REACTION ---
function handlePickerReaction(btn) {
  const commentId = btn.dataset.commentId;
  const reaction = btn.dataset.reaction;

  btn.closest(".reactions-picker")?.classList.remove("open");
  const addBtn = btn
    .closest(".reactions-section, .reactions")
    ?.querySelector(".add-reaction-btn");
  if (addBtn) addBtn.setAttribute("aria-expanded", "false");

  const comment = allCommentsData.find((c) => c.comment_id === commentId);
  if (!comment) return;

  if (hasUserReacted(commentId, reaction)) {
    removeUserReaction(commentId, reaction);
    if (comment.reactions?.[reaction]) {
      comment.reactions[reaction]--;
      if (comment.reactions[reaction] <= 0) delete comment.reactions[reaction];
    }
    sendReactionToBackend(commentId, reaction, "remove");
  } else {
    saveUserReaction(commentId, reaction);
    if (!comment.reactions) comment.reactions = {};
    if (!comment.reactions[reaction]) comment.reactions[reaction] = 0;
    comment.reactions[reaction]++;
    sendReactionToBackend(commentId, reaction, "add");
  }

  refreshCommentReactions(commentId);
}

// --- BUILD COMMENT HTML ---
function renderCommentTree(comment, allComments, depth = 0) {
  const article = document.createElement("article");
  article.className = "comment-card";
  article.setAttribute("data-comment-id", comment.comment_id);
  article.setAttribute("role", "article");
  article.setAttribute("aria-label", `Comment by ${comment.name}`);

  if (depth > 0) {
    article.classList.add("reply-card");
    const indent = Math.min(depth * 20, 60);
    article.style.setProperty("--indent", indent + "px");
  }

  // Avatar (CSS variable, no <img>)
  const avatarStyle = comment.avatar_url
    ? `style="--avatar-url: url('${escapeHTML(comment.avatar_url)}')"`
    : "";

  // Neocities link
  let neocitiesHtml = "";
  if (comment.neocities) {
    let urlStr = comment.neocities.trim();
    if (!urlStr.startsWith("http")) urlStr = "https://" + urlStr;
    try {
      let domain = new URL(urlStr).hostname;
      let cleanDomain = domain.replace(/^www\./, "");
      let faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
      neocitiesHtml = `<a href="${escapeHTML(urlStr)}" target="_blank" rel="noopener" class="comment-address neocities" aria-label="Visit ${escapeHTML(cleanDomain)}">
                <img src="${faviconUrl}" alt="" class="comment-favicon" aria-hidden="true">
                ${escapeHTML(cleanDomain)}
            </a>`;
    } catch (e) {
      neocitiesHtml = `<a href="${escapeHTML(urlStr)}" target="_blank" rel="noopener" class="comment-address neocities">Visit Site</a>`;
    }
  }

  // Mood
  const moodHtml = comment.mood
    ? `<span class="mood" aria-label="Mood: ${escapeHTML(comment.mood)}">${escapeHTML(comment.mood)}</span>`
    : "";

  // Date
  const dateStr = formatDate(comment.timestamp);
  const dateHtml = dateStr
    ? `<time class="date" datetime="${escapeHTML(comment.timestamp)}">${dateStr}</time>`
    : "";

  // Reactions
  const reactionsHtml = buildReactionsHtml(comment.comment_id);

  // Assemble
  article.innerHTML = `
        <div class="comment-wrapper">
            <div class="comment-aside avatar" ${avatarStyle} role="img" aria-label="${escapeHTML(comment.name)}'s avatar"></div>
            <header class="comment-header" role="group" aria-label="Comment metadata">
                <hgroup class="comment-hgroup">
                    <span class="name">${escapeHTML(comment.name)}</span>
                    ${moodHtml}
                </hgroup>
                ${dateHtml}
            </header>
            <main class="comment-main" role="region" aria-label="Comment content">
                <div class="content">${escapeHTML(comment.comment_content)}</div>
            </main>
            <footer class="comment-footer" role="group" aria-label="Comment actions">
                ${neocitiesHtml}
                ${reactionsHtml}
                <button class="reply" aria-label="Reply to ${escapeHTML(comment.name)}">Reply</button>
            </footer>
        </div>
        <div class="replies-container" role="group" aria-label="Replies"></div>
    `;

  // Reply button
  article.querySelector(".reply").onclick = () =>
    startReply(comment.comment_id, comment.name);

  // Reaction handlers
  attachReactionHandlers(article);

  // Render children into replies-container
  const children = allComments.filter(
    (c) => c.parent_id === comment.comment_id,
  );
  const repliesContainer = article.querySelector(".replies-container");

  children.forEach((child) => {
    const childElement = renderCommentTree(child, allComments, depth + 1);
    repliesContainer.appendChild(childElement);
  });

  return article;
}

// --- DISPLAY COMMENTS ---
function displayComments(comments) {
  const container = document.getElementById("commentsContainer");
  container.innerHTML = "";
  allCommentsData = comments || [];

  if (allCommentsData.length === 0) {
    container.innerHTML = "<p>No comments yet. Be the first!</p>";
    return;
  }

  let topLevel = allCommentsData.filter(
    (c) => !c.parent_id || c.parent_id === "",
  );
  topLevel.forEach((item) => {
    container.appendChild(renderCommentTree(item, allCommentsData, 0));
  });
}

// --- SORT TOGGLE ---
document.addEventListener("click", function (e) {
  if (e.target && e.target.id === "sortToggleBtn") {
    sortNewestFirst = !sortNewestFirst;
    e.target.innerText = sortNewestFirst
      ? "Sort: Newest First"
      : "Sort: Oldest First";
    document
      .getElementById("commentsContainer")
      .style.setProperty(
        "--flex-direction",
        sortNewestFirst ? "column-reverse" : "column",
      );
  }
});

// --- CLOSE PICKERS ON OUTSIDE CLICK ---
document.addEventListener("click", function (e) {
  if (!e.target.closest(".reactions")) {
    document.querySelectorAll(".reactions-picker.open").forEach((p) => {
      p.classList.remove("open");
      const addBtn = p.previousElementSibling;
      if (addBtn) addBtn.setAttribute("aria-expanded", "false");
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

    const script = document.createElement("script");
    script.id = "tempSubmitScript";
    script.src = `${GOOGLE_SCRIPT_URL}?neocities=${neocities}&name=${name}&email=${email}&comment_content=${comment_content}&parent_id=${parent_id}&avatar_url=${avatar_url}&mood=${mood}&page_url=${page_url}&callback=handleSubmissionResponse`;
    document.body.appendChild(script);
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
