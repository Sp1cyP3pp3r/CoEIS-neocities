// PASTE YOUR WEB APP URL HERE
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzGiK5vt9mFNdJfruPORYRWHjjVRjRAhdEycIoSp4ZvAio2Ot5ehyyoUcjIpVOmzqAO/exec";

// Dynamically get the current page's path (e.g., /about or /blog/post1)
let path = window.location.pathname;

// If it's the homepage, standardize it to 'index'
if (path === "/" || path === "/index.html" || path === "") {
  path = "index";
} else {
  // For other pages, remove '.html' and the leading slash (e.g., /about.html -> about)
  path = path.replace(".html", "").replace(/^\//, "");
}

const page_url = path;

// READ FUNCTION: Handles displaying data on page load
function displayComments(comments) {
  const container = document.getElementById("commentsContainer");
  if (!comments || comments.length === 0) {
    container.innerHTML = "<p>No comments yet. Be the first to comment!</p>";
    return;
  }

  container.innerHTML = "<h3>What Visitors Said...</h3>";
  // Show newest comments first
  comments.reverse().forEach((item) => {
    const card = document.createElement("div");
    card.className = "comment-card";

    card.innerHTML = `
            <div class="comment-meta"><strong>${escapeHTML(item.name)}</strong></div>
            <div class="comment-text">${escapeHTML(item.comment)}</div>
        `;
    container.appendChild(card);
  });
}

// Automatically load existing comments on page load using JSONP
const loadScript = document.createElement("script");
loadScript.src = `${GOOGLE_SCRIPT_URL}?callback=displayComments&page_url=${page_url}`;
document.body.appendChild(loadScript);

// Handle Submission Response
function handleSubmissionResponse(response) {
  const statusText = document.getElementById("formStatus");
  const submitBtn = document.getElementById("submitBtn");

  if (response.status === "success") {
    statusText.style.color = "green";
    statusText.innerText = response.message;
    document.getElementById("guestbookForm").reset();

    // Optional: Reload the page or re-trigger displayComments to show the new comment immediately
    setTimeout(() => {
      location.reload();
    }, 1500);
  } else {
    statusText.style.color = "red";
    statusText.innerText = response.message || "An error occurred.";
  }
  submitBtn.disabled = false;

  // Clean up the temporary script tag used for submission
  const tempScript = document.getElementById("tempSubmitScript");
  if (tempScript) tempScript.remove();
}

// Save Comment
document
  .getElementById("guestbookForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const submitBtn = document.getElementById("submitBtn");
    const statusText = document.getElementById("formStatus");

    submitBtn.disabled = true;
    statusText.style.display = "block";
    statusText.innerText = "Saving your entry...";

    const name = encodeURIComponent(document.getElementById("name").value);
    const email = encodeURIComponent(document.getElementById("email").value);
    const comment = encodeURIComponent(
      document.getElementById("comment").value,
    );

    // Send data to Google Apps Script using JSONP
    const submissionUrl = `${GOOGLE_SCRIPT_URL}?name=${name}&email=${email}&comment=${comment}&page_url=${page_url}&callback=handleSubmissionResponse`;

    const submitScript = document.createElement("script");
    submitScript.id = "tempSubmitScript";
    submitScript.src = submissionUrl;
    document.body.appendChild(submitScript);
  });

// Helper to prevent script injection (XSS)
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
