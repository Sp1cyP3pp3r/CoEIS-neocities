// Select all checkboxes in the row
const checkboxes = document.querySelectorAll(".row-box");

checkboxes.forEach((checkbox, index) => {
  checkbox.addEventListener("change", function () {
    // Only trigger logic if the checkbox is being checked
    if (this.checked) {
      // Loop through all checkboxes after the current one
      for (let i = index + 1; i < checkboxes.length; i++) {
        checkboxes[i].checked = true;
      }
    }
  });
});
