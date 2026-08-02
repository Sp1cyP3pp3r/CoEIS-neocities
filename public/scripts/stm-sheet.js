document.addEventListener("DOMContentLoaded", () => {
  const checkboxes = document.querySelectorAll(".row-box");

  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("row-box")) {
      const index = Array.prototype.indexOf.call(checkboxes, e.target);
      if (index === -1) return;

      const isChecked = e.target.checked;
      const len = checkboxes.length;

      if (isChecked) {
        for (let i = 0; i <= index; i++) checkboxes[i].checked = true;
        for (let i = index + 1; i < len; i++) checkboxes[i].checked = false;
      } else {
        for (let i = index; i < len; i++) checkboxes[i].checked = false;
      }
    }
  });
});
